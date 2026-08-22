import { CharacterController } from '../character/CharacterController';
import { AnimationController } from '../animation/AnimationController';
import { AudioManager, VoiceLineId } from '../audio/AudioManager';
import { createSpeechProvider, LocalStubSpeechProvider, SpeechProvider } from '../speech';
import { VoiceActivityDetector, MicPipelineStatus } from '../speech/VoiceActivityDetector';
import { LocalBenConversation, BenReply } from '../conversation/LocalBenConversation';
import { AppSettings } from '../main/preload';
import { CharacterState } from '../character/types';

export type VoiceMode = 'idle' | 'phone' | 'repeat';

export interface VoicePipelineCallbacks {
  onStatus: (status: MicPipelineStatus) => void;
  onTranscript?: (text: string, final: boolean) => void;
  onError?: (message: string) => void;
  onResponseText?: (text: string) => void;
  onPhoneChanged?: (onCall: boolean) => void;
}

/**
 * Classic Talking Ben phone pipeline:
 * Phone button → ring → Ben picks up → "Ben." → listen continuously →
 * after you speak, random Yes/No/Ben/laugh/Ugh with mouth sync.
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
  private mode: VoiceMode = 'idle';
  private status: MicPipelineStatus = 'idle';
  private busy = false;
  private interim = '';
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
    return this.mode === 'phone';
  }

  getStatus(): MicPipelineStatus {
    return this.status;
  }

  updateSettings(settings: AppSettings): void {
    const speechChanged = settings.speechProvider !== this.settings.speechProvider;
    this.settings = settings;
    if (speechChanged) {
      void this.speech.abort();
      this.unsubs.forEach((u) => u());
      this.unsubs = [];
      this.speech = createSpeechProvider(settings.speechProvider);
      this.bindSpeech();
    }
    this.vad?.setSensitivity(settings.micSensitivity);
  }

  private bindSpeech(): void {
    this.unsubs.push(
      this.speech.onResult((result) => {
        this.callbacks.onTranscript?.(result.text, result.isFinal);
        if (result.isFinal && result.text) {
          this.interim = result.text;
        } else if (result.text) {
          this.interim = result.text;
        }
      }),
    );
    this.unsubs.push(
      this.speech.onError((err) => {
        if (!/no-speech|aborted/i.test(err.message)) {
          this.callbacks.onError?.(err.message);
        }
      }),
    );
  }

  private setStatus(status: MicPipelineStatus): void {
    this.status = status;
    this.callbacks.onStatus(status);
  }

  /** Toggle classic phone call mode */
  async togglePhoneCall(): Promise<void> {
    if (this.mode === 'phone') {
      await this.endPhoneCall();
    } else {
      await this.startPhoneCall();
    }
  }

  async startPhoneCall(): Promise<void> {
    if (this.mode === 'phone') return;
    try {
      await this.audio.unlock();
      this.audio.play('phone_ring');
      this.character.setScene('living');
      this.character.setState('phone');
      this.mode = 'phone';
      this.callbacks.onPhoneChanged?.(true);

      // Brief ring then answer
      await delay(700);
      const hello = this.conversation.answerCall();
      await this.speakLine(hello);

      await this.startListeningLoop();
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err.message : 'Could not start phone call / microphone.',
      );
      this.mode = 'idle';
      this.character.setState('read');
      this.setStatus('idle');
      this.callbacks.onPhoneChanged?.(false);
    }
  }

  async endPhoneCall(): Promise<void> {
    const bye = this.conversation.hangUp();
    await this.stopListening();
    this.mode = 'idle';
    this.callbacks.onPhoneChanged?.(false);
    this.character.setState('phone');
    await this.speakLine(bye);
    this.character.setState('read');
    this.setStatus('idle');
  }

  /** Hold-to-talk style outside phone (optional) */
  async beginPushToTalk(): Promise<void> {
    if (this.busy || this.mode === 'phone') return;
    this.interim = '';
    try {
      this.character.setState('listen');
      this.setStatus('listening');
      await this.speech.start({ continuous: false });
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err.message : 'Microphone unavailable.',
      );
      this.setStatus('idle');
      this.character.setState('read');
    }
  }

  async endPushToTalk(): Promise<void> {
    if (this.mode === 'phone') return;
    await this.speech.stop();
    const text = this.interim.trim();
    this.interim = '';
    if (text) await this.handleUtterance(text);
    else {
      this.setStatus('idle');
      this.character.setState('read');
    }
  }

  async submitText(text: string): Promise<void> {
    const stub = this.speech as LocalStubSpeechProvider;
    if (stub.id === 'local-stub' && typeof stub.injectTranscript === 'function') {
      await stub.start();
      stub.injectTranscript(text);
      await stub.stop();
    }
    await this.handleUtterance(text);
  }

  async playPokeLine(line: VoiceLineId, state: CharacterState = 'poke'): Promise<void> {
    this.character.react(state, 900);
    this.character.startTalking();
    const dur = await this.audio.playVoice(line);
    const t0 = performance.now();
    const timer = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / Math.max(1, dur));
      this.character.setViseme(this.animation.visemeFromText(line, p));
    }, 40);
    await delay(dur);
    window.clearInterval(timer);
    this.character.stopTalking();
  }

  async stopListening(): Promise<void> {
    this.vad?.stop();
    this.vad = null;
    await this.speech.abort();
    this.audio.stopVoice();
    this.busy = false;
  }

  dispose(): void {
    void this.stopListening();
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }

  private async startListeningLoop(): Promise<void> {
    this.vad?.stop();
    this.vad = new VoiceActivityDetector({
      deviceId: this.settings.microphoneDeviceId,
      sensitivity: this.settings.micSensitivity,
      silenceMs: 850,
      minSpeechMs: 250,
      onStatus: (s) => {
        if (!this.busy && this.mode === 'phone') this.setStatus(s);
      },
      onSpeechStart: () => {
        if (this.busy || this.mode !== 'phone') return;
        this.character.setState('listen');
        this.interim = '';
        void this.speech.start({ continuous: true });
      },
      onSpeechEnd: () => {
        if (this.busy || this.mode !== 'phone') return;
        void this.speech.stop();
        const text = this.interim.trim() || 'hey';
        this.interim = '';
        void this.handleUtterance(text);
      },
      onError: (err) => this.callbacks.onError?.(err.message),
    });
    await this.vad.start();
    this.character.setState('phone');
    this.setStatus('listening');
  }

  private async handleUtterance(text: string): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.setStatus('processing');
    this.character.setState('think');
    try {
      const response = await this.conversation.respond(text);
      this.callbacks.onResponseText?.(response.text);
      await this.speakLine(response);
    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err.message : 'Conversation failed.');
      this.character.setState('confused');
      await delay(600);
    } finally {
      this.busy = false;
      if (this.mode === 'phone' && this.vad?.isRunning()) {
        this.setStatus('listening');
        this.character.setState('phone');
      } else {
        this.setStatus('idle');
        if (this.mode !== 'phone') this.character.setState('read');
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
    const estPromise = this.audio.playVoice(response.lineId);
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - t0;
      const progress = Math.min(1, elapsed / 900);
      const viseme = this.animation.visemeFromText(response.text, progress);
      this.character.setViseme(viseme);
    }, 45);
    const dur = await estPromise;
    window.clearInterval(timer);
    if (dur > 900) await delay(Math.min(400, dur - 900));
    this.character.stopTalking();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}
