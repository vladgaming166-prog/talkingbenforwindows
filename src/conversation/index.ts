import { ConversationProvider } from './ConversationProvider';
import { LocalBenConversation } from './LocalBenConversation';
import { OptionalOnlineConversation } from './OptionalOnlineConversation';

export function createConversationProvider(id = 'local-ben'): ConversationProvider {
  if (id === 'optional-online') {
    return new OptionalOnlineConversation();
  }
  return new LocalBenConversation();
}

export type { ConversationProvider, ConversationResponse } from './ConversationProvider';
export { LocalBenConversation } from './LocalBenConversation';
export { OptionalOnlineConversation } from './OptionalOnlineConversation';
