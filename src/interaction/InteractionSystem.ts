import { CharacterController } from '../character/CharacterController';
import { AudioManager } from '../audio/AudioManager';
import { VoicePipeline } from '../speech/VoicePipeline';

export interface InteractionContext {
  character: CharacterController;
  audio: AudioManager;
  pipeline: VoicePipeline;
  showToast: (message: string) => void;
}

/**
 * Minimal click reactions — main experience is automatic voice.
 */
export class InteractionSystem {
  private ctx: InteractionContext;
  private cooldownUntil = 0;

  constructor(ctx: InteractionContext) {
    this.ctx = ctx;
  }

  async handleClick(region: string): Promise<void> {
    if (performance.now() < this.cooldownUntil) return;
    this.cooldownUntil = performance.now() + 400;
    if (this.ctx.pipeline.isOnCall()) return;
    try {
      if (region === 'face') await this.ctx.pipeline.playPokeLine('ow');
      else if (region === 'belly') await this.ctx.pipeline.playPokeLine('ah');
      else if (region === 'feet') await this.ctx.pipeline.playPokeLine('ouch');
    } catch {
      this.ctx.showToast('That interaction failed.');
    }
  }
}

export function createDefaultInteractions(): never[] {
  return [];
}

export async function playEat(ctx: InteractionContext): Promise<void> {
  ctx.character.setState('eat');
  ctx.audio.play('eat');
  await wait(1000);
  ctx.audio.play('burp');
  ctx.character.setState('read');
}

export async function playDrink(ctx: InteractionContext): Promise<void> {
  ctx.character.setState('drink');
  ctx.audio.play('drink');
  await wait(1000);
  ctx.audio.play('burp');
  ctx.character.setState('read');
}

export async function playLabMix(ctx: InteractionContext, _tubeIndex: number): Promise<void> {
  ctx.character.setScene('lab');
  ctx.audio.play('boom');
  await wait(800);
  ctx.character.setScene('living');
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}
