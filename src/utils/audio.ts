/**
 * Tiny Web Audio sound effects module.
 *
 * Goals:
 *  - Zero asset files: every effect is synthesised on demand from a couple of
 *    oscillators + envelopes, so the production bundle is unchanged.
 *  - Lazily created AudioContext so browsers don't flag "audio before
 *    interaction"; the first call to `getContext()` resumes it on demand.
 *  - Respect a `getEnabled()` flag so the UI can mute everything.
 *
 * The exported helpers (playBallBounce, playBrickBreak, playCoin, playPurchase,
 * playPrestige) are intentionally fire-and-forget; failures are swallowed so a
 * missing AudioContext (e.g. in tests or some browsers) never breaks the game.
 */

export type SoundName = 'ballBounce' | 'brickBreak' | 'coin' | 'purchase' | 'prestige';

interface AudioModule {
  getContext: () => AudioContext | null;
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => void;
  play: (name: SoundName) => void;
}

interface EnvelopeOptions {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  peak: number;
}

const DEFAULT_ENVELOPE: EnvelopeOptions = {
  attack: 0.005,
  decay: 0.05,
  sustain: 0.4,
  release: 0.12,
  peak: 0.18,
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const applyEnvelope = (
  gain: GainNode,
  startTime: number,
  options: Partial<EnvelopeOptions> = {}
): number => {
  const env: EnvelopeOptions = { ...DEFAULT_ENVELOPE, ...options };
  const { attack, decay, sustain, release, peak } = env;
  const safePeak = clamp(peak, 0, 1);

  gain.gain.cancelScheduledValues(startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(safePeak, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, safePeak * sustain),
    startTime + attack + decay
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    startTime + attack + decay + release
  );

  return startTime + attack + decay + release;
};

const createBlip = (
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  options: Partial<EnvelopeOptions> = {}
): void => {
  const start = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  const stopAt = applyEnvelope(gain, start, options);
  oscillator.start(start);
  oscillator.stop(stopAt + 0.02);
};

const createNoiseBurst = (
  ctx: AudioContext,
  durationMs: number,
  options: Partial<EnvelopeOptions> = {}
): void => {
  const start = ctx.currentTime;
  const sampleCount = Math.max(1, Math.floor((durationMs / 1000) * ctx.sampleRate));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    channel[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  applyEnvelope(gain, start, options);
  source.start(start);
  source.stop(start + durationMs / 1000 + 0.05);
};

const playBallBounce = (ctx: AudioContext) => {
  createBlip(ctx, 420, 'sine', { attack: 0.002, decay: 0.04, sustain: 0.2, release: 0.05, peak: 0.12 });
};

const playBrickBreak = (ctx: AudioContext) => {
  createNoiseBurst(ctx, 80, { attack: 0.002, decay: 0.05, sustain: 0.1, release: 0.04, peak: 0.18 });
  createBlip(ctx, 240, 'square', { attack: 0.001, decay: 0.03, sustain: 0.1, release: 0.04, peak: 0.08 });
};

const playCoin = (ctx: AudioContext) => {
  const start = ctx.currentTime;
  createBlip(ctx, 880, 'sine', { attack: 0.001, decay: 0.04, sustain: 0.0, release: 0.05, peak: 0.14 });
  // Second note slightly higher
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1320, start + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  applyEnvelope(gain, start + 0.05, { attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.06, peak: 0.14 });
  osc.start(start + 0.05);
  osc.stop(start + 0.18);
};

const playPurchase = (ctx: AudioContext) => {
  const start = ctx.currentTime;
  createBlip(ctx, 660, 'triangle', { attack: 0.001, decay: 0.04, sustain: 0.0, release: 0.06, peak: 0.16 });
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(990, start + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  applyEnvelope(gain, start + 0.06, { attack: 0.001, decay: 0.06, sustain: 0.0, release: 0.08, peak: 0.16 });
  osc.start(start + 0.06);
  osc.stop(start + 0.22);
};

const playPrestige = (ctx: AudioContext) => {
  const start = ctx.currentTime;
  // Three ascending notes
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start + index * 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    applyEnvelope(gain, start + index * 0.08, {
      attack: 0.002,
      decay: 0.08,
      sustain: 0.1,
      release: 0.18,
      peak: 0.18,
    });
    osc.start(start + index * 0.08);
    osc.stop(start + index * 0.08 + 0.4);
  });
};

const SOUND_PLAYERS: Record<SoundName, (ctx: AudioContext) => void> = {
  ballBounce: playBallBounce,
  brickBreak: playBrickBreak,
  coin: playCoin,
  purchase: playPurchase,
  prestige: playPrestige,
};

/**
 * Returns the singleton audio module. The module is intentionally a plain
 * object (not a React hook) so it can be called from Phaser code paths
 * (`useGameStore.getState().purchaseBall(...)`) and from React components.
 *
 * Stored on `globalThis` so HMR, dynamic imports, and module duplication in
 * tests all return the same instance.
 */
const GLOBAL_KEY = '__idleBricksAudioModule__';

const buildAudioModule = (): AudioModule => {
  let context: AudioContext | null = null;
  let enabled = true;

  const getContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (context) return context;
    const AudioCtor: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    try {
      context = new AudioCtor();
    } catch {
      context = null;
    }
    return context;
  };

  const resume = (ctx: AudioContext) => {
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {
        // Ignore resume failures; we'll try again on the next play().
      });
    }
  };

  const play = (name: SoundName) => {
    if (!enabled) return;
    const ctx = getContext();
    if (!ctx) return;
    resume(ctx);
    try {
      SOUND_PLAYERS[name](ctx);
    } catch {
      // Swallow audio errors: missing context, autoplay policy, etc.
    }
  };

  return {
    getContext,
    isEnabled: () => enabled,
    setEnabled: (next) => {
      enabled = next;
    },
    play,
  };
};

export const getAudioModule = (): AudioModule => {
  const globalScope = globalThis as unknown as { [GLOBAL_KEY]?: AudioModule };
  if (!globalScope[GLOBAL_KEY]) {
    globalScope[GLOBAL_KEY] = buildAudioModule();
  }
  return globalScope[GLOBAL_KEY]!;
};

/** Convenience helper for callers that just want a one-liner. */
export const playSound = (name: SoundName): void => {
  getAudioModule().play(name);
};
