import { CharacterController } from '../character/CharacterController';
import { AnimationController } from '../animation/AnimationController';
import { AudioManager } from '../audio/AudioManager';
import { createSpeechProvider, LocalStubSpeechProvider, SpeechProvider } from '../speech';
import { VoiceActivityDetector, MicPipelineStatus } from '../speech/VoiceActivityDetector';
import { createTTSProvider, TTSProvider } from '../tts';
import { createConversationProvider, ConversationProvider } from '../conversation';
import { AppSettings } from '../main/preload';

export type VoiceMode = 'push-to-talk' | 'conversation';

export interface VoicePipelineCallbacks {
  onStatus: (status: MicPipelineStatus) => void;
  onTranscript?: (text: string, final: boolean) => void;
  onError?: (message: string) => void;
  onResponseText?: (text: string) => void;
}

/**
 * Microphone → VAD → STT → conversation → TTS → animation
 */
export class VoicePipeline {
  private character: CharacterController;
  private animation = new AnimationController();
  private audio: AudioManager;
  private speech: SpeechProvider;
  private tts: TTSProvider;
  private conversation: ConversationProvider;
  private vad: VoiceActivityDetector | null = null;
  private callbacks: VoicePipelineCallbacks;
  private settings: AppSettings;
  private mode: VoiceMode = 'push-to-talk';
  private status: MicPipelineStatus = 'idle';
  private busy = false;
  private interim = '';
  private history: Array<{ role: 'user' | 'ben'; text: string }> = [];
  private unsubs: Array<() => void> = [];
  private pttActive = false;

  constructor(
    character: CharacterController,
    audio: AudioManager,
    settings: AppSettings,
    callbacks: VoicePipelineCallbacks,
  ) {
    this.character = character;
    this.audio = audio;
    this.settings = settings;
    this.callbacks = callbacks;
    this.speech = createSpeechProvider(settings.speechProvider);
    this.tts = createTTSProvider(settings.ttsProvider);
    this.conversation = createConversationProvider('local-ben');
    this.mode = settings.conversationMode ? 'conversation' : 'push-to-talk';
    this.bindSpeech();
  }

  getStatus(): MicPipelineStatus {
    return this.status;
  }

  getMode(): VoiceMode {
    return this.mode;
  }

  updateSettings(settings: AppSettings): void {
    const speechChanged = settings.speechProvider !== this.settings.speechProvider;
    const ttsChanged = settings.ttsProvider !== this.settings.ttsProvider;
    this.settings = settings;
    if (speechChanged) {
      void this.speech.abort();
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.speech = createSpeechProvider(settings.speechProvider);
      this.bindSpeech();
    }
    if (ttsChanged) {
      this.tts.stop();
      this.tts = createTTSProvider(settings.ttsProvider);
    }
    this.vad?.setSensitivity(settings.micSensitivity);
    const nextMode = settings.conversationMode ? 'conversation' : 'push-to-talk';
    if (nextMode !== this.mode) {
      void this.setMode(nextMode);
    }
  }

  private bindSpeech(): void {
    this.unsubs.push(
      this.speech.onResult((result) => {
        this.callbacks.onTranscript?.(result.text, result.isFinal);
        if (result.isFinal && result.text) {
          this.interim = result.text;
          if (this.mode === 'push-to-talk' && this.pttActive) {
            // Wait for release
          } else if (this.mode === 'conversation') {
            void this.handleUtterance(result.text);
          }
        } else {
          this.interim = result.text;
        }
      }),
    );
    this.unsubs.push(
      this.speech.onError((err) => {
        this.callbacks.onError?.(err.message);
        this.setStatus('idle');
        this.character.setState('idle');
      }),
    );
  }

  private setStatus(status: MicPipelineStatus): void {
    this.status = status;
    this.callbacks.onStatus(status);
  }

  async setMode(mode: VoiceMode): Promise<void> {
    await this.stopListening();
    this.mode = mode;
    if (mode === 'conversation') {
      await this.startConversationMode();
    } else {
      this.setStatus('idle');
    }
  }

