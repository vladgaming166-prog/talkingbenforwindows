import { BaseConversationProvider, ConversationResponse } from './ConversationProvider';
import { CharacterState } from '../character/types';
import type { VoiceLineId } from '../audio/AudioManager';

export interface BenReply extends ConversationResponse {
  lineId: VoiceLineId;
}

/**
 * Classic phone-call Ben: after you speak, he answers with short random lines
 * (Ben / Yes / No / laugh / Ugh) — matching the familiar call interaction.
 * Original voice lines only (not proprietary game audio).
 */
export class LocalBenConversation extends BaseConversationProvider {
  readonly id = 'local-ben';
  readonly displayName = 'Local Ben (classic phone lines)';

  private last: VoiceLineId | '' = '';
  private greetingUsed = false;

  isAvailable(): boolean {
    return true;
  }

  /** First line when answering the phone */
  answerCall(): BenReply {
    this.greetingUsed = true;
    return this.line('ben', 'phone');
  }

  hangUp(): BenReply {
    this.greetingUsed = false;
    return this.line('ugh', 'angry', 'react-angry');
  }

  async respond(
    userText: string,
    _context?: import('./ConversationProvider').ConversationContext,
  ): Promise<BenReply> {
    const text = (userText || '').trim().toLowerCase();

    // Classic behavior: mostly random short replies while on the phone,
    // with a few light keyword nudges so it still feels reactive.
    if (!text) {
      return this.randomPhoneLine();
    }

    if (/\b(love|like you|funny|joke|haha|lol)\b/.test(text)) {
      return this.line('ha_ha_ha', 'laugh', 'react-laugh');
    }
    if (/\b(no|never|stop|shut|hate|dumb|stupid)\b/.test(text)) {
      return this.pickLines([
        ['no', 'angry', 'react-angry'],
        ['ugh', 'angry'],
      ]);
    }
    if (/\b(yes|yeah|ok|okay|please|food|eat|pizza)\b/.test(text)) {
      return this.pickLines([
        ['yes', 'happy'],
        ['ben', 'happy'],
      ]);
    }
    if (/\b(who are you|your name|ben)\b/.test(text)) {
      return this.line('ben', 'happy');
    }
    if (/\b(why|what|how|huh)\b/.test(text)) {
      return this.pickLines([
        ['ugh', 'confused', 'react-confused'],
        ['no', 'confused'],
        ['ben', 'think'],
      ]);
    }

    return this.randomPhoneLine();
  }

  private randomPhoneLine(): BenReply {
    const pool: Array<[VoiceLineId, CharacterState, ConversationResponse['sound']?]> = [
      ['ben', 'phone'],
      ['yes', 'happy'],
      ['no', 'angry'],
      ['ha_ha_ha', 'laugh', 'react-laugh'],
      ['ugh', 'angry'],
    ];
    return this.pickLines(pool);
  }

  private pickLines(
    options: Array<[VoiceLineId, CharacterState, ConversationResponse['sound']?]>,
  ): BenReply {
    let choice = options[Math.floor(Math.random() * options.length)];
    if (options.length > 1 && choice[0] === this.last) {
      choice = options[(options.indexOf(choice) + 1) % options.length];
    }
    return this.line(choice[0], choice[1], choice[2]);
  }

  private line(
    lineId: VoiceLineId,
    emotion: CharacterState,
    sound?: ConversationResponse['sound'],
  ): BenReply {
    this.last = lineId;
    const textMap: Record<VoiceLineId, string> = {
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
    return { text: textMap[lineId], emotion, sound, lineId };
  }
}
