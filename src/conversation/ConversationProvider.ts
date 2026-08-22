import { CharacterState } from '../character/types';

export interface ConversationResponse {
  text: string;
  emotion: CharacterState;
  sound?: 'react-laugh' | 'react-surprise' | 'react-angry' | 'react-confused';
}

export interface ConversationProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): boolean;
  respond(userText: string, context?: ConversationContext): Promise<ConversationResponse>;
}

export interface ConversationContext {
  history?: Array<{ role: 'user' | 'ben'; text: string }>;
}

export abstract class BaseConversationProvider implements ConversationProvider {
  abstract readonly id: string;
  abstract readonly displayName: string;
  abstract isAvailable(): boolean;
  abstract respond(userText: string, context?: ConversationContext): Promise<ConversationResponse>;
}
