import { CharacterController } from '../character/CharacterController';
import { CharacterState } from '../character/types';
import { AudioManager, SoundId } from '../audio/AudioManager';

export interface InteractionContext {
  character: CharacterController;
  audio: AudioManager;
  showToast: (message: string) => void;
}

export interface InteractionHandler {
  id: string;
  regions?: string[];
  handle(region: string, ctx: InteractionContext): void | Promise<void>;
}

/**
 * Modular mouse/touch interaction system — add handlers without rewriting core.
 */
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

  unregister(id: string): void {
    this.handlers = this.handlers.filter((h) => h.id !== id);
  }

  async handleClick(region: string): Promise<void> {
    if (performance.now() < this.cooldownUntil) return;
    this.cooldownUntil = performance.now() + 350;

    const matches = this.handlers.filter(
      (h) => !h.regions || h.regions.includes(region) || h.regions.includes('*'),
    );
    for (const handler of matches) {
      try {
        await handler.handle(region, this.ctx);
      } catch {
        this.ctx.showToast('Something went wrong with that interaction.');
      }
    }
  }
}

export function createDefaultInteractions(): InteractionHandler[] {
  return [
    {
      id: 'face-pet',
      regions: ['face'],
      handle(_region, ctx) {
        ctx.audio.play('ui-click');
        const reactions: CharacterState[] = ['happy', 'laugh', 'surprised'];
        const pick = reactions[Math.floor(Math.random() * reactions.length)];
        ctx.character.react(pick, 1400);
        if (pick === 'laugh') ctx.audio.play('react-laugh');
        if (pick === 'surprised') ctx.audio.play('react-surprise');
      },
    },
    {
      id: 'belly-poke',
      regions: ['belly', 'torso'],
      handle(_region, ctx) {
        ctx.audio.play('ui-click');
        ctx.character.react('surprised', 1000);
        ctx.audio.play('react-surprise');
      },
    },
    {
      id: 'phone-tap',
      regions: ['phone'],
      handle(_region, ctx) {
        ctx.audio.play('ui-toggle');
        ctx.character.react('listen', 1600);
        ctx.showToast('Ring ring…');
        window.setTimeout(() => {
          ctx.character.react('talk', 800);
        }, 700);
      },
    },
    {
      id: 'legs-tickle',
      regions: ['legs'],
      handle(_region, ctx) {
        ctx.audio.play('react-laugh');
        ctx.character.react('laugh', 1200);
      },
    },
    {
      id: 'background',
      regions: ['background'],
      handle(_region, ctx) {
        ctx.character.react('confused', 900);
        ctx.audio.play('react-confused' as SoundId);
      },
    },
  ];
}
