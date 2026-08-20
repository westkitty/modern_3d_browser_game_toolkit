export interface LabyrinthAudio {
  unlock(): Promise<void>;
  chime(): void;
  dispose(): void;
  readonly unlocked: boolean;
}

export function createLabyrinthAudio(): LabyrinthAudio {
  let context: AudioContext | null = null;
  let unlocked = false;

  return {
    get unlocked() {
      return unlocked;
    },
    async unlock() {
      if (unlocked) return;
      const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      context = new Ctor();
      if (context.state === "suspended") await context.resume();
      unlocked = true;
    },
    chime() {
      if (!context || !unlocked) return;
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
      void context?.close();
      context = null;
      unlocked = false;
    }
  };
}
