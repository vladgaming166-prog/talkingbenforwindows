import { SettingsStore, RendererSettings } from '../settings/SettingsStore';
import { createTTSProvider } from '../tts';

export class SettingsPanel {
  private overlay: HTMLElement;
  private store: SettingsStore;
  private onChange: (settings: RendererSettings) => void;
  private open = false;

  constructor(
    host: HTMLElement,
    store: SettingsStore,
    onChange: (settings: RendererSettings) => void,
  ) {
    this.store = store;
    this.onChange = onChange;
    this.overlay = document.createElement('div');
    this.overlay.className = 'settings-overlay';
    this.overlay.hidden = true;
    host.appendChild(this.overlay);
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  async show(): Promise<void> {
    this.open = true;
    this.overlay.hidden = false;
    await this.render();
    requestAnimationFrame(() => this.overlay.classList.add('visible'));
  }

  hide(): void {
    this.open = false;
    this.overlay.classList.remove('visible');
    window.setTimeout(() => {
      if (!this.open) this.overlay.hidden = true;
    }, 200);
  }

  toggle(): void {
    if (this.open) this.hide();
    else void this.show();
  }

  private async render(): Promise<void> {
    const s = this.store.getAll();
    let mics: MediaDeviceInfo[] = [];
    try {
      mics = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'audioinput');
    } catch {
      mics = [];
    }

    const tts = createTTSProvider(s.ttsProvider);
    // Trigger voice list load in Chromium
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
    const voices = tts.getVoices();

    this.overlay.innerHTML = `
      <div class="settings-panel" role="dialog" aria-label="Settings">
        <header>
          <h2>Settings</h2>
          <button type="button" class="icon-btn" data-action="close" aria-label="Close">✕</button>
        </header>
        <div class="settings-body">
          <label>Microphone
            <select data-key="microphoneDeviceId">
              <option value="default">System default</option>
              ${mics
                .map(
                  (m) =>
                    `<option value="${escapeAttr(m.deviceId)}" ${
                      m.deviceId === s.microphoneDeviceId ? 'selected' : ''
                    }>${escapeHtml(m.label || 'Microphone')}</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Speech recognition
            <select data-key="speechProvider">
              <option value="web-speech" ${s.speechProvider === 'web-speech' ? 'selected' : ''}>Web Speech (built-in)</option>
              <option value="local-stub" ${s.speechProvider === 'local-stub' ? 'selected' : ''}>Local stub / typed</option>
            </select>
          </label>
          <label>Text-to-speech
            <select data-key="ttsProvider">
              <option value="web-speech" ${s.ttsProvider === 'web-speech' ? 'selected' : ''}>Web Speech Synthesis</option>
              <option value="local-stub" ${s.ttsProvider === 'local-stub' ? 'selected' : ''}>Local stub</option>
            </select>
          </label>
          <label>Voice
            <select data-key="voiceURI">
              <option value="">Auto</option>
              ${voices
                .map(
                  (v) =>
                    `<option value="${escapeAttr(v.voiceURI)}" ${
                      v.voiceURI === s.voiceURI ? 'selected' : ''
                    }>${escapeHtml(v.name)} (${escapeHtml(v.lang)})</option>`,
                )
                .join('')}
            </select>
          </label>
          <label>Speech speed <span class="val">${s.speechRate.toFixed(2)}</span>
            <input type="range" min="0.5" max="2" step="0.05" data-key="speechRate" value="${s.speechRate}" />
          </label>
          <label>Voice volume <span class="val">${Math.round(s.volume * 100)}%</span>
            <input type="range" min="0" max="1" step="0.01" data-key="volume" value="${s.volume}" />
          </label>
          <label>Sound effects <span class="val">${Math.round(s.sfxVolume * 100)}%</span>
            <input type="range" min="0" max="1" step="0.01" data-key="sfxVolume" value="${s.sfxVolume}" />
          </label>
          <label>Mic sensitivity <span class="val">${Math.round(s.micSensitivity * 100)}%</span>
            <input type="range" min="0.05" max="1" step="0.01" data-key="micSensitivity" value="${s.micSensitivity}" />
          </label>
          <label class="check"><input type="checkbox" data-key="conversationMode" ${s.conversationMode ? 'checked' : ''}/> Conversation mode</label>
          <label class="check"><input type="checkbox" data-key="ambientEnabled" ${s.ambientEnabled ? 'checked' : ''}/> Ambient sound</label>
          <label class="check"><input type="checkbox" data-key="fullscreenOnStart" ${s.fullscreenOnStart ? 'checked' : ''}/> Fullscreen on startup</label>
          <label class="check"><input type="checkbox" data-key="startMinimized" ${s.startMinimized ? 'checked' : ''}/> Start minimized</label>
          <p class="privacy-note">Privacy: microphone audio is processed locally for voice activity. Speech recognition may use your OS/browser engine. Telemetry is off by default. This app is ad-free and needs no account.</p>
          <div class="settings-actions">
            <button type="button" data-action="reset">Reset defaults</button>
          </div>
        </div>
      </div>
    `;

    this.overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => this.hide());
    this.overlay.querySelector('[data-action="reset"]')?.addEventListener('click', async () => {
      const next = await this.store.reset();
      this.onChange(next);
      await this.render();
    });

    this.overlay.querySelectorAll('[data-key]').forEach((el) => {
      el.addEventListener('change', () => void this.commit(el as HTMLElement));
      el.addEventListener('input', () => {
        if ((el as HTMLInputElement).type === 'range') void this.commit(el as HTMLElement);
      });
    });
  }

  private async commit(el: HTMLElement): Promise<void> {
    const key = el.dataset.key as keyof RendererSettings;
    let value: string | number | boolean;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      value = el.checked;
    } else if (el instanceof HTMLInputElement && el.type === 'range') {
      value = Number(el.value);
      const span = el.parentElement?.querySelector('.val');
      if (span) {
        if (key === 'speechRate') span.textContent = value.toFixed(2);
        else span.textContent = `${Math.round(Number(value) * 100)}%`;
      }
    } else if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
      value = el.value;
    } else {
      return;
    }
    const next = await this.store.save({ [key]: value } as Partial<RendererSettings>);
    this.onChange(next);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
