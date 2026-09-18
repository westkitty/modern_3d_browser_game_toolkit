export type PerformanceScenario = "baseline" | "movement" | "streaming" | "resource-churn" | "crowd";

export const PERFORMANCE_SCENARIOS: readonly PerformanceScenario[] = [
  "baseline",
  "movement",
  "streaming",
  "resource-churn",
  "crowd"
];

export class SampleWindow {
  private readonly values: number[] = [];
  constructor(private readonly max = 180) {}

  push(value: number): void {
    if (!Number.isFinite(value)) return;
    this.values.push(value);
    if (this.values.length > this.max) this.values.shift();
  }

  summary(): { count: number; mean: number; p95: number; max: number } {
    if (!this.values.length) return { count: 0, mean: 0, p95: 0, max: 0 };
    const sorted = [...this.values].sort((a, b) => a - b);
    const sum = this.values.reduce((total, value) => total + value, 0);
    return {
      count: this.values.length,
      mean: sum / this.values.length,
      p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0,
      max: sorted[sorted.length - 1] ?? 0
    };
  }

  clear(): void { this.values.length = 0; }
}

export function kinematicCollisionWork(iterations: number): number {
  let x = -8;
  let z = -3;
  let vx = 3.2;
  let vz = 2.1;
  let contacts = 0;
  for (let i = 0; i < iterations; i += 1) {
    x += vx / 60;
    z += vz / 60;
    if (x > 8 || x < -8) { vx *= -1; x = Math.max(-8, Math.min(8, x)); contacts += 1; }
    if (z > 5 || z < -5) { vz *= -1; z = Math.max(-5, Math.min(5, z)); contacts += 1; }
    if (x > -1.2 && x < 1.2 && z > -0.5 && z < 0.5) {
      z = vz > 0 ? -0.5 : 0.5;
      vz *= -1;
      contacts += 1;
    }
  }
  return contacts;
}

export function streamedZoneChurn(step: number, zoneCount = 96): number {
  const x = Math.sin(step * 0.045) * 24;
  const z = Math.cos(step * 0.037) * 18;
  let active = 0;
  for (let i = 0; i < zoneCount; i += 1) {
    const zx = ((i * 13) % 23) - 11;
    const zz = ((i * 17) % 19) - 9;
    if (Math.hypot(zx * 2 - x, zz * 2 - z) < 7.5) active += 1;
  }
  return active;
}
