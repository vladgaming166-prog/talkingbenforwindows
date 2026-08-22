import { CharacterController } from '../character/CharacterController';
import { AudioManager } from '../audio/AudioManager';
import { SettingsStore, RendererSettings } from '../settings/SettingsStore';
import { InteractionSystem, createDefaultInteractions } from '../interaction/InteractionSystem';
import { VoicePipeline } from '../speech/VoicePipeline';
import { MicIndicator } from '../ui/MicIndicator';
import { SettingsPanel } from '../ui/SettingsPanel';
import { Toast } from '../ui/Toast';
import { createSpeechProvider } from '../speech';

async function main(): Promise<void> {
  const canvas = document.getElementById('ben-canvas') as HTMLCanvasElement;
  const appRoot = document.getElementById('app') as HTMLElement;
  const subtitle = document.getElementById('subtitle') as HTMLElement;
  const textFallback = document.getElementById('text-fallback') as HTMLFormElement;
  const textInput = document.getElementById('text-input') as HTMLInputElement;

  const store = new SettingsStore();
  const settings = await store.load();
  const toast = new Toast(appRoot);
  const audio = new AudioManager({ volume: settings.volume, sfxVolume: settings.sfxVolume });
  const character = new CharacterController(canvas);
  character.start();

  const micIndicator = new MicIndicator(document.getElementById('mic-indicator') as HTMLElement);

  const showSubtitle = (text: string) => {
    if (!text) {
      subtitle.hidden = true;
      return;
    }
    subtitle.hidden = false;
    subtitle.textContent = text;
  };

  const pipeline = new VoicePipeline(character, audio, settings, {
    onStatus: (status) => {
      micIndicator.setStatus(status);
      micIndicator.setActiveMic(status === 'listening');
    },
    onTranscript: (text, final) => {
      if (text) showSubtitle(final ? `You: ${text}` : text);
    },
    onResponseText: (text) => showSubtitle(`Ben: ${text}`),
    onError: (message) => toast.show(message),
  });

  const interactions = new InteractionSystem({
    character,
    audio,
    showToast: (m) => toast.show(m),
  });
  createDefaultInteractions().forEach((h) => interactions.register(h));

  character.on((event) => {
    if (event.type === 'click') {
      void interactions.handleClick(event.region);
    }
  });

  const settingsPanel = new SettingsPanel(appRoot, store, (next) => {
    applySettings(next);
  });

  function applySettings(next: RendererSettings): void {
    audio.setVolume(next.volume);
    audio.setSfxVolume(next.sfxVolume);
    if (next.ambientEnabled && !audio.isMuted()) audio.startAmbient();
    else audio.stopAmbient();
    pipeline.updateSettings(next);

    const convBtn = document.getElementById('btn-conversation') as HTMLButtonElement;
    convBtn.setAttribute('aria-pressed', String(next.conversationMode));
    convBtn.classList.toggle('active', next.conversationMode);

    // Show typed fallback when using stub speech
    textFallback.hidden = next.speechProvider !== 'local-stub';
  }

  applySettings(settings);

  // Unlock audio on first gesture
  const unlock = () => {
    void audio.unlock();
    if (settings.ambientEnabled) audio.startAmbient();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);

  // Visibility: pause RAF when hidden
  document.addEventListener('visibilitychange', () => {
    character.setVisible(document.visibilityState === 'visible');
  });

  // Controls
  const micBtn = document.getElementById('btn-mic') as HTMLButtonElement;
  const startPTT = (e: Event) => {
    e.preventDefault();
    if (store.getAll().conversationMode) {
      toast.show('Turn off conversation mode to use push-to-talk.');
      return;
    }
    micBtn.classList.add('active');
    void audio.unlock();
    void pipeline.beginPushToTalk();
  };
  const endPTT = (e: Event) => {
    e.preventDefault();
    micBtn.classList.remove('active');
    void pipeline.endPushToTalk();
  };
  micBtn.addEventListener('pointerdown', startPTT);
  micBtn.addEventListener('pointerup', endPTT);
  micBtn.addEventListener('pointerleave', endPTT);
  micBtn.addEventListener('pointercancel', endPTT);

  document.getElementById('btn-conversation')!.addEventListener('click', async () => {
    audio.play('ui-toggle');
    const cur = store.getAll();
    const next = await store.save({ conversationMode: !cur.conversationMode });
    applySettings(next);
    if (next.conversationMode) {
      toast.show('Conversation mode on — speak naturally.');
    } else {
      toast.show('Push-to-talk mode.');
    }
  });

  const muteBtn = document.getElementById('btn-mute') as HTMLButtonElement;
  muteBtn.addEventListener('click', () => {
    const muted = !audio.isMuted();
    audio.setMuted(muted);
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.querySelector('.ctrl-label')!.textContent = muted ? 'Unmute' : 'Mute';
    muteBtn.querySelector('.ctrl-icon')!.textContent = muted ? 'Off' : 'Vol';
    audio.play('ui-click');
  });

  document.getElementById('btn-fullscreen')!.addEventListener('click', async () => {
    audio.play('ui-click');
    try {
      if (window.talkingBen) {
        const cur = await window.talkingBen.isFullscreen();
        await window.talkingBen.setFullscreen(!cur);
      } else if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.show('Fullscreen is unavailable.');
    }
  });

  document.getElementById('btn-settings')!.addEventListener('click', () => {
    audio.play('ui-click');
    settingsPanel.toggle();
  });

  document.getElementById('btn-minimize')!.addEventListener('click', () => {
    void window.talkingBen?.minimize();
  });
  document.getElementById('btn-maximize')!.addEventListener('click', () => {
    void window.talkingBen?.maximize();
  });
  document.getElementById('btn-close')!.addEventListener('click', () => {
    void window.talkingBen?.close();
  });

  textFallback.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textInput.value.trim();
    if (!text) return;
    textInput.value = '';
    void pipeline.submitText(text);
  });

  // If speech recognition is unavailable, enable typed fallback automatically
  const speech = createSpeechProvider(settings.speechProvider);
  if (!speech.isAvailable() || speech.id === 'local-stub') {
    textFallback.hidden = false;
    if (!speech.isAvailable()) {
      toast.show('Speech recognition unavailable — type to talk to Ben.');
      await store.save({ speechProvider: 'local-stub' });
    }
  }

  // Warm TTS voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  window.addEventListener('beforeunload', () => {
    pipeline.dispose();
    character.stop();
    audio.stopAmbient();
  });
}

void main().catch((err) => {
  console.error(err);
  const el = document.createElement('div');
  el.className = 'toast show';
  el.textContent = 'Failed to start Talking Ben.';
  document.body.appendChild(el);
});
