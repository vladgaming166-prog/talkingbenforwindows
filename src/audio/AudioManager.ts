export type SoundId =
  | 'ui-click'
  | 'ui-toggle'
  | 'react-laugh'
  | 'react-surprise'
  | 'react-angry'
  | 'react-confused'
  | 'ambient'
  | 'phone_ring'
  | 'burp'
  | 'glass'
  | 'eat'
  | 'drink'
  | 'boom';

export type VoiceLineId = 'ben' | 'yes' | 'no' | 'ugh' | 'ha_ha_ha' | 'ah' | 'ow' | 'ouch' | 'hmm';

export interface AudioManagerOptions {
  volume?: number;
  sfxVolume?: number;
}

/**
 * Central audio: original voice WAVs + procedural SFX. No advertising audio.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master = 0.9;
  private sfx = 0.55;
  private muted = false;
  private ambientNode: { stop: () => void } | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private currentVoice: AudioBufferSourceNode | null = null;
  private voiceUrls: Record<VoiceLineId, string> = {
    ben: '../assets/voices/ben.wav',
    yes: '../assets/voices/yes.wav',
    no: '../assets/voices/no.wav',
    ugh: '../assets/voices/ugh.wav',
    ha_ha_ha: '../assets/voices/ha_ha_ha.wav',
    ah: '../assets/voices/ah.wav',
    ow: '../assets/voices/ow.wav',
    ouch: '../assets/voices/ouch.wav',
    hmm: '../assets/voices/hmm.wav',
  };

  constructor(options: AudioManagerOptions = {}) {
    this.master = options.volume ?? 0.9;
    this.sfx = options.sfxVolume ?? 0.55;
  }

  async unlock(): Promise<void> {
    const ctx = this.ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    await this.preload();
  }

  async preload(): Promise<void> {
    const entries = Object.entries(this.voiceUrls) as [VoiceLineId, string][];
    await Promise.all(
      entries.map(async ([id, url]) => {
        try {
          await this.loadBuffer(`voice:${id}`, url);
        } catch {
          /* optional */
        }
      }),
    );
    try {
      await this.loadBuffer('sfx:phone_ring', '../assets/sfx/phone_ring.wav');
    } catch {
      /* optional */
    }
    try {
      await this.loadBuffer('sfx:burp', '../assets/sfx/burp.wav');
    } catch {
      /* optional */
    }
  }

  setVolume(v: number): void {
    this.master = clamp(v, 0, 1);
  }

  setSfxVolume(v: number): void {
    this.sfx = clamp(v, 0, 1);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopVoice();
      this.stopAmbient();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(id: SoundId): void {
    if (this.muted) return;
    try {
      const ctx = this.ensureCtx();
      if (id === 'phone_ring') {
        const buf = this.buffers.get('sfx:phone_ring');
        if (buf) {
          this.playBuffer(buf, this.master * this.sfx);
          return;
        }
        this.beep(ctx, 820, 0.18, 'sine', 0.12);
        this.beep(ctx, 620, 0.18, 'sine', 0.12, 0.22);
        return;
      }
      if (id === 'burp') {
        const buf = this.buffers.get('sfx:burp');
        if (buf) {
          this.playBuffer(buf, this.master * this.sfx * 1.2);
          return;
        }
      }
      switch (id) {
        case 'ui-click':
          this.beep(ctx, 880, 0.04, 'triangle', 0.08);
          break;
        case 'ui-toggle':
          this.beep(ctx, 520, 0.06, 'sine', 0.1);
          break;
        case 'react-laugh':
          void this.playVoice('ha_ha_ha');
          break;
        case 'react-surprise':
          this.beep(ctx, 640, 0.12, 'square', 0.12);
          break;
        case 'react-angry':
          this.beep(ctx, 180, 0.18, 'sawtooth', 0.14);
          break;
        case 'react-confused':
          void this.playVoice('hmm');
          break;
        case 'glass':
          this.beep(ctx, 1200, 0.05, 'triangle', 0.1);
          this.beep(ctx, 1800, 0.08, 'triangle', 0.08, 0.05);
          break;
        case 'eat':
          this.beep(ctx, 220, 0.05, 'square', 0.06);
          this.beep(ctx, 180, 0.05, 'square', 0.06, 0.07);
          this.beep(ctx, 240, 0.05, 'square', 0.06, 0.14);
          break;
        case 'drink':
          this.beep(ctx, 160, 0.08, 'sine', 0.08);
          this.beep(ctx, 140, 0.08, 'sine', 0.08, 0.1);
          this.beep(ctx, 120, 0.1, 'sine', 0.08, 0.2);
          break;
        case 'boom':
          this.beep(ctx, 80, 0.35, 'sawtooth', 0.2);
          break;
        case 'ambient':
          this.startAmbient();
          break;
        default:
          break;
      }
    } catch {
      /* never crash */
    }
  }

  async playVoice(id: VoiceLineId): Promise<number> {
    if (this.muted) return 0;
    await this.unlock();
    const key = `voice:${id}`;
    let buf = this.buffers.get(key);
    if (!buf) {
      try {
        buf = await this.loadBuffer(key, this.voiceUrls[id]);
      } catch {
        // Fallback: speak via Web Speech if wav missing
        return this.speakFallback(id);
      }
    }
    this.stopVoice();
    const ctx = this.ensureCtx();
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    // Slightly lower pitch for gruff Ben feel
    src.playbackRate.value = 0.88;
    gain.gain.value = this.master;
    src.connect(gain);
    gain.connect(ctx.destination);
    this.currentVoice = src;
    const duration = (buf.duration / 0.88) * 1000;
    return new Promise((resolve) => {
      src.onended = () => {
        this.currentVoice = null;
        resolve(duration);
      };
      src.start();
      // safety
      window.setTimeout(() => resolve(duration), duration + 80);
    });
  }

  stopVoice(): void {
    try {
      this.currentVoice?.stop();
    } catch {
      /* ignore */
    }
    this.currentVoice = null;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  private speakFallback(id: VoiceLineId): Promise<number> {
    const map: Record<VoiceLineId, string> = {
      ben: 'Ben.',
      yes: 'Yes.',
      no: 'No.',
      ugh: 'Ugh.',
      ha_ha_ha: 'Ha ha ha!',
      ah: 'Ah!',
      ow: 'Ow!',
      ouch: 'Ouch!',
      hmm: 'Hmm?',
    };
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve(600);
        return;
      }
      const u = new SpeechSynthesisUtterance(map[id]);
      u.rate = 0.85;
      u.pitch = 0.55;
      u.volume = this.master;
      u.onend = () => resolve(800);
      window.speechSynthesis.speak(u);
      window.setTimeout(() => resolve(800), 1200);
    });
  }

  startAmbient(): void {
    if (this.muted || this.ambientNode) return;
    try {
      const ctx = this.ensureCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = 90;
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      gain.gain.value = 0.01 * this.master * this.sfx;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      this.ambientNode = {
        stop: () => {
          try {
            osc.stop();
            osc.disconnect();
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

  private async loadBuffer(key: string, url: string): Promise<AudioBuffer> {
    const ctx = this.ensureCtx();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Missing audio ${url}`);
    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr.slice(0));
    this.buffers.set(key, buf);
    return buf;
  }

  private playBuffer(buf: AudioBuffer, volume: number): void {
    const ctx = this.ensureCtx();
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
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
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
