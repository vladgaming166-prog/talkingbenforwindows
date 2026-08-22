export interface TTSSpeakOptions {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

export interface TTSProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): boolean;
  getVoices(): SpeechSynthesisVoiceInfo[];
  speak(text: string, options?: TTSSpeakOptions): Promise<void>;
  stop(): void;
  onBoundary?(handler: (charIndex: number, charLength: number) => void): () => void;
}

export interface SpeechSynthesisVoiceInfo {
  name: string;
  voiceURI: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export abstract class BaseTTSProvider implements TTSProvider {
  abstract readonly id: string;
  abstract readonly displayName: string;
  protected boundaryHandlers = new Set<(charIndex: number, charLength: number) => void>();

  abstract isAvailable(): boolean;
  abstract getVoices(): SpeechSynthesisVoiceInfo[];
  abstract speak(text: string, options?: TTSSpeakOptions): Promise<void>;
  abstract stop(): void;

  onBoundary(handler: (charIndex: number, charLength: number) => void): () => void {
    this.boundaryHandlers.add(handler);
    return () => this.boundaryHandlers.delete(handler);
  }

  protected emitBoundary(charIndex: number, charLength: number): void {
    this.boundaryHandlers.forEach((h) => h(charIndex, charLength));
  }
}
