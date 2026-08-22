import { CharacterController } from '../character/CharacterController';
import { AudioManager } from '../audio/AudioManager';
import { SettingsStore, RendererSettings } from '../settings/SettingsStore';
import {
  InteractionSystem,
  createDefaultInteractions,
  playEat,
  playDrink,
  playLabMix,
} from '../interaction/InteractionSystem';
import { VoicePipeline } from '../speech/VoicePipeline';
import { MicIndicator } from '../ui/MicIndicator';
import { SettingsPanel } from '../ui/SettingsPanel';
import { Toast } from '../ui/Toast';
import { createSpeechProvider } from '../speech';

async function main(): Promise<void> {
  const canvas = document.getElementById('ben-canvas') as HTMLCanvasElement;
  const appRoot = document.getElementById('app') as HTMLElement;
  const subtitle = document.getElementById('subtitle') as HTMLElement;
  const callBanner = document.getElementById('call-banner') as HTMLElement;
  const textFallback = document.getElementById('text-fallback') as HTMLFormElement;
  const textInput = document.getElementById('text-input') as HTMLInputElement;
  const livingControls = document.getElementById('living-controls') as HTMLElement;
  const labControls = document.getElementById('lab-controls') as HTMLElement;
  const phoneBtn = document.getElementById('btn-phone') as HTMLButtonElement;

  const store = new SettingsStore();
  let settings = await store.load();
  // Phone conversation is the main experience — enable continuous listening defaults
  if (!settings.conversationMode) {
    settings = await store.save({ conversationMode: true });
  }

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
      if (text) showSubtitle(final ? `You: ${text}` : `… ${text}`);
    },
    onResponseText: (text) => showSubtitle(`Ben: ${text}`),
    onError: (message) => toast.show(message),
    onPhoneChanged: (onCall) => {
      phoneBtn.classList.toggle('active', onCall);
      callBanner.hidden = !onCall;
      livingControls.style.opacity = onCall ? '0.35' : '1';
      livingControls.style.pointerEvents = onCall ? 'none' : 'auto';
      phoneBtn.style.pointerEvents = 'auto';
      phoneBtn.style.opacity = '1';
    },
  });

  const interactions = new InteractionSystem({
    character,
    audio,
    pipeline,
    showToast: (m) => toast.show(m),
  });
  createDefaultInteractions().forEach((h) => interactions.register(h));

  character.on((event) => {
    if (event.type === 'click') void interactions.handleClick(event.region);
  });

  const settingsPanel = new SettingsPanel(appRoot, store, (next) => applySettings(next));

  function applySettings(next: RendererSettings): void {
    audio.setVolume(next.volume);
    audio.setSfxVolume(next.sfxVolume);
    if (next.ambientEnabled && !audio.isMuted()) audio.startAmbient();
    else audio.stopAmbient();
    pipeline.updateSettings(next);
    textFallback.hidden = next.speechProvider !== 'local-stub';
  }
  applySettings(settings);

  const unlock = () => {
    void audio.unlock();
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);

  document.addEventListener('visibilitychange', () => {
    character.setVisible(document.visibilityState === 'visible');
  });

  const showLiving = () => {
    character.setScene('living');
    livingControls.hidden = false;
    labControls.hidden = true;
  };
  const showLab = () => {
    if (pipeline.isOnCall()) {
      toast.show('Hang up before visiting the lab.');
      return;
    }
    character.setScene('lab');
    livingControls.hidden = true;
    labControls.hidden = false;
  };

  document.getElementById('btn-lab-banner')!.addEventListener('click', () => {
    audio.play('ui-click');
    showLab();
  });
  document.getElementById('btn-lab')!.addEventListener('click', () => {
    audio.play('ui-click');
    showLab();
  });
  document.getElementById('btn-home')!.addEventListener('click', () => {
    audio.play('ui-click');
    showLiving();
  });

  phoneBtn.addEventListener('click', async () => {
    await audio.unlock();
    audio.play('ui-toggle');
    await pipeline.togglePhoneCall();
  });

  document.getElementById('btn-food')!.addEventListener('click', async () => {
    audio.play('ui-click');
    await playEat({ character, audio, pipeline, showToast: (m) => toast.show(m) });
  });
  document.getElementById('btn-drink')!.addEventListener('click', async () => {
    audio.play('ui-click');
    await playDrink({ character, audio, pipeline, showToast: (m) => toast.show(m) });
  });

  const talkBtn = document.getElementById('btn-talk') as HTMLButtonElement;
  talkBtn.addEventListener('pointerdown', async (e) => {
    e.preventDefault();
    if (pipeline.isOnCall()) return;
    talkBtn.classList.add('active');
    await audio.unlock();
    // Quick talk = start a phone call (classic main interaction)
    await pipeline.startPhoneCall();
  });
  talkBtn.addEventListener('pointerup', () => talkBtn.classList.remove('active'));

  labControls.querySelectorAll('[data-tube]').forEach((el) => {
    el.addEventListener('click', async () => {
      const idx = Number((el as HTMLElement).dataset.tube || 0);
      await playLabMix({ character, audio, pipeline, showToast: (m) => toast.show(m) }, idx);
    });
  });

  document.getElementById('btn-info')!.addEventListener('click', () => {
    audio.play('ui-click');
    settingsPanel.toggle();
  });
  document.getElementById('btn-camera')!.addEventListener('click', () => {
    audio.play('ui-click');
    toast.show('Camera recording is not required for this desktop build.');
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

  const speech = createSpeechProvider(settings.speechProvider);
  if (!speech.isAvailable() || speech.id === 'local-stub') {
    textFallback.hidden = false;
    toast.show('Speech recognition unavailable — type while on the phone.');
    await store.save({ speechProvider: 'local-stub' });
  }

  // Hint for first-time users
  window.setTimeout(() => {
    toast.show('Tap the green phone, then speak — Ben answers Yes / No / Ben / Ha ha ha!');
  }, 900);

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
