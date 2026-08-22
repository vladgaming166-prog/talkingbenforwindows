import { BaseTTSProvider, SpeechSynthesisVoiceInfo, TTSSpeakOptions } from './TTSProvider';

export class WebTTSProvider extends BaseTTSProvider {
  readonly id = 'web-speech';
  readonly displayName = 'Web Speech Synthesis';
  private current: SpeechSynthesisUtterance | null = null;

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getVoices(): SpeechSynthesisVoiceInfo[] {
    if (!this.isAvailable()) return [];
    return window.speechSynthesis.getVoices().map((v) => ({
      name: v.name,
      voiceURI: v.voiceURI,
      lang: v.lang,
      localService: v.localService,
      default: v.default,
    }));
  }

  speak(text: string, options: TTSSpeakOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('Text-to-speech is not available.'));
        return;
      }
      this.stop();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = options.rate ?? 1;
      utter.pitch = options.pitch ?? 1;
      utter.volume = options.volume ?? 1;
      utter.lang = options.lang || 'en-US';

      const voices = window.speechSynthesis.getVoices();
      if (options.voiceURI) {
        const match = voices.find((v) => v.voiceURI === options.voiceURI);
        if (match) utter.voice = match;
      } else {
        // Prefer a local English male-ish voice when available
        const preferred =
          voices.find((v) => /en(-|_)US/i.test(v.lang) && /male|david|mark|george/i.test(v.name)) ||
          voices.find((v) => /en(-|_)US/i.test(v.lang) && v.localService) ||
          voices.find((v) => /en/i.test(v.lang));
        if (preferred) utter.voice = preferred;
      }

      utter.onboundary = (ev) => {
        if (typeof ev.charIndex === 'number') {
          this.emitBoundary(ev.charIndex, ev.charLength || 1);
        }
      };

      utter.onend = () => {
        this.current = null;
        resolve();
      };
      utter.onerror = (ev) => {
        this.current = null;
        if (ev.error === 'interrupted' || ev.error === 'canceled') {
          resolve();
          return;
        }
        reject(new Error(`TTS error: ${ev.error}`));
      };

      this.current = utter;
      window.speechSynthesis.speak(utter);
    });
  }

  stop(): void {
    if (!this.isAvailable()) return;
    window.speechSynthesis.cancel();
    this.current = null;
  }
}
