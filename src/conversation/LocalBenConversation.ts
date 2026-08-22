import { BaseConversationProvider, ConversationResponse } from './ConversationProvider';
import { CharacterState } from '../character/types';

/**
 * Offline-first Ben personality: short classic-style replies, no cloud required.
 * Inspired by the interaction style, with original phrasing/assets only.
 */
export class LocalBenConversation extends BaseConversationProvider {
  readonly id = 'local-ben';
  readonly displayName = 'Local Ben (offline)';

  private lastCategory = '';

  isAvailable(): boolean {
    return true;
  }

  async respond(userText: string, _context?: import('./ConversationProvider').ConversationContext): Promise<ConversationResponse> {
    const text = (userText || '').trim().toLowerCase();
    if (!text) {
      return this.pack('Huh?', 'confused', 'react-confused');
    }

    if (/(hello|hi|hey|good (morning|afternoon|evening))/.test(text)) {
      return this.pick([
        ['Ben.', 'happy'],
        ['Hey.', 'happy'],
        ['Yeah?', 'listen'],
      ]);
    }

    if (/\b(how are you|how's it going|how r u)\b/.test(text)) {
      return this.pick([
        ['Fine.', 'idle'],
        ['Ben.', 'happy'],
        ['Eh.', 'confused'],
      ]);
    }

    if (/\b(what('?s| is) your name|who are you)\b/.test(text)) {
      return this.pack('Ben.', 'happy');
    }

    if (/\b(joke|funny|laugh|haha|lol)\b/.test(text)) {
      return this.pack('Ha ha ha!', 'laugh', 'react-laugh');
    }

    if (/\b(food|hungry|eat|pizza|burger|bone)\b/.test(text)) {
      return this.pick([
        ['Yes!', 'happy'],
        ['Food!', 'happy'],
        ['Mmm.', 'happy'],
      ]);
    }

    if (/\b(no|never|stop|shut up|quiet)\b/.test(text)) {
      return this.pick([
        ['No.', 'angry', 'react-angry'],
        ['Ben!', 'angry', 'react-angry'],
        ['Ugh.', 'angry'],
      ]);
    }

    if (/\b(yes|yeah|yep|sure|ok|okay)\b/.test(text)) {
      return this.pick([
        ['Yes.', 'happy'],
        ['Okay.', 'idle'],
        ['Ben.', 'happy'],
      ]);
    }

    if (/\b(love|like you|miss you)\b/.test(text)) {
      return this.pick([
        ['Aww.', 'happy'],
        ['Ben!', 'happy'],
        ['Ha ha!', 'laugh', 'react-laugh'],
      ]);
    }

    if (/\b(scary|boo|ghost|monster)\b/.test(text)) {
      return this.pack('Whoa!', 'surprised', 'react-surprise');
    }

    if (/\b(bye|goodbye|see you|later)\b/.test(text)) {
      return this.pick([
        ['Bye.', 'idle'],
        ['Later.', 'idle'],
        ['Ben.', 'happy'],
      ]);
    }

    if (/\b(sing|song|music)\b/.test(text)) {
      return this.pack('La la la!', 'happy');
    }

    if (/\b(why|how|what|when|where|who)\b/.test(text)) {
      return this.pick([
        ['Why?', 'confused', 'react-confused'],
        ['Huh?', 'confused', 'react-confused'],
        ['Ben?', 'think'],
      ]);
    }

    if (/\b(phone|call|telephone)\b/.test(text)) {
      return this.pick([
        ['Ring ring.', 'surprised'],
        ['Hello?', 'listen'],
        ['Ben.', 'talk'],
      ]);
    }

    if (/\b(dumb|stupid|ugly|hate)\b/.test(text)) {
      return this.pack('Hey!', 'angry', 'react-angry');
    }

    // Default short Ben-like replies
    return this.pick([
      ['Ben.', 'idle'],
      ['Yes.', 'happy'],
      ['No.', 'angry'],
      ['Huh?', 'confused', 'react-confused'],
      ['Ha ha!', 'laugh', 'react-laugh'],
      ['Okay.', 'idle'],
      ['Hmm.', 'think'],
    ]);
  }

  private pick(
    options: Array<[string, CharacterState] | [string, CharacterState, ConversationResponse['sound']]>,
  ): ConversationResponse {
    let choice = options[Math.floor(Math.random() * options.length)];
    // Avoid repeating exact same category text when possible
    if (options.length > 1 && choice[0] === this.lastCategory) {
      choice = options[(options.indexOf(choice) + 1) % options.length];
    }
    this.lastCategory = choice[0];
    return this.pack(choice[0], choice[1], choice[2]);
  }

  private pack(
    text: string,
    emotion: CharacterState,
    sound?: ConversationResponse['sound'],
  ): ConversationResponse {
    return { text, emotion, sound };
  }
}
