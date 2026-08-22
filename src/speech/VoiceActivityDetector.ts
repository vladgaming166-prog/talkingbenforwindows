export type MicPipelineStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export interface VoiceActivityOptions {
  deviceId?: string;
  sensitivity?: number;
  silenceMs?: number;
  minSpeechMs?: number;
  onStatus?: (status: MicPipelineStatus) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onLevel?: (level: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Microphone + energy-based VAD. Does not upload audio.
 */
export class VoiceActivityDetector {
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private raf = 0;
  private running = false;
  private speaking = false;
  private silenceStart = 0;
  private speechStart = 0;
  private options: Required<
    Pick<VoiceActivityOptions, 'sensitivity' | 'silenceMs' | 'minSpeechMs'>
  > &
    VoiceActivityOptions;

  constructor(options: VoiceActivityOptions = {}) {
    this.options = {
      sensitivity: options.sensitivity ?? 0.35,
      silenceMs: options.silenceMs ?? 900,
      minSpeechMs: options.minSpeechMs ?? 280,
      ...options,
    };
  }

  async start(): Promise<void> {
    if (this.running) return;
    try {
      const constraints: MediaStreamConstraints = {
        audio: this.options.deviceId && this.options.deviceId !== 'default'
          ? { deviceId: { exact: this.options.deviceId } }
          : true,
        video: false,
      };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.audioCtx = new AudioContext();
      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.source.connect(this.analyser);
      this.running = true;
      this.options.onStatus?.('listening');
      this.loop();
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error('Microphone unavailable or permission denied.');
      this.options.onError?.(error);
      throw error;
    }
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.source?.disconnect();
    this.analyser?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.audioCtx?.close();
    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.speaking = false;
    this.options.onStatus?.('idle');
  }

  setSensitivity(value: number): void {
    this.options.sensitivity = Math.min(1, Math.max(0.05, value));
  }

  isRunning(): boolean {
    return this.running;
  }

  private loop = (): void => {
    if (!this.running || !this.analyser) return;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    this.options.onLevel?.(rms);

    // Map sensitivity: higher sensitivity => lower threshold
    const threshold = 0.02 + (1 - this.options.sensitivity) * 0.08;
    const now = performance.now();

    if (rms > threshold) {
      if (!this.speaking) {
        this.speaking = true;
        this.speechStart = now;
        this.options.onSpeechStart?.();
      }
      this.silenceStart = 0;
    } else if (this.speaking) {
      if (!this.silenceStart) this.silenceStart = now;
      if (now - this.silenceStart >= this.options.silenceMs) {
        const speechLen = now - this.speechStart;
        this.speaking = false;
        this.silenceStart = 0;
        if (speechLen >= this.options.minSpeechMs) {
          this.options.onSpeechEnd?.();
        }
      }
    }

    this.raf = requestAnimationFrame(this.loop);
  };
}
