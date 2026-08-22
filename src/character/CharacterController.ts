import {
  CharacterPose,
  CharacterState,
  REST_POSE,
  Viseme,
  lerp,
  lerpPose,
} from './types';
import { AnimationController } from '../animation/AnimationController';

export type CharacterEvent =
  | { type: 'state'; state: CharacterState }
  | { type: 'click'; x: number; y: number; region: string }
  | { type: 'viseme'; viseme: Viseme };

type Listener = (event: CharacterEvent) => void;

export class CharacterController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animation: AnimationController;
  private state: CharacterState = 'idle';
  private pose: CharacterPose = { ...REST_POSE };
  private targetPose: CharacterPose = { ...REST_POSE };
  private running = false;
  private raf = 0;
  private lastTs = 0;
  private blinkTimer = 0;
  private nextBlink = 2 + Math.random() * 3;
  private lookTimer = 0;
  private listeners = new Set<Listener>();
  private viseme: Viseme = 'rest';
  private talking = false;
  private dpr = 1;
  private pointer = { x: 0, y: 0, active: false };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.canvas = canvas;
    this.ctx = ctx;
    this.animation = new AnimationController();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindPointer();
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

  setState(state: CharacterState): void {
    if (this.state === state) return;
    this.state = state;
    this.targetPose = this.animation.poseForState(state);
    this.emit({ type: 'state', state });
  }

  setViseme(viseme: Viseme): void {
    this.viseme = viseme;
    this.talking = viseme !== 'rest';
    this.emit({ type: 'viseme', viseme });
  }

  startTalking(): void {
    this.setState('talk');
    this.talking = true;
  }

  stopTalking(): void {
    this.talking = false;
    this.viseme = 'rest';
    if (this.state === 'talk') this.setState('idle');
  }

  react(state: CharacterState, durationMs = 1200): void {
    this.setState(state);
    window.setTimeout(() => {
      if (this.state === state && !this.talking) {
        this.setState('idle');
      }
    }, durationMs);
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

  /** Pause expensive animation when window hidden */
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
    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = (e.clientX - rect.left) / rect.width;
      this.pointer.y = (e.clientY - rect.top) / rect.height;
      this.pointer.active = true;
    });
    this.canvas.addEventListener('pointerleave', () => {
      this.pointer.active = false;
    });
    this.canvas.addEventListener('pointerdown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const region = this.hitTest(x, y);
      this.emit({ type: 'click', x, y, region });
    });
  }

  private hitTest(x: number, y: number): string {
    // Approximate Ben's silhouette regions in normalized space
    if (y < 0.28) return 'background';
    if (y > 0.78) return 'legs';
    if (x > 0.55 && y > 0.42 && y < 0.62) return 'phone';
    if (y < 0.48) return 'face';
    if (y < 0.62) return 'torso';
    return 'belly';
  }

  private update(dt: number, ts: number): void {
    // Idle micro-motion
    const idle = this.animation.sampleIdle(ts / 1000, this.state);
    this.targetPose = lerpPose(this.animation.poseForState(this.state), idle, 0.65);

    // Eye tracking toward pointer
    if (this.pointer.active && (this.state === 'idle' || this.state === 'listen')) {
      this.targetPose.lookX = lerp(-0.35, 0.35, this.pointer.x);
      this.targetPose.lookY = lerp(-0.2, 0.25, this.pointer.y);
    } else {
      this.lookTimer += dt;
      if (this.lookTimer > 2.5) {
        this.lookTimer = 0;
        this.targetPose.lookX = (Math.random() - 0.5) * 0.4;
        this.targetPose.lookY = (Math.random() - 0.5) * 0.2;
      }
    }

    // Blink
    this.blinkTimer += dt;
    if (this.blinkTimer > this.nextBlink) {
      this.blinkTimer = 0;
      this.nextBlink = 2 + Math.random() * 4;
      this.targetPose.eyeOpenL = 0.05;
      this.targetPose.eyeOpenR = 0.05;
      window.setTimeout(() => {
        this.targetPose.eyeOpenL = 1;
        this.targetPose.eyeOpenR = 1;
      }, 120);
    }

    // Viseme mouth
    if (this.talking) {
      const mouth = this.animation.mouthForViseme(this.viseme);
      this.targetPose.mouthOpen = mouth.open;
      this.targetPose.mouthWidth = mouth.width;
    }

    const smooth = 1 - Math.pow(0.001, dt);
    this.pose = lerpPose(this.pose, this.targetPose, Math.min(1, smooth * 8));
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    this.drawRoom(ctx, w, h);
    this.drawBen(ctx, w, h, this.pose);
  }

  private drawRoom(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Warm living-room atmosphere — green walls, wood floor, soft window light
    const wall = ctx.createLinearGradient(0, 0, 0, h);
    wall.addColorStop(0, '#3d6b45');
    wall.addColorStop(0.55, '#2f5536');
    wall.addColorStop(1, '#243f28');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, h);

    // Window light
    const light = ctx.createRadialGradient(w * 0.72, h * 0.18, 20, w * 0.72, h * 0.22, w * 0.45);
    light.addColorStop(0, 'rgba(255, 236, 170, 0.28)');
    light.addColorStop(1, 'rgba(255, 236, 170, 0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);

    // Floor
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.strokeStyle = 'rgba(40, 22, 10, 0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const y = h * 0.72 + i * (h * 0.035);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + 8);
      ctx.stroke();
    }

    // Window frame
    ctx.fillStyle = '#c9e7ff';
    roundRect(ctx, w * 0.62, h * 0.08, w * 0.28, h * 0.28, 8);
    ctx.fill();
    ctx.strokeStyle = '#5a3a22';
    ctx.lineWidth = 8;
    roundRect(ctx, w * 0.62, h * 0.08, w * 0.28, h * 0.28, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.76, h * 0.08);
    ctx.lineTo(w * 0.76, h * 0.36);
    ctx.moveTo(w * 0.62, h * 0.22);
    ctx.lineTo(w * 0.9, h * 0.22);
    ctx.stroke();

    // Soft rug
    ctx.fillStyle = '#8b3a2f';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.86, w * 0.28, h * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBen(ctx: CanvasRenderingContext2D, w: number, h: number, pose: CharacterPose): void {
    const cx = w * 0.5;
    const cy = h * 0.55 + pose.bodyBob * 12;
    const scale = Math.min(w, h) * 0.00115;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.rotate(pose.headTilt * 0.08);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 220, 140, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#c47a3a';
    roundRect(ctx, -70, 90, 50, 110, 20);
    ctx.fill();
    roundRect(ctx, 20, 90, 50, 110, 20);
    ctx.fill();
    ctx.fillStyle = '#2a1a10';
    roundRect(ctx, -78, 180, 66, 28, 12);
    ctx.fill();
    roundRect(ctx, 12, 180, 66, 28, 12);
    ctx.fill();

    // Body / overalls
    ctx.fillStyle = '#d9924c';
    ctx.beginPath();
    ctx.ellipse(0, 40, 120, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d6fb5';
    roundRect(ctx, -95, 10, 190, 150, 40);
    ctx.fill();
    ctx.fillStyle = '#2f5a96';
    roundRect(ctx, -30, 40, 60, 90, 16);
    ctx.fill();
    // Strap buttons
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(-55, 25, 8, 0, Math.PI * 2);
    ctx.arc(55, 25, 8, 0, Math.PI * 2);
    ctx.fill();

    // Arms
    ctx.save();
    ctx.translate(-110, 20);
    ctx.rotate(-0.35 + pose.armSwing * 0.2);
    ctx.fillStyle = '#d9924c';
    roundRect(ctx, -25, 0, 45, 120, 22);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(110, 20);
    ctx.rotate(0.45 + pose.armSwing * 0.15);
    ctx.fillStyle = '#d9924c';
    roundRect(ctx, -20, 0, 45, 110, 22);
    ctx.fill();
    // Phone hand
    ctx.fillStyle = '#222';
    roundRect(ctx, -5, 95, 36, 58, 8);
    ctx.fill();
    ctx.fillStyle = '#4ec3ff';
    roundRect(ctx, 0, 102, 26, 40, 4);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.save();
    ctx.translate(0, -110 + pose.headNod * 10);
    ctx.rotate(pose.headTilt * 0.15);

    // Ears
    ctx.fillStyle = '#c47a3a';
    ctx.beginPath();
    ctx.ellipse(-95, -20 + pose.earTwitch * 8, 38, 70, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(95, -20 - pose.earTwitch * 8, 38, 70, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a070';
    ctx.beginPath();
    ctx.ellipse(-95, -15, 18, 40, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(95, -15, 18, 40, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Head shape
    ctx.fillStyle = '#e0a05a';
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#f0c090';
    ctx.beginPath();
    ctx.ellipse(0, 35, 70, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Brows
    ctx.strokeStyle = '#5a3418';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    const browY = -35 - pose.browRaise * 12 + pose.browFurrow * 8;
    ctx.beginPath();
    ctx.moveTo(-55, browY + pose.browFurrow * 6);
    ctx.lineTo(-15, browY - pose.browFurrow * 4);
    ctx.moveTo(15, browY - pose.browFurrow * 4);
    ctx.lineTo(55, browY + pose.browFurrow * 6);
    ctx.stroke();

    // Eyes
    this.drawEye(ctx, -38, -10, pose.eyeOpenL, pose.lookX, pose.lookY);
    this.drawEye(ctx, 38, -10, pose.eyeOpenR, pose.lookX, pose.lookY);

    // Nose
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath();
    ctx.ellipse(0, 18, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(-6, 12, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    this.drawMouth(ctx, pose);

    ctx.restore();
    ctx.restore();
  }

  private drawEye(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    open: number,
    lookX: number,
    lookY: number,
  ): void {
    const h = 28 * Math.max(0.05, open);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y, 22, h, 0, 0, Math.PI * 2);
    ctx.fill();
    if (open > 0.15) {
      ctx.fillStyle = '#1a120c';
      ctx.beginPath();
      ctx.arc(x + lookX * 10, y + lookY * 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + lookX * 10 + 3, y + lookY * 8 - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMouth(ctx: CanvasRenderingContext2D, pose: CharacterPose): void {
    const open = pose.mouthOpen;
    const width = pose.mouthWidth;
    ctx.fillStyle = '#4a1810';
    ctx.beginPath();
    ctx.ellipse(0, 55, 55 * width, 18 + open * 55, 0, 0, Math.PI * 2);
    ctx.fill();
    if (open > 0.25) {
      ctx.fillStyle = '#c45a6a';
      ctx.beginPath();
      ctx.ellipse(0, 62 + open * 10, 30 * width, 10 + open * 12, 0, 0, Math.PI);
      ctx.fill();
    }
    // Smile line when mostly closed
    if (open < 0.2) {
      ctx.strokeStyle = '#4a1810';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 48, 28 * width, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
