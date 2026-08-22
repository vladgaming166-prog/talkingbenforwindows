import { CharacterController } from '../character/CharacterController';
import { AudioManager } from '../audio/AudioManager';
import { SettingsStore, RendererSettings } from '../settings/SettingsStore';
import { VoicePipeline } from '../speech/VoicePipeline';
import { MicIndicator } from '../ui/MicIndicator';
import { SettingsPanel } from '../ui/SettingsPanel';
import { Toast } from '../ui/Toast';

async function main(): Promise<void> {
  const canvas = document.getElementById('ben-canvas') as HTMLCanvasElement;
  const appRoot = document.getElementById('app') as HTMLElement;
  const subtitle = document.getElementById('subtitle') as HTMLElement;
  const tapStart = document.getElementById('tap-start') as HTMLButtonElement;

  const store = new SettingsStore();
  const settings = await store.load();
  const toast = new Toast(appRoot);
  const audio = new AudioManager({ volume: settings.volume, sfxVolume: settings.sfxVolume });
  const character = new CharacterController(canvas);
  character.setState('phone');
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
    onTranscript: (text) => {
      if (text) showSubtitle(`You: ${text}`);
    },
    onResponseText: (text) => showSubtitle(`Ben: ${text}`),
    onError: (message) => toast.show(message),
    onReady: () => {
      toast.show('Listening — just speak!');
    },
  });

  const settingsPanel = new SettingsPanel(appRoot, store, (next) => applySettings(next));

  function applySettings(next: RendererSettings): void {
    audio.setVolume(next.volume);
    audio.setSfxVolume(next.sfxVolume);
    pipeline.updateSettings(next);
  }
  applySettings(settings);

  document.addEventListener('visibilitychange', () => {
    character.setVisible(document.visibilityState === 'visible');
  });

  let starting = false;
  const start = async () => {
    if (starting || pipeline.isOnCall()) return;
    starting = true;
    tapStart.classList.add('hidden');
    try {
      await pipeline.startAutoConversation();
    } catch (err) {
      tapStart.classList.remove('hidden');
      starting = false;
      toast.show(
        err instanceof Error
          ? err.message
          : 'Microphone permission needed. Click again and allow mic access.',
      );
    }
  };

  tapStart.addEventListener('click', () => void start());
  // Also allow clicking the character after start overlay is gone — already auto

  document.getElementById('btn-settings')!.addEventListener('click', () => {
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

  window.addEventListener('beforeunload', () => {
    pipeline.dispose();
    character.stop();
  });
}

void main().catch((err) => {
  console.error(err);
  const el = document.createElement('div');
  el.className = 'toast show';
  el.textContent = 'Failed to start Talking Ben.';
  document.body.appendChild(el);
});
