export interface RendererSettings {
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

export const RENDERER_DEFAULTS: RendererSettings = {
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

/**
 * Renderer-side settings helper backed by Electron store via preload IPC.
 * Falls back to localStorage when not running inside Electron.
 */
export class SettingsStore {
  private cache: RendererSettings = { ...RENDERER_DEFAULTS };

  async load(): Promise<RendererSettings> {
    try {
      if (window.talkingBen) {
        this.cache = { ...RENDERER_DEFAULTS, ...(await window.talkingBen.getSettings()) };
        return this.cache;
      }
    } catch {
      /* fall through */
    }
    try {
      const raw = localStorage.getItem('talking-ben-settings');
      if (raw) this.cache = { ...RENDERER_DEFAULTS, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return this.cache;
  }

  getAll(): RendererSettings {
    return { ...this.cache };
  }

  async save(partial: Partial<RendererSettings>): Promise<RendererSettings> {
    this.cache = { ...this.cache, ...partial };
    try {
      if (window.talkingBen) {
        this.cache = await window.talkingBen.setSettings(partial);
        return this.cache;
      }
    } catch {
      /* fall through */
    }
    localStorage.setItem('talking-ben-settings', JSON.stringify(this.cache));
    return this.cache;
  }

  async reset(): Promise<RendererSettings> {
    this.cache = { ...RENDERER_DEFAULTS };
    try {
      if (window.talkingBen) {
        this.cache = await window.talkingBen.resetSettings();
        return this.cache;
      }
    } catch {
      /* ignore */
    }
    localStorage.setItem('talking-ben-settings', JSON.stringify(this.cache));
    return this.cache;
  }
}
