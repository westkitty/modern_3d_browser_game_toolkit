export interface LabyrinthAudio {
  unlock(): Promise<void>;
  chime(): void;
  dispose(): void;
  readonly unlocked: boolean;
}
export function createLabyrinthAudio(): LabyrinthAudio {
  let context: AudioContext | null = null;
  let unlocked = false;
  let disposed = false;
  let pending: Promise<void> | null = null;
  return {
    get unlocked() { return unlocked; },
    unlock() {
      if (disposed || unlocked) return Promise.resolve();
      if (pending) return pending;
      const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return Promise.resolve();
      let next: AudioContext;
      try { next = new Ctor(); }
      catch { return Promise.resolve(); }
      context = next;
      pending = (async () => {
        try {
          if (next.state === "suspended") await next.resume();
          if (disposed) { await next.close(); context = null; return; }
          unlocked = true;
        } catch {
          if (context === next) context = null;
          await next.close().catch(() => undefined);
          unlocked = false;
        }
      })().finally(() => { pending = null; });
      return pending;
    },
    chime() {
      if (!context || !unlocked || disposed) return;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.frequency.value = 660;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.12);
    },
    dispose() {
      disposed = true;
      unlocked = false;
      const previous = context;
      context = null;
      if (previous && !pending) void previous.close().catch(() => undefined);
    }
  };
}
