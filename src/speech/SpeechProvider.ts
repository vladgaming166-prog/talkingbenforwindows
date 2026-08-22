export interface SpeechResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechProvider {
  readonly id: string;
  readonly displayName: string;
  isAvailable(): boolean;
  start(options?: { continuous?: boolean; lang?: string }): Promise<void>;
  stop(): Promise<void>;
  abort(): Promise<void>;
  onResult(handler: (result: SpeechResult) => void): () => void;
  onError(handler: (error: Error) => void): () => void;
  onEnd(handler: () => void): () => void;
}

export abstract class BaseSpeechProvider implements SpeechProvider {
  abstract readonly id: string;
  abstract readonly displayName: string;
  protected resultHandlers = new Set<(r: SpeechResult) => void>();
  protected errorHandlers = new Set<(e: Error) => void>();
  protected endHandlers = new Set<() => void>();

  abstract isAvailable(): boolean;
  abstract start(options?: { continuous?: boolean; lang?: string }): Promise<void>;
  abstract stop(): Promise<void>;
  abstract abort(): Promise<void>;

  onResult(handler: (result: SpeechResult) => void): () => void {
    this.resultHandlers.add(handler);
    return () => this.resultHandlers.delete(handler);
  }

  onError(handler: (error: Error) => void): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onEnd(handler: () => void): () => void {
    this.endHandlers.add(handler);
    return () => this.endHandlers.delete(handler);
  }

  protected emitResult(result: SpeechResult): void {
    this.resultHandlers.forEach((h) => h(result));
  }

  protected emitError(error: Error): void {
    this.errorHandlers.forEach((h) => h(error));
  }

  protected emitEnd(): void {
    this.endHandlers.forEach((h) => h());
  }
}
