import { BaseSpeechProvider } from './SpeechProvider';

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string; confidence: number };
    };
  };
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Chromium / Electron Web Speech API provider.
 * Audio stays in the browser speech engine; we do not upload raw recordings ourselves.
 */
export class WebSpeechProvider extends BaseSpeechProvider {
  readonly id = 'web-speech';
  readonly displayName = 'Web Speech (built-in)';
  private recognition: SpeechRecognitionLike | null = null;
  private active = false;
  private shouldRestart = false;

  isAvailable(): boolean {
    return getSpeechRecognitionCtor() !== null;
  }

  async start(options: { continuous?: boolean; lang?: string } = {}): Promise<void> {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      throw new Error('Speech recognition is not available on this system.');
    }
    if (this.active) return;

    this.recognition = new Ctor();
    this.recognition.continuous = Boolean(options.continuous);
    this.recognition.interimResults = true;
    this.recognition.lang = options.lang || 'en-US';
    this.recognition.maxAlternatives = 1;
    this.shouldRestart = Boolean(options.continuous);
    this.active = true;

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const alt = res[0];
        this.emitResult({
          text: alt.transcript.trim(),
          confidence: alt.confidence ?? 0.7,
          isFinal: res.isFinal,
        });
      }
    };

    this.recognition.onerror = (ev) => {
      if (ev.error === 'aborted' || ev.error === 'no-speech') {
        return;
      }
      this.emitError(new Error(`Speech recognition error: ${ev.error}`));
    };

    this.recognition.onend = () => {
      this.active = false;
      this.emitEnd();
      if (this.shouldRestart && this.recognition) {
        try {
          this.active = true;
          this.recognition.start();
        } catch (err) {
          this.active = false;
          this.emitError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      this.active = false;
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async stop(): Promise<void> {
    this.shouldRestart = false;
    this.recognition?.stop();
    this.active = false;
  }

  async abort(): Promise<void> {
    this.shouldRestart = false;
    this.recognition?.abort();
    this.active = false;
  }
}
