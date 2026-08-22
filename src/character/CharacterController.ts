import {
  CharacterPose,
  CharacterState,
  REST_POSE,
  SceneId,
  Viseme,
  lerpPose,
} from './types';
import { AnimationController } from '../animation/AnimationController';
import type { VoiceLineId } from '../audio/AudioManager';

export type CharacterEvent =
  | { type: 'state'; state: CharacterState }
  | { type: 'click'; x: number; y: number; region: string }
  | { type: 'viseme'; viseme: Viseme }
  | { type: 'scene'; scene: SceneId };

type Listener = (event: CharacterEvent) => void;

type SceneKey =
  | 'read'
  | 'idle'
  | 'phone'
  | 'listen'
  | 'talk'
  | 'yes'
  | 'no'
  | 'laugh'
  | 'ugh'
  | 'lab';

/**
 * High-fidelity sprite scene controller — full-bleed frames matched to classic look.
 */
export class CharacterController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animation: AnimationController;
  private state: CharacterState = 'read';
  private scene: SceneId = 'living';
  private pose: CharacterPose = { ...REST_POSE, paperUp: 1 };
  private targetPose: CharacterPose = { ...REST_POSE, paperUp: 1 };
  private running = false;
  private raf = 0;
  private lastTs = 0;
  private listeners = new Set<Listener>();
  private viseme: Viseme = 'rest';
  private talking = false;
  private dpr = 1;
  private images = new Map<SceneKey, HTMLImageElement>();
  private currentKey: SceneKey = 'read';
  private prevKey: SceneKey = 'read';
  private fade = 1;
  private bounce = 0;
  private shake = 0;
  private mouthPulse = 0;
  private ready = false;
  private labFlash = 0;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.animation = new AnimationController();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindPointer();
    void this.loadImages();
  }

  private async loadImages(): Promise<void> {
    const keys: SceneKey[] = [
      'read',
      'idle',
      'phone',
      'listen',
      'talk',
      'yes',
      'no',
      'laugh',
      'ugh',
      'lab',
    ];
    await Promise.all(
      keys.map(
        (key) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              this.images.set(key, img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = `../assets/scene/${key}.png`;
          }),
      ),
    );
    // Fallbacks
    const phone = this.images.get('phone');
    if (phone) {
      if (!this.images.has('listen')) this.images.set('listen', phone);
      if (!this.images.has('talk')) this.images.set('talk', phone);
    }
    this.ready = true;
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CharacterEvent): void {
    this.listeners.forEach((l) => l(event));
  }

  getState(): CharacterState {
    return this.state;
  }

  getScene(): SceneId {
    return this.scene;
  }

  setScene(scene: SceneId): void {
    this.scene = scene;
    if (scene === 'lab') this.setState('lab');
    else this.setState('read');
    this.emit({ type: 'scene', scene });
  }

  setState(state: CharacterState): void {
    this.state = state;
    this.targetPose = this.animation.poseForState(state);
    const next = this.keyForState(state);
    if (next !== this.currentKey) {
      this.prevKey = this.currentKey;
      this.currentKey = next;
      this.fade = 0;
    }
    if (state === 'laugh') this.bounce = 1;
    if (state === 'angry') this.shake = 1;
    this.emit({ type: 'state', state });
  }

  private keyForState(state: CharacterState): SceneKey {
    if (this.scene === 'lab' && state === 'lab') return 'lab';
    switch (state) {
      case 'read':
        return 'read';
      case 'idle':
        return 'idle';
      case 'phone':
      case 'listen':
        return 'phone';
      case 'talk':
        return 'talk';
      case 'happy':
        return 'yes';
      case 'angry':
        return 'no';
      case 'laugh':
        return 'laugh';
      case 'lab':
        return 'lab';
      case 'surprised':
      case 'confused':
      case 'poke':
      case 'fall':
        return 'ugh';
      case 'eat':
      case 'drink':
      case 'burp':
        return 'idle';
      case 'think':
        return this.scene === 'living' ? 'phone' : 'lab';
      default:
        return 'idle';
    }
  }

  /** Force a specific reply frame (yes/no/laugh/ugh/ben) */
  showReplyFrame(line: VoiceLineId | string): void {
    const map: Record<string, SceneKey> = {
      ben: 'talk',
      yes: 'yes',
      no: 'no',
      ugh: 'ugh',
      ha_ha_ha: 'laugh',
      ah: 'ugh',
      ow: 'ugh',
      ouch: 'ugh',
      hmm: 'phone',
    };
    const key = map[line] || 'phone';
    if (key !== this.currentKey) {
      this.prevKey = this.currentKey;
      this.currentKey = key;
      this.fade = 0;
    }
    if (line === 'ha_ha_ha') this.bounce = 1;
    if (line === 'no') this.shake = 1;
  }

  setViseme(viseme: Viseme): void {
    this.viseme = viseme;
    this.talking = viseme !== 'rest';
    this.mouthPulse = viseme === 'rest' ? 0 : 1;
    this.emit({ type: 'viseme', viseme });
  }

  startTalking(): void {
    this.setState('talk');
    this.talking = true;
  }

  stopTalking(): void {
    this.talking = false;
    this.viseme = 'rest';
    this.mouthPulse = 0;
    if (this.talking) return;
    if (this.scene === 'lab') {
      this.setState('lab');
      return;
    }
    const onCallFrames = ['phone', 'listen', 'talk', 'yes', 'no', 'laugh', 'ugh'];
    if (onCallFrames.includes(this.currentKey)) this.setState('phone');
    else this.setState('read');
  }

  react(state: CharacterState, durationMs = 1200): void {
    this.setState(state);
    window.setTimeout(() => {
      if (this.state === state && !this.talking) {
        if (this.scene === 'lab') this.setState('lab');
        else this.setState('read');
      }
    }, durationMs);
  }

  setLabReaction(_kind: number): void {
    this.labFlash = 1;
    this.setState('lab');
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();
    const loop = (ts: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      this.update(dt, ts);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setVisible(visible: boolean): void {
    if (visible) this.start();
    else this.stop();
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    const w = parent?.clientWidth || window.innerWidth;
    const h = parent?.clientHeight || window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private bindPointer(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      this.emit({ type: 'click', x, y, region: this.hitTest(x, y) });
    });
  }

  private hitTest(x: number, y: number): string {
    if (this.scene === 'lab') {
      if (y > 0.7) return 'tubes';
      return 'lab-ben';
    }
    if (x > 0.7 && y > 0.4 && y < 0.7) return 'phone';
    if (y < 0.45) return 'face';
    if (y > 0.78) return 'feet';
    if (x < 0.35) return 'hand';
    return 'belly';
  }

  private update(dt: number, _ts: number): void {
    this.fade = Math.min(1, this.fade + dt * 4.5);
    this.bounce = Math.max(0, this.bounce - dt * 1.2);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.labFlash = Math.max(0, this.labFlash - dt);
    if (this.talking) {
      this.mouthPulse = 0.55 + Math.sin(performance.now() / 70) * 0.45;
    }
    const smooth = 1 - Math.pow(0.001, dt);
    this.pose = lerpPose(this.pose, this.targetPose, Math.min(1, smooth * 8));
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    if (!this.ready) {
      ctx.fillStyle = '#c9955a';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading Ben…', w / 2, h / 2);
      return;
    }

    const ox = this.shake > 0 ? Math.sin(performance.now() / 30) * 10 * this.shake : 0;
    const oy = this.bounce > 0 ? Math.abs(Math.sin(performance.now() / 50)) * -14 * this.bounce : 0;

    ctx.save();
    ctx.translate(ox, oy);

    const prev = this.images.get(this.prevKey);
    const curr = this.images.get(this.currentKey) || this.images.get('idle');

    if (prev && this.fade < 1) {
      this.drawCover(prev, w, h, 1);
    }
    if (curr) {
      ctx.globalAlpha = this.fade;
      this.drawCover(curr, w, h, 1);
      ctx.globalAlpha = 1;
    }

    // Subtle talking mouth pulse vignette (keeps lips feeling alive on still frames)
    if (this.talking && this.mouthPulse > 0.2) {
      const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, w * 0.18);
      g.addColorStop(0, `rgba(80,20,20,${0.08 * this.mouthPulse})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    if (this.labFlash > 0) {
      ctx.fillStyle = `rgba(255,200,80,${0.25 * this.labFlash})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  private drawCover(img: HTMLImageElement, w: number, h: number, alpha: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    const ir = img.width / img.height;
    const cr = w / h;
    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;
    if (ir > cr) {
      // image wider — cover height
      dh = h;
      dw = h * ir;
      dx = (w - dw) / 2;
      dy = 0;
    } else {
      dw = w;
      dh = w / ir;
      dx = 0;
      dy = (h - dh) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }
}