  async startConversationMode(): Promise<void> {
    try {
      this.vad?.stop();
      this.vad = new VoiceActivityDetector({
        deviceId: this.settings.microphoneDeviceId,
        sensitivity: this.settings.micSensitivity,
        onStatus: (s) => {
          if (!this.busy) this.setStatus(s);
        },
        onSpeechStart: () => {
          if (this.busy) return;
          this.character.setState('listen');
          void this.speech.start({ continuous: true });
        },
        onSpeechEnd: () => {
          if (this.busy) return;
          void this.speech.stop();
          if (this.interim.trim()) {
            void this.handleUtterance(this.interim.trim());
            this.interim = '';
          }
        },
        onError: (err) => this.callbacks.onError?.(err.message),
      });
      await this.vad.start();
      this.character.setState('listen');
      this.setStatus('listening');
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err.message : 'Could not start conversation mode.',
      );
      this.setStatus('idle');
    }
  }

  async beginPushToTalk(): Promise<void> {
    if (this.busy || this.mode !== 'push-to-talk') return;
    this.pttActive = true;
    this.interim = '';
    try {
      this.character.setState('listen');
      this.setStatus('listening');
      await this.speech.start({ continuous: false });
    } catch (err) {
      this.pttActive = false;
      this.callbacks.onError?.(
        err instanceof Error ? err.message : 'Microphone / speech recognition unavailable.',
      );
      this.setStatus('idle');
      this.character.setState('idle');
    }
  }

  async endPushToTalk(): Promise<void> {
    if (!this.pttActive) return;
    this.pttActive = false;
    await this.speech.stop();
    const text = this.interim.trim();
    this.interim = '';
    if (text) {
      await this.handleUtterance(text);
    } else {
      this.setStatus('idle');
      this.character.setState('idle');
    }
  }

  /** Accessibility / stub path */
  async submitText(text: string): Promise<void> {
    const stub = this.speech as LocalStubSpeechProvider;
    if (stub.id === 'local-stub' && typeof stub.injectTranscript === 'function') {
      await stub.start();
      stub.injectTranscript(text);
      await stub.stop();
    }
    await this.handleUtterance(text);
  }

  async stopListening(): Promise<void> {
    this.pttActive = false;
    this.vad?.stop();
    this.vad = null;
    await this.speech.abort();
    this.tts.stop();
    this.busy = false;
    this.setStatus('idle');
  }

  dispose(): void {
    void this.stopListening();
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }

  private async handleUtterance(text: string): Promise<void> {
    if (this.busy || !text.trim()) return;
    this.busy = true;
    this.setStatus('processing');
    this.character.setState('think');

    try {
      this.history.push({ role: 'user', text });
      if (this.history.length > 12) this.history.shift();

      const response = await this.conversation.respond(text, { history: this.history });
      this.history.push({ role: 'ben', text: response.text });
      this.callbacks.onResponseText?.(response.text);

      if (response.sound) this.audio.play(response.sound);
      this.character.setState(response.emotion === 'talk' ? 'talk' : response.emotion);

      this.setStatus('speaking');
      this.character.startTalking();

      const unsubBoundary = this.tts.onBoundary?.((charIndex) => {
        const progress = Math.min(1, charIndex / Math.max(1, response.text.length));
        const viseme = this.animation.visemeFromText(response.text, progress);
        this.character.setViseme(viseme);
      });

      // Viseme fallback timer if boundaries aren't fired
      let fallbackTimer: number | null = null;
      let t0 = performance.now();
      const est = Math.max(600, (response.text.length / 14) * 1000 / (this.settings.speechRate || 1));
      fallbackTimer = window.setInterval(() => {
        const progress = Math.min(1, (performance.now() - t0) / est);
        const viseme = this.animation.visemeFromText(response.text, progress);
        this.character.setViseme(viseme);
      }, 50);

      try {
        await this.tts.speak(response.text, {
          voiceURI: this.settings.voiceURI || undefined,
          rate: this.settings.speechRate,
          volume: this.settings.volume,
        });
      } catch (err) {
        this.callbacks.onError?.(
          err instanceof Error ? err.message : 'Text-to-speech failed.',
        );
      } finally {
        if (fallbackTimer !== null) window.clearInterval(fallbackTimer);
        unsubBoundary?.();
      }

      this.character.stopTalking();
      this.character.setState('idle');
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err.message : 'Conversation failed.',
      );
      this.character.setState('confused');
      window.setTimeout(() => this.character.setState('idle'), 1000);
    } finally {
      this.busy = false;
      if (this.mode === 'conversation' && this.vad?.isRunning()) {
        this.setStatus('listening');
        this.character.setState('listen');
      } else {
        this.setStatus('idle');
      }
    }
  }
}
