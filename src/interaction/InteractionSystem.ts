import { CharacterController } from '../character/CharacterController';
import { AudioManager } from '../audio/AudioManager';
import { VoicePipeline } from '../speech/VoicePipeline';

export interface InteractionContext {
  character: CharacterController;
  audio: AudioManager;
  pipeline: VoicePipeline;
  showToast: (message: string) => void;
}

export interface InteractionHandler {
  id: string;
  regions?: string[];
  handle(region: string, ctx: InteractionContext): void | Promise<void>;
}

export class InteractionSystem {
  private handlers: InteractionHandler[] = [];
  private ctx: InteractionContext;
  private cooldownUntil = 0;

  constructor(ctx: InteractionContext) {
    this.ctx = ctx;
  }

  register(handler: InteractionHandler): void {
    this.handlers.push(handler);
  }

  async handleClick(region: string): Promise<void> {
    if (performance.now() < this.cooldownUntil) return;
    this.cooldownUntil = performance.now() + 320;
    const matches = this.handlers.filter(
      (h) => !h.regions || h.regions.includes(region) || h.regions.includes('*'),
    );
    for (const handler of matches) {
      try {
        await handler.handle(region, this.ctx);
      } catch {
        this.ctx.showToast('That interaction failed.');
      }
    }
  }
}

export function createDefaultInteractions(): InteractionHandler[] {
  return [
    {
      id: 'face-poke',
      regions: ['face'],
      async handle(_r, ctx) {
        if (ctx.pipeline.isOnCall()) return;
        await ctx.pipeline.playPokeLine('ow', 'fall');
      },
    },
    {
      id: 'belly-poke',
      regions: ['belly'],
      async handle(_r, ctx) {
        if (ctx.pipeline.isOnCall()) return;
        await ctx.pipeline.playPokeLine('ah', 'poke');
      },
    },
    {
      id: 'feet-poke',
      regions: ['feet'],
      async handle(_r, ctx) {
        if (ctx.pipeline.isOnCall()) return;
        await ctx.pipeline.playPokeLine('ouch', 'poke');
      },
    },
    {
      id: 'hand-poke',
      regions: ['hand'],
      async handle(_r, ctx) {
        if (ctx.pipeline.isOnCall()) return;
        await ctx.pipeline.playPokeLine('ah', 'poke');
      },
    },
    {
      id: 'phone-prop',
      regions: ['phone'],
      async handle(_r, ctx) {
        await ctx.pipeline.togglePhoneCall();
      },
    },
  ];
}

export async function playEat(ctx: InteractionContext): Promise<void> {
  if (ctx.pipeline.isOnCall()) {
    ctx.showToast('Hang up first.');
    return;
  }
  ctx.character.setScene('living');
  ctx.character.setState('eat');
  ctx.audio.play('eat');
  await wait(1200);
  ctx.audio.play('burp');
  ctx.character.setState('burp');
  await wait(800);
  ctx.character.setState('read');
}

export async function playDrink(ctx: InteractionContext): Promise<void> {
  if (ctx.pipeline.isOnCall()) {
    ctx.showToast('Hang up first.');
    return;
  }
  ctx.character.setScene('living');
  ctx.character.setState('drink');
  ctx.audio.play('drink');
  await wait(1100);
  ctx.audio.play('glass');
  await wait(200);
  ctx.audio.play('burp');
  ctx.character.setState('burp');
  await wait(900);
  ctx.character.setState('read');
}

export async function playLabMix(ctx: InteractionContext, tubeIndex: number): Promise<void> {
  ctx.character.setScene('lab');
  ctx.character.setState('lab');
  ctx.audio.play('ui-click');
  await wait(350);
  const kind = (tubeIndex % 3) + 1;
  ctx.character.setLabReaction(kind);
  if (kind === 3) ctx.audio.play('boom');
  else ctx.audio.play('react-surprise');
  await wait(500);
  if (kind === 1) await ctx.pipeline.playPokeLine('ha_ha_ha', 'laugh');
  else if (kind === 2) await ctx.pipeline.playPokeLine('ugh', 'surprised');
  else await ctx.pipeline.playPokeLine('ow', 'surprised');
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}
