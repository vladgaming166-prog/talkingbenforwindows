import { contextBridge, ipcRenderer } from 'electron';

export type MicStatus = 'idle' | 'listening' | 'processing' | 'speaking';

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

const allowedInvoke = new Set([
  'settings:get',
  'settings:set',
  'settings:reset',
  'window:setFullscreen',
  'window:minimize',
  'window:maximize',
  'window:close',
  'window:isFullscreen',
  'app:getVersion',
  'app:getPlatform',
]);

function invokeSafe<T>(channel: string, ...args: unknown[]): Promise<T> {
  if (!allowedInvoke.has(channel)) {
    return Promise.reject(new Error(`Blocked IPC channel: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const api = {
  getSettings(): Promise<AppSettings> {
    return invokeSafe('settings:get');
  },
  setSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    return invokeSafe('settings:set', partial);
  },
  resetSettings(): Promise<AppSettings> {
    return invokeSafe('settings:reset');
  },
  setFullscreen(value: boolean): Promise<boolean> {
    return invokeSafe('window:setFullscreen', value);
  },
  isFullscreen(): Promise<boolean> {
    return invokeSafe('window:isFullscreen');
  },
  minimize(): Promise<void> {
    return invokeSafe('window:minimize');
  },
  maximize(): Promise<void> {
    return invokeSafe('window:maximize');
  },
  close(): Promise<void> {
    return invokeSafe('window:close');
  },
  getVersion(): Promise<string> {
    return invokeSafe('app:getVersion');
  },
  getPlatform(): Promise<string> {
    return invokeSafe('app:getPlatform');
  },
  onFullscreenChanged(callback: (value: boolean) => void): () => void {
    const handler = (_: Electron.IpcRendererEvent, value: boolean) => callback(value);
    ipcRenderer.on('window:fullscreen-changed', handler);
    return () => ipcRenderer.removeListener('window:fullscreen-changed', handler);
  },
};

contextBridge.exposeInMainWorld('talkingBen', api);

export type TalkingBenAPI = typeof api;
