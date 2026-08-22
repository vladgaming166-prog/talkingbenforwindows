import { SpeechProvider } from './SpeechProvider';
import { WebSpeechProvider } from './WebSpeechProvider';
import { LocalStubSpeechProvider } from './LocalStubSpeechProvider';

export function createSpeechProvider(id: string): SpeechProvider {
  if (id === 'local-stub') return new LocalStubSpeechProvider();
  const web = new WebSpeechProvider();
  if (web.isAvailable()) return web;
  return new LocalStubSpeechProvider();
}

export type { SpeechProvider, SpeechResult } from './SpeechProvider';
export { WebSpeechProvider } from './WebSpeechProvider';
export { LocalStubSpeechProvider } from './LocalStubSpeechProvider';
