import { BaseSpeechProvider } from './SpeechProvider';

/**
 * Offline stub used when Web Speech is unavailable.
 * Accepts typed fallback via injectTranscript for testing / accessibility.
 */
export class LocalStubSpeechProvider extends BaseSpeechProvider {
  readonly id = 'local-stub';
  readonly displayName = 'Local stub (typed fallback)';
  private listening = false;

  isAvailable(): boolean {
    return true;
  }

  async start(): Promise<void> {
    this.listening = true;
  }

  async stop(): Promise<void> {
    this.listening = false;
    this.emitEnd();
  }

  async abort(): Promise<void> {
    this.listening = false;
    this.emitEnd();
  }

  injectTranscript(text: string): void {
    if (!this.listening) return;
    this.emitResult({ text, confidence: 1, isFinal: true });
  }
}
