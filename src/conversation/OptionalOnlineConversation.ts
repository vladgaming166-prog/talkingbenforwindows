import { BaseConversationProvider, ConversationContext, ConversationResponse } from './ConversationProvider';
import { LocalBenConversation } from './LocalBenConversation';

/**
 * Optional online AI provider interface.
 * Without an API key it falls back to LocalBenConversation.
 * Isolated so it can be replaced without rewriting the app.
 */
export class OptionalOnlineConversation extends BaseConversationProvider {
  readonly id = 'optional-online';
  readonly displayName = 'Optional online AI (fallback to local)';
  private fallback = new LocalBenConversation();
  private endpoint: string | null;

  constructor(endpoint?: string) {
    super();
    this.endpoint = endpoint || null;
  }

  isAvailable(): boolean {
    return true;
  }

  async respond(userText: string, context?: ConversationContext): Promise<ConversationResponse> {
    if (!this.endpoint) {
      return this.fallback.respond(userText, context);
    }
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, history: context?.history ?? [] }),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      if (!res.ok) throw new Error(`Provider HTTP ${res.status}`);
      const data = (await res.json()) as Partial<ConversationResponse>;
      if (!data || typeof data.text !== 'string' || !data.text.trim()) {
        throw new Error('Malformed provider response');
      }
      return {
        text: data.text.trim().slice(0, 280),
        emotion: (data.emotion as ConversationResponse['emotion']) || 'talk',
        sound: data.sound,
      };
    } catch {
      return this.fallback.respond(userText, context);
    }
  }
}
