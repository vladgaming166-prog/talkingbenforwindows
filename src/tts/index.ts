import { TTSProvider } from './TTSProvider';
import { WebTTSProvider } from './WebTTSProvider';
import { LocalStubTTSProvider } from './LocalStubTTSProvider';

export function createTTSProvider(id: string): TTSProvider {
  if (id === 'local-stub') return new LocalStubTTSProvider();
  const web = new WebTTSProvider();
  if (web.isAvailable()) return web;
  return new LocalStubTTSProvider();
}

export type { TTSProvider, TTSSpeakOptions, SpeechSynthesisVoiceInfo } from './TTSProvider';
export { WebTTSProvider } from './WebTTSProvider';
export { LocalStubTTSProvider } from './LocalStubTTSProvider';
