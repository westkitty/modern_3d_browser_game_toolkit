export interface StreamZone {
  id: string;
  x: number;
  z: number;
  loadRadius: number;
  retainRadius: number;
}

export type ZoneState = "idle" | "queued" | "loading" | "active" | "error";

export interface ZoneRecord<T> {
  zone: StreamZone;
  state: ZoneState;
  value: T | null;
  error: string | null;
  generation: number;
}

export interface ZoneStreamerOptions<T> {
  zones: StreamZone[];
  concurrency?: number;
  load(zone: StreamZone): Promise<T>;
  activate(zone: StreamZone, value: T): void;
  deactivate(zone: StreamZone, value: T): void;
  dispose(zone: StreamZone, value: T): void;
  onStateChange?: () => void;
}

function distance(zone: StreamZone, x: number, z: number): number {
  return Math.hypot(zone.x - x, zone.z - z);
}

export function desiredZoneIds(zones: StreamZone[], x: number, z: number): string[] {
  return zones
    .filter((zone) => distance(zone, x, z) <= zone.loadRadius)
    .map((zone) => zone.id)
    .sort();
}

export class ZoneStreamer<T> {
  private readonly records = new Map<string, ZoneRecord<T>>();
  private readonly queue: string[] = [];
  private activeLoads = 0;
  private disposed = false;
  private x = 0;
  private z = 0;

  constructor(private readonly options: ZoneStreamerOptions<T>) {
    for (const zone of options.zones) {
      if (zone.retainRadius < zone.loadRadius) throw new Error(`Zone ${zone.id} retainRadius must be >= loadRadius.`);
      if (this.records.has(zone.id)) throw new Error(`Duplicate stream zone ${zone.id}.`);
      this.records.set(zone.id, { zone, state: "idle", value: null, error: null, generation: 0 });
    }
  }

  snapshot(): Array<{ id: string; state: ZoneState; error: string | null }> {
    return [...this.records.values()].map((record) => ({ id: record.zone.id, state: record.state, error: record.error }));
  }

  update(x: number, z: number): void {
    if (this.disposed) return;
    this.x = x;
    this.z = z;
    for (const record of this.records.values()) {
      const d = distance(record.zone, x, z);
      if (d <= record.zone.loadRadius && record.state === "idle") this.enqueue(record);
      if (d > record.zone.retainRadius) {
        if (record.state === "queued" || record.state === "loading") {
          record.generation += 1;
          record.state = "idle";
          record.error = null;
        } else if ((record.state === "active" || record.state === "error") && record.value) {
          this.options.deactivate(record.zone, record.value);
          this.options.dispose(record.zone, record.value);
          record.value = null;
          record.state = "idle";
          record.error = null;
          record.generation += 1;
        } else if (record.state === "error") {
          record.state = "idle";
          record.error = null;
          record.generation += 1;
        }
      }
    }
    this.options.onStateChange?.();
    this.pump();
  }

  private enqueue(record: ZoneRecord<T>): void {
    if (record.state !== "idle") return;
    record.state = "queued";
    record.error = null;
    this.queue.push(record.zone.id);
  }

  private pump(): void {
    const limit = Math.max(1, this.options.concurrency ?? 2);
    while (!this.disposed && this.activeLoads < limit && this.queue.length) {
      const id = this.queue.shift()!;
      const record = this.records.get(id);
      if (!record || record.state !== "queued") continue;
      if (distance(record.zone, this.x, this.z) > record.zone.loadRadius) {
        record.state = "idle";
        continue;
      }
      this.startLoad(record);
    }
  }

  private startLoad(record: ZoneRecord<T>): void {
    record.state = "loading";
    const generation = ++record.generation;
    this.activeLoads += 1;
    this.options.onStateChange?.();

    void this.options.load(record.zone).then(
      (value) => {
        const stale =
          this.disposed ||
          record.generation !== generation ||
          record.state !== "loading" ||
          distance(record.zone, this.x, this.z) > record.zone.retainRadius;
        if (stale) {
          this.options.dispose(record.zone, value);
          return;
        }
        record.value = value;
        record.state = "active";
        record.error = null;
        this.options.activate(record.zone, value);
      },
      (error) => {
        if (this.disposed || record.generation !== generation || record.state !== "loading") return;
        record.state = "error";
        record.error = error instanceof Error ? error.message : String(error);
      }
    ).finally(() => {
      this.activeLoads = Math.max(0, this.activeLoads - 1);
      this.options.onStateChange?.();
      this.pump();
    });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.queue.length = 0;
    for (const record of this.records.values()) {
      record.generation += 1;
      if (record.value) {
        if (record.state === "active") this.options.deactivate(record.zone, record.value);
        this.options.dispose(record.zone, record.value);
      }
      record.value = null;
      record.state = "idle";
      record.error = null;
    }
    this.options.onStateChange?.();
  }
}
