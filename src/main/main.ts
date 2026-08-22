import { app, BrowserWindow, session, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { registerIpcHandlers } from './ipc';
import { SettingsService } from './settings-service';

// Improve stability on headless / low-GPU environments
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');

let mainWindow: BrowserWindow | null = null;
const isDev = process.argv.includes('--dev');

const settingsService = new SettingsService();

function createWindow(): void {
  const settings = settingsService.get();

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 800,
    minHeight: 600,
    title: 'Talking Ben',
    backgroundColor: '#1a2a1a',
    show: false,
    autoHideMenuBar: true,
    fullscreen: Boolean(settings.fullscreenOnStart),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
    icon: getIconPath(),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (settings.startMinimized) {
      mainWindow?.minimize();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Block unexpected navigation / remote content
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url).catch(() => undefined);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowed = url.startsWith('file://');
    if (!allowed) {
      event.preventDefault();
    }
  });

  const indexHtml = path.join(__dirname, '..', 'renderer', 'index.html');
  void mainWindow.loadFile(indexHtml);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function getIconPath(): string | undefined {
  const ico = path.join(__dirname, '..', '..', 'build', 'icon.ico');
  const png = path.join(__dirname, '..', '..', 'build', 'icon.png');
  if (process.platform === 'win32' && fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return undefined;
}

app.whenReady().then(() => {
  // Deny permission requests except media (microphone)
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });

  registerIpcHandlers(settingsService, () => mainWindow);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Hardening
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});
