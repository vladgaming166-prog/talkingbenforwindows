import { BrowserWindow, ipcMain } from 'electron';
import { SettingsService, DEFAULT_SETTINGS, AppSettings } from './settings-service';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizePartial(input: unknown): Partial<AppSettings> {
  if (!isObject(input)) return {};
  const out: Partial<AppSettings> = {};
  const keys = Object.keys(DEFAULT_SETTINGS) as (keyof AppSettings)[];
  for (const key of keys) {
    if (!(key in input)) continue;
    const value = input[key];
    const expected = typeof DEFAULT_SETTINGS[key];
    if (typeof value === expected) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  if (typeof out.speechRate === 'number') {
    out.speechRate = Math.min(2, Math.max(0.5, out.speechRate));
  }
  if (typeof out.volume === 'number') {
    out.volume = Math.min(1, Math.max(0, out.volume));
  }
  if (typeof out.sfxVolume === 'number') {
    out.sfxVolume = Math.min(1, Math.max(0, out.sfxVolume));
  }
  if (typeof out.micSensitivity === 'number') {
    out.micSensitivity = Math.min(1, Math.max(0.05, out.micSensitivity));
  }
  return out;
}

export function registerIpcHandlers(
  settings: SettingsService,
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle('settings:get', () => settings.get());

  ipcMain.handle('settings:set', (_event, partial: unknown) => {
    return settings.update(sanitizePartial(partial));
  });

  ipcMain.handle('settings:reset', () => settings.reset());

  ipcMain.handle('window:setFullscreen', (_event, value: unknown) => {
    const win = getWindow();
    if (!win) return false;
    const on = Boolean(value);
    win.setFullScreen(on);
    return win.isFullScreen();
  });

  ipcMain.handle('window:isFullscreen', () => {
    return getWindow()?.isFullScreen() ?? false;
  });

  ipcMain.handle('window:minimize', () => {
    getWindow()?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    const win = getWindow();
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.handle('window:close', () => {
    getWindow()?.close();
  });

  ipcMain.handle('app:getVersion', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { app } = require('electron') as typeof import('electron');
    return app.getVersion();
  });

  ipcMain.handle('app:getPlatform', () => process.platform);

  // Forward fullscreen changes
  const attach = () => {
    const win = getWindow();
    if (!win) return;
    win.on('enter-full-screen', () => {
      win.webContents.send('window:fullscreen-changed', true);
    });
    win.on('leave-full-screen', () => {
      win.webContents.send('window:fullscreen-changed', false);
    });
  };

  // Delay attach until window exists
  setTimeout(attach, 0);
}
