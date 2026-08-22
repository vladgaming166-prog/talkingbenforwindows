import { BaseTTSProvider, SpeechSynthesisVoiceInfo, TTSSpeakOptions } from './TTSProvider';

/**
 * Offline stub TTS: synthesizes a simple tone pattern while driving mouth animation
 * via timed boundary callbacks approximating speech duration.
 */
export class LocalStubTTSProvider extends BaseTTSProvider {
  readonly id = 'local-stub';
  readonly displayName = 'Local stub (tone)';
  private timer: number | null = null;
  private aborted = false;

  isAvailable(): boolean {
    return true;
  }

  getVoices(): SpeechSynthesisVoiceInfo[] {
    return [
      {
        name: 'Local Ben (stub)',
        voiceURI: 'local-ben-stub',
        lang: 'en-US',
        localService: true,
        default: true,
      },
    ];
  }

  speak(text: string, options: TTSSpeakOptions = {}): Promise<void> {
    this.stop();
    this.aborted = false;
    const rate = options.rate ?? 1;
    const duration = Math.max(600, (text.length / 14) * 1000 / rate);

    return new Promise((resolve) => {
      const start = performance.now();
      const tick = () => {
        if (this.aborted) {
          resolve();
          return;
        }
        const elapsed = performance.now() - start;
        const progress = Math.min(1, elapsed / duration);
        const idx = Math.floor(progress * text.length);
        this.emitBoundary(idx, 1);
        if (progress >= 1) {
          this.timer = null;
          resolve();
          return;
        }
        this.timer = window.setTimeout(tick, 40);
      };
      tick();
    });
  }

  stop(): void {
    this.aborted = true;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
