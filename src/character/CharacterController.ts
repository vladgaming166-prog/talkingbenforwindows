import {
  CharacterPose,
  CharacterState,
  REST_POSE,
  SceneId,
  Viseme,
  lerp,
  lerpPose,
} from './types';
import { AnimationController } from '../animation/AnimationController';

export type CharacterEvent =
  | { type: 'state'; state: CharacterState }
  | { type: 'click'; x: number; y: number; region: string }
  | { type: 'viseme'; viseme: Viseme }
  | { type: 'scene'; scene: SceneId };

type Listener = (event: CharacterEvent) => void;

/**
 * Original canvas recreation of the classic living-room / lab Ben presentation.
 * Inspired by the familiar experience; art and audio are original.
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
  private blinkTimer = 0;
  private nextBlink = 2 + Math.random() * 3;
  private lookTimer = 0;
  private listeners = new Set<Listener>();
  private viseme: Viseme = 'rest';
  private talking = false;
  private dpr = 1;
  private pointer = { x: 0.5, y: 0.5, active: false };
  private labReaction = 0; // 0 none, 1 smoke, 2 fire, 3 boom
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
    this.labReaction = 0;
    if (scene === 'lab') this.setState('lab');
    else this.setState('read');
    this.emit({ type: 'scene', scene });
  }

  setState(state: CharacterState): void {
    this.state = state;
    this.targetPose = this.animation.poseForState(state);
    if (state === 'phone' || state === 'listen' || state === 'talk' || state === 'laugh') {
      this.targetPose.phoneToEar = 1;
      this.targetPose.paperUp = 0;
    }
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
    if (this.state === 'talk') {
      this.setState(this.targetPose.phoneToEar > 0.5 ? 'phone' : 'idle');
    }
  }

  react(state: CharacterState, durationMs = 1200): void {
    this.setState(state);
    window.setTimeout(() => {
      if (this.state === state && !this.talking) {
        if (this.scene === 'lab') this.setState('lab');
        else if (this.targetPose.phoneToEar > 0.5) this.setState('phone');
        else this.setState('read');
      }
    }, durationMs);
  }

  setLabReaction(kind: number): void {
    this.labReaction = kind;
    this.labFlash = 1;
    this.targetPose.soot = kind === 2 || kind === 3 ? 1 : 0;
    window.setTimeout(() => {
      this.labReaction = 0;
      this.targetPose.soot = 0;
    }, 2200);
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
      this.emit({ type: 'click', x, y, region: this.hitTest(x, y) });
    });
  }

  private hitTest(x: number, y: number): string {
    if (this.scene === 'lab') {
      if (y > 0.72 && x < 0.55) return 'tubes';
      if (y > 0.65 && x > 0.55) return 'flask';
      return 'lab-ben';
    }
    if (y < 0.22) return 'background';
    if (x > 0.68 && y > 0.45 && y < 0.72) return 'phone';
    if (y < 0.42) return 'face';
    if (y < 0.58) return 'belly';
    if (y > 0.78) return 'feet';
    if (x < 0.38) return 'hand';
    return 'belly';
  }

  private update(dt: number, ts: number): void {
    const idle = this.animation.sampleIdle(ts / 1000, this.state);
    this.targetPose = lerpPose(this.animation.poseForState(this.state), idle, 0.55);

    if (this.state === 'phone' || this.state === 'listen' || this.state === 'talk' || this.state === 'laugh') {
      this.targetPose.phoneToEar = 1;
      this.targetPose.paperUp = 0;
      this.targetPose.armL = 1;
    }
    if (this.state === 'read') this.targetPose.paperUp = 1;
    if (this.state === 'angry') this.targetPose.headShake = Math.sin(ts / 1000 * 10) * 0.5;

    if (this.pointer.active && this.state !== 'read') {
      this.targetPose.lookX = lerp(-0.3, 0.3, this.pointer.x);
      this.targetPose.lookY = lerp(-0.15, 0.2, this.pointer.y);
    } else {
      this.lookTimer += dt;
      if (this.lookTimer > 2.8) {
        this.lookTimer = 0;
        this.targetPose.lookX = (Math.random() - 0.5) * 0.35;
        this.targetPose.lookY = (Math.random() - 0.5) * 0.18;
      }
    }

    this.blinkTimer += dt;
    if (this.blinkTimer > this.nextBlink) {
      this.blinkTimer = 0;
      this.nextBlink = 2 + Math.random() * 4;
      this.targetPose.eyeOpenL = 0.05;
      this.targetPose.eyeOpenR = 0.05;
      window.setTimeout(() => {
        this.targetPose.eyeOpenL = 1;
        this.targetPose.eyeOpenR = 1;
      }, 110);
    }

    if (this.talking) {
      const mouth = this.animation.mouthForViseme(this.viseme);
      this.targetPose.mouthOpen = mouth.open;
      this.targetPose.mouthWidth = mouth.width;
    }

    this.labFlash = Math.max(0, this.labFlash - dt * 0.8);
    const smooth = 1 - Math.pow(0.001, dt);
    this.pose = lerpPose(this.pose, this.targetPose, Math.min(1, smooth * 8));
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (this.scene === 'lab') this.drawLab(ctx, w, h);
    else this.drawLiving(ctx, w, h);
  }

  private drawLiving(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Green geometric wallpaper
    ctx.fillStyle = '#4f8a4a';
    ctx.fillRect(0, 0, w, h * 0.72);
    ctx.strokeStyle = 'rgba(210, 230, 190, 0.55)';
    ctx.lineWidth = 2;
    const step = Math.max(28, w * 0.045);
    for (let y = -step; y < h * 0.75; y += step) {
      for (let x = -step; x < w + step; x += step) {
        const ox = (Math.floor(y / step) % 2) * (step / 2);
        ctx.beginPath();
        ctx.arc(x + ox, y, step * 0.28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + ox - step * 0.18, y);
        ctx.lineTo(x + ox, y - step * 0.18);
        ctx.lineTo(x + ox + step * 0.18, y);
        ctx.lineTo(x + ox, y + step * 0.18);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Wood floor
    const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
    floorGrad.addColorStop(0, '#d7b07a');
    floorGrad.addColorStop(1, '#c49a5c');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.strokeStyle = 'rgba(90, 55, 25, 0.25)';
    for (let i = 0; i < 10; i++) {
      const y = h * 0.72 + i * (h * 0.03);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + 6);
      ctx.stroke();
    }

    // Side table + orange phone
    const tx = w * 0.78;
    const ty = h * 0.58;
    ctx.fillStyle = '#5a3a22';
    roundRect(ctx, tx - 55, ty, 110, 90, 6);
    ctx.fill();
    ctx.fillStyle = '#6b4528';
    roundRect(ctx, tx - 60, ty - 8, 120, 18, 4);
    ctx.fill();

    // Phone base
    ctx.fillStyle = '#f08a28';
    roundRect(ctx, tx - 38, ty - 42, 76, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(tx, ty - 22, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(tx + Math.cos(a) * 8, ty - 22 + Math.sin(a) * 8, 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.drawBenLiving(ctx, w, h, this.pose);

    // Coiled cord if phone to ear
    if (this.pose.phoneToEar > 0.2) {
      ctx.strokeStyle = '#f08a28';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const hx = w * 0.38;
      const hy = h * 0.34;
      ctx.moveTo(tx - 20, ty - 30);
      for (let i = 0; i < 12; i++) {
        const t = i / 11;
        const x = lerp(tx - 20, hx, t);
        const y = lerp(ty - 30, hy, t) + Math.sin(t * 18) * 5;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  private drawBenLiving(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    pose: CharacterPose,
  ): void {
    const cx = w * 0.48;
    const cy = h * 0.52 + pose.bodyBob * 10;
    const scale = Math.min(w, h) * 0.0012;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Chair
    ctx.fillStyle = '#8b1e1e';
    roundRect(ctx, -160, -40, 320, 260, 40);
    ctx.fill();
    ctx.fillStyle = '#a02828';
    // diamond pattern
    ctx.strokeStyle = 'rgba(60,10,10,0.35)';
    ctx.lineWidth = 2;
    for (let y = -20; y < 200; y += 28) {
      for (let x = -140; x < 140; x += 28) {
        ctx.strokeRect(x, y, 14, 14);
      }
    }
    // arms
    ctx.fillStyle = '#7a1818';
    roundRect(ctx, -190, 40, 55, 140, 20);
    ctx.fill();
    roundRect(ctx, 135, 40, 55, 140, 20);
    ctx.fill();
    // top back
    ctx.fillStyle = '#9a2222';
    roundRect(ctx, -150, -120, 300, 100, 35);
    ctx.fill();

    // Body (shaggy tan — no overalls, classic look)
    ctx.fillStyle = '#c9955a';
    ctx.beginPath();
    ctx.ellipse(0, 70, 115, 125, 0, 0, Math.PI * 2);
    ctx.fill();
    // fur streaks
    ctx.strokeStyle = 'rgba(110, 70, 35, 0.25)';
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 70, 70 + Math.sin(a) * 80);
      ctx.lineTo(Math.cos(a) * 110, 70 + Math.sin(a) * 120);
      ctx.stroke();
    }

    // Legs / feet
    ctx.fillStyle = '#c9955a';
    roundRect(ctx, -85, 160, 70, 90, 28);
    ctx.fill();
    roundRect(ctx, 15, 160, 70, 90, 28);
    ctx.fill();
    ctx.fillStyle = '#b07d48';
    roundRect(ctx, -95, 230, 85, 35, 16);
    ctx.fill();
    roundRect(ctx, 10, 230, 85, 35, 16);
    ctx.fill();

    // Arms
    ctx.save();
    ctx.translate(-120, 40);
    ctx.rotate(-0.2 + pose.armL * -0.9);
    ctx.fillStyle = '#c9955a';
    roundRect(ctx, -30, 0, 55, 130, 24);
    ctx.fill();
    if (pose.phoneToEar > 0.35) {
      // handset
      ctx.fillStyle = '#f08a28';
      roundRect(ctx, -20, -70, 40, 90, 16);
      ctx.fill();
      ctx.fillStyle = '#d97820';
      roundRect(ctx, -16, -60, 32, 28, 10);
      ctx.fill();
      roundRect(ctx, -16, -10, 32, 28, 10);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(120, 40);
    ctx.rotate(0.25 + pose.armR * 0.8);
    ctx.fillStyle = '#c9955a';
    roundRect(ctx, -25, 0, 55, 130, 24);
    ctx.fill();
    if (this.state === 'eat') {
      ctx.fillStyle = '#c45a2a';
      roundRect(ctx, -18, 110, 40, 50, 8);
      ctx.fill();
    }
    if (this.state === 'drink') {
      ctx.fillStyle = '#2f8f3a';
      roundRect(ctx, -12, 90, 28, 70, 8);
      ctx.fill();
    }
    ctx.restore();

    // Head
    ctx.save();
    ctx.translate(pose.headShake * 25, -100 + pose.headNod * 18);
    ctx.rotate(pose.headTilt * 0.18);

    // Ears
    ctx.fillStyle = '#b8824a';
    ctx.beginPath();
    ctx.ellipse(-95, -10 + pose.earTwitch * 6, 42, 78, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(95, -10 - pose.earTwitch * 6, 42, 78, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e0a878';
    ctx.beginPath();
    ctx.ellipse(-95, -5, 18, 42, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(95, -5, 18, 42, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Head fluff
    ctx.fillStyle = '#d2a066';
    ctx.beginPath();
    ctx.ellipse(0, 0, 118, 108, 0, 0, Math.PI * 2);
    ctx.fill();
    // muzzle
    ctx.fillStyle = '#e8c090';
    ctx.beginPath();
    ctx.ellipse(0, 38, 78, 60, 0, 0, Math.PI * 2);
    ctx.fill();

    if (pose.soot > 0.2) {
      ctx.fillStyle = `rgba(20,20,20,${0.45 * pose.soot})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 118, 108, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // brows
    ctx.strokeStyle = '#5a3418';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    const browY = -38 - pose.browRaise * 12 + pose.browFurrow * 10;
    ctx.beginPath();
    ctx.moveTo(-58, browY + pose.browFurrow * 8);
    ctx.lineTo(-14, browY - pose.browFurrow * 5);
    ctx.moveTo(14, browY - pose.browFurrow * 5);
    ctx.lineTo(58, browY + pose.browFurrow * 8);
    ctx.stroke();

    this.drawEye(ctx, -40, -8, pose.eyeOpenL, pose.lookX, pose.lookY);
    this.drawEye(ctx, 40, -8, pose.eyeOpenR, pose.lookX, pose.lookY);

    // Nose
    ctx.fillStyle = '#1a120c';
    ctx.beginPath();
    ctx.ellipse(0, 20, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(-8, 12, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawMouth(ctx, pose);

    if (pose.tongueOut > 0.2) {
      ctx.fillStyle = '#e07890';
      ctx.beginPath();
      ctx.ellipse(20, 70, 16, 22 * pose.tongueOut, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Newspaper over face
    if (pose.paperUp > 0.15) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, pose.paperUp);
      ctx.fillStyle = '#f2e6c8';
      roundRect(ctx, -90, -40, 180, 140, 4);
      ctx.fill();
      ctx.fillStyle = '#2a2a2a';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.fillText('NEWS', -40, 10);
      ctx.font = '16px Georgia, serif';
      ctx.fillText('Talking Friends', -70, 40);
      ctx.strokeStyle = '#cbb896';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(-70, 55 + i * 10);
        ctx.lineTo(70, 55 + i * 10);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  private drawLab(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#d8dde2';
    ctx.fillRect(0, 0, w, h);
    // cabinets
    ctx.fillStyle = '#e87820';
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#f0f2f4';
    ctx.fillRect(0, h * 0.58, w, h * 0.06);
    // periodic table
    ctx.fillStyle = '#fff';
    roundRect(ctx, w * 0.28, h * 0.08, w * 0.44, h * 0.22, 6);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    const cols = 8;
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = `hsl(${(c * 40 + r * 20) % 360} 60% 55%)`;
        const x = w * 0.3 + c * ((w * 0.4) / cols);
        const y = h * 0.1 + r * ((h * 0.18) / rows);
        ctx.fillRect(x, y, (w * 0.4) / cols - 2, (h * 0.18) / rows - 2);
      }
    }
    // first aid
    ctx.fillStyle = '#fff';
    roundRect(ctx, w * 0.06, h * 0.12, 54, 54, 6);
    ctx.fill();
    ctx.fillStyle = '#d22';
    ctx.fillRect(w * 0.06 + 22, h * 0.12 + 10, 10, 34);
    ctx.fillRect(w * 0.06 + 10, h * 0.12 + 22, 34, 10);

    // Ben upper body in lab
    const cx = w * 0.5;
    const cy = h * 0.42 + this.pose.bodyBob * 8;
    const scale = Math.min(w, h) * 0.00115;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#c9955a';
    ctx.beginPath();
    ctx.ellipse(0, 80, 120, 110, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(this.pose.headShake * 20, -40 + this.pose.headNod * 10);
    ctx.fillStyle = '#d2a066';
    ctx.beginPath();
    ctx.ellipse(0, 0, 110, 100, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c090';
    ctx.beginPath();
    ctx.ellipse(0, 35, 70, 55, 0, 0, Math.PI * 2);
    ctx.fill();
    this.drawEye(ctx, -38, -8, this.pose.eyeOpenL, this.pose.lookX, this.pose.lookY);
    this.drawEye(ctx, 38, -8, this.pose.eyeOpenR, this.pose.lookX, this.pose.lookY);
    ctx.fillStyle = '#1a120c';
    ctx.beginPath();
    ctx.ellipse(0, 18, 24, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    this.drawMouth(ctx, this.pose);
    if (this.pose.soot > 0.2) {
      ctx.fillStyle = `rgba(20,20,20,${0.4 * this.pose.soot})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 110, 100, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();

    // tubes + flask
    const colors = ['#e8c44a', '#4caf50', '#4ec3ff', '#e85aad', '#3d6fb5'];
    colors.forEach((c, i) => {
      const x = w * 0.12 + i * 36;
      const y = h * 0.5;
      ctx.fillStyle = '#ddd';
      roundRect(ctx, x, y, 18, 70, 4);
      ctx.fill();
      ctx.fillStyle = c;
      roundRect(ctx, x + 2, y + 25, 14, 40, 3);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(200,210,220,0.85)';
    ctx.beginPath();
    ctx.moveTo(w * 0.62, h * 0.48);
    ctx.lineTo(w * 0.78, h * 0.48);
    ctx.lineTo(w * 0.84, h * 0.7);
    ctx.lineTo(w * 0.56, h * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#889';
    ctx.stroke();

    if (this.labReaction > 0) {
      const rx = w * 0.7;
      const ry = h * 0.5;
      if (this.labReaction === 1) {
        ctx.fillStyle = `rgba(80,80,80,${0.35 + this.labFlash * 0.4})`;
        ctx.beginPath();
        ctx.ellipse(rx, ry - 40, 80, 60, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.labReaction === 2) {
        ctx.fillStyle = `rgba(255,140,20,${0.5 + this.labFlash * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(rx, ry - 120);
        ctx.lineTo(rx + 40, ry);
        ctx.lineTo(rx - 40, ry);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(255,200,40,${0.55 + this.labFlash * 0.4})`;
        ctx.beginPath();
        ctx.arc(rx, ry - 30, 70 + this.labFlash * 40, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawEye(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    open: number,
    lookX: number,
    lookY: number,
  ): void {
    const eh = 30 * Math.max(0.05, open);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(x, y, 24, eh, 0, 0, Math.PI * 2);
    ctx.fill();
    if (open > 0.15) {
      ctx.fillStyle = '#6b3a12';
      ctx.beginPath();
      ctx.arc(x + lookX * 9, y + lookY * 7, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1008';
      ctx.beginPath();
      ctx.arc(x + lookX * 9, y + lookY * 7, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + lookX * 9 + 3, y + lookY * 7 - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawMouth(ctx: CanvasRenderingContext2D, pose: CharacterPose): void {
    const open = pose.mouthOpen;
    const width = pose.mouthWidth;
    ctx.fillStyle = '#4a1810';
    ctx.beginPath();
    ctx.ellipse(0, 58, 52 * width, 16 + open * 58, 0, 0, Math.PI * 2);
    ctx.fill();
    if (open > 0.22) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(-28 * width, 48, 56 * width, 8);
      ctx.fillStyle = '#e07890';
      ctx.beginPath();
      ctx.ellipse(0, 68 + open * 8, 28 * width, 10 + open * 14, 0, 0, Math.PI);
      ctx.fill();
    }
    if (open < 0.18) {
      ctx.strokeStyle = '#4a1810';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 50, 26 * width, 0.15 * Math.PI, 0.85 * Math.PI);
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
