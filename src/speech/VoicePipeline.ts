import { CharacterController } from '../character/CharacterController';
import { AnimationController } from '../animation/AnimationController';
import { AudioManager, VoiceLineId } from '../audio/AudioManager';
import { createSpeechProvider, SpeechProvider } from '../speech';
import { VoiceActivityDetector, MicPipelineStatus } from '../speech/VoiceActivityDetector';
import { LocalBenConversation, BenReply } from '../conversation/LocalBenConversation';
import { AppSettings } from '../main/preload';

export interface VoicePipelineCallbacks {
  onStatus: (status: MicPipelineStatus) => void;
  onTranscript?: (text: string, final: boolean) => void;
  onError?: (message: string) => void;
  onResponseText?: (text: string) => void;
  onReady?: () => void;
}

/**
 * Always-on conversation:
 * mic → detect you finished speaking → Ben replies with sound → listen again
 * No buttons required after start.
 */
export class VoicePipeline {
  private character: CharacterController;
  private animation = new AnimationController();
  private audio: AudioManager;
  private speech: SpeechProvider;
  private conversation = new LocalBenConversation();
  private vad: VoiceActivityDetector | null = null;
  private callbacks: VoicePipelineCallbacks;
  private settings: AppSettings;
  private active = false;
  private busy = false;
  private interim = '';
  private heardSpeech = false;
  private unsubs: Array<() => void> = [];

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
    this.bindSpeech();
  }

  isOnCall(): boolean {
    return this.active;
  }

  getStatus(): MicPipelineStatus {
    return this.busy ? 'speaking' : this.active ? 'listening' : 'idle';
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings;
    this.vad?.setSensitivity(settings.micSensitivity);
  }

  private bindSpeech(): void {
    this.unsubs.push(
      this.speech.onResult((result) => {
        this.callbacks.onTranscript?.(result.text, result.isFinal);
        if (result.text) {
          this.interim = result.text;
          this.heardSpeech = true;
        }
      }),
    );
    this.unsubs.push(
      this.speech.onError((err) => {
        if (!/no-speech|aborted|network/i.test(err.message)) {
          this.callbacks.onError?.(err.message);
        }
      }),
    );
  }

  private setStatus(status: MicPipelineStatus): void {
    this.callbacks.onStatus(status);
  }

  /** Start automatic listen/respond loop (call after user gesture). */
  async startAutoConversation(): Promise<void> {
    if (this.active) return;
    try {
      await this.audio.unlock();
      await this.audio.preload();

      this.character.setScene('living');
      this.audio.play('phone_ring');
      this.character.setState('phone');
      this.active = true;

      await delay(650);
      const hello = this.conversation.answerCall();
      await this.speakLine(hello);

      await this.beginListenLoop();
      this.callbacks.onReady?.();
    } catch (err) {
      this.active = false;
      this.character.setState('read');
      this.setStatus('idle');
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  async stop(): Promise<void> {
    this.active = false;
    this.vad?.stop();
    this.vad = null;
    await this.speech.abort();
    this.audio.stopVoice();
    this.busy = false;
    this.setStatus('idle');
    this.character.setState('read');
  }

  dispose(): void {
    void this.stop();
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }

  /** Kept for typed fallback / tests */
  async submitText(text: string): Promise<void> {
    await this.handleUtterance(text || 'hey');
  }

  async playPokeLine(line: VoiceLineId): Promise<void> {
    await this.speakLine({
      text: line,
      emotion: 'poke',
      lineId: line,
    });
  }

  private async beginListenLoop(): Promise<void> {
    this.vad?.stop();
    this.heardSpeech = false;
    this.interim = '';

    this.vad = new VoiceActivityDetector({
      deviceId: this.settings.microphoneDeviceId,
      sensitivity: Math.max(0.25, this.settings.micSensitivity),
      silenceMs: 750,
      minSpeechMs: 220,
      onStatus: (s) => {
        if (!this.busy && this.active) this.setStatus(s);
      },
      onSpeechStart: () => {
        if (this.busy || !this.active) return;
        this.heardSpeech = true;
        this.character.setState('listen');
        this.setStatus('listening');
        // Best-effort speech recognition (optional — Ben mainly reacts to VAD)
        void this.speech.start({ continuous: true }).catch(() => undefined);
      },
      onSpeechEnd: () => {
        if (this.busy || !this.active) return;
        void this.speech.stop().catch(() => undefined);
        const text = this.interim.trim();
        this.interim = '';
        // Classic Ben: respond whenever you finish talking (even with empty transcript)
        if (this.heardSpeech) {
          this.heardSpeech = false;
          void this.handleUtterance(text || 'hey');
        }
      },
      onError: (err) => this.callbacks.onError?.(err.message),
    });

    await this.vad.start();
    this.character.setState('phone');
    this.setStatus('listening');
  }

  private async handleUtterance(text: string): Promise<void> {
    if (this.busy || !this.active) return;
    this.busy = true;
    this.setStatus('processing');
    this.character.setState('think');

    try {
      const response = await this.conversation.respond(text);
      this.callbacks.onResponseText?.(response.text);
      await this.speakLine(response);
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err.message : 'Reply failed.');
      // Still play a fallback sound so the loop never feels broken
      await this.speakLine(this.conversation.answerCall());
    } finally {
      this.busy = false;
      if (this.active) {
        this.character.setState('phone');
        this.setStatus('listening');
      }
    }
  }

  private async speakLine(response: BenReply): Promise<void> {
    this.setStatus('speaking');
    this.character.showReplyFrame(response.lineId);

    if (response.lineId === 'no') this.character.setState('angry');
    else if (response.lineId === 'ha_ha_ha') this.character.setState('laugh');
    else if (response.lineId === 'yes') this.character.setState('happy');
    else if (response.lineId === 'ugh') this.character.setState('surprised');
    else this.character.setState('talk');

    this.character.startTalking();

    const t0 = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - t0) / 800);
      this.character.setViseme(this.animation.visemeFromText(response.text, progress));
    }, 40);

    try {
      const dur = await this.audio.playVoice(response.lineId);
      if (dur > 50) await delay(Math.min(dur, 2500));
      else await delay(700);
    } finally {
      window.clearInterval(timer);
      this.character.stopTalking();
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}
