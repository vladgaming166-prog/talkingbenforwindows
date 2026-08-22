import Store from 'electron-store';

export interface AppSettings {
  microphoneDeviceId: string;
  speechProvider: 'web-speech' | 'local-stub';
  ttsProvider: 'web-speech' | 'local-stub';
  voiceURI: string;
  speechRate: number;
  volume: number;
  sfxVolume: number;
  micSensitivity: number;
  conversationMode: boolean;
  fullscreen: boolean;
  fullscreenOnStart: boolean;
  startMinimized: boolean;
  ambientEnabled: boolean;
  telemetryEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  microphoneDeviceId: 'default',
  speechProvider: 'web-speech',
  ttsProvider: 'web-speech',
  voiceURI: '',
  speechRate: 1,
  volume: 0.9,
  sfxVolume: 0.55,
  micSensitivity: 0.35,
  conversationMode: false,
  fullscreen: false,
  fullscreenOnStart: false,
  startMinimized: false,
  ambientEnabled: true,
  telemetryEnabled: false,
};

interface StoreSchema {
  settings: AppSettings;
}

export class SettingsService {
  private store: Store<StoreSchema>;

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'talking-ben-settings',
      defaults: {
        settings: { ...DEFAULT_SETTINGS },
      },
    });
  }

  get(): AppSettings {
    return { ...DEFAULT_SETTINGS, ...this.store.get('settings') };
  }

  update(partial: Partial<AppSettings>): AppSettings {
    const next = { ...this.get(), ...partial };
    this.store.set('settings', next);
    return next;
  }

  reset(): AppSettings {
    this.store.set('settings', { ...DEFAULT_SETTINGS });
    return this.get();
  }
}
