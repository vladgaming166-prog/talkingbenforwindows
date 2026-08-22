export type SoundId =
  | 'ui-click'
  | 'ui-toggle'
  | 'react-laugh'
  | 'react-surprise'
  | 'react-angry'
  | 'react-confused'
  | 'ambient';

export interface AudioManagerOptions {
  volume?: number;
  sfxVolume?: number;
}

/**
 * Centralized Web Audio manager. Procedural sounds only — no external ad audio.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master = 0.9;
  private sfx = 0.55;
  private muted = false;
  private ambientNode: { stop: () => void } | null = null;
  private unlocked = false;

  constructor(options: AudioManagerOptions = {}) {
    this.master = options.volume ?? 0.9;
    this.sfx = options.sfxVolume ?? 0.55;
  }

  async unlock(): Promise<void> {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    this.unlocked = true;
  }

  setVolume(v: number): void {
    this.master = clamp(v, 0, 1);
  }

  setSfxVolume(v: number): void {
    this.sfx = clamp(v, 0, 1);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.stopAmbient();
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(id: SoundId): void {
    if (this.muted) return;
    try {
      const ctx = this.ensureCtx();
      switch (id) {
        case 'ui-click':
          this.beep(ctx, 880, 0.04, 'triangle', 0.08);
          break;
        case 'ui-toggle':
          this.beep(ctx, 520, 0.06, 'sine', 0.1);
          break;
        case 'react-laugh':
          this.laugh(ctx);
          break;
        case 'react-surprise':
          this.beep(ctx, 640, 0.12, 'square', 0.12);
          this.beep(ctx, 920, 0.1, 'square', 0.1, 0.08);
          break;
        case 'react-angry':
          this.beep(ctx, 180, 0.18, 'sawtooth', 0.14);
          break;
        case 'react-confused':
          this.beep(ctx, 330, 0.1, 'sine', 0.1);
          this.beep(ctx, 290, 0.12, 'sine', 0.1, 0.1);
          break;
        case 'ambient':
          this.startAmbient();
          break;
      }
    } catch {
      // Audio failures must never crash the app
    }
  }

  startAmbient(): void {
    if (this.muted || this.ambientNode) return;
    try {
      const ctx = this.ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = 110;
      filter.type = 'lowpass';
      filter.frequency.value = 240;
      gain.gain.value = 0.015 * this.master * this.sfx;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      this.ambientNode = {
        stop: () => {
          try {
            osc.stop();
            osc.disconnect();
            gain.disconnect();
          } catch {
            /* ignore */
          }
        },
      };
    } catch {
      /* ignore */
    }
  }

  stopAmbient(): void {
    this.ambientNode?.stop();
    this.ambientNode = null;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  private beep(
    ctx: AudioContext,
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    delay = 0,
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const now = ctx.currentTime + delay;
    const level = vol * this.master * this.sfx;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private laugh(ctx: AudioContext): void {
    const notes = [420, 520, 480, 560, 500];
    notes.forEach((f, i) => this.beep(ctx, f, 0.07, 'triangle', 0.1, i * 0.07));
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
