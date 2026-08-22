import { MicPipelineStatus } from '../speech/VoiceActivityDetector';

const LABELS: Record<MicPipelineStatus, string> = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
  speaking: 'Speaking',
};

export class MicIndicator {
  private root: HTMLElement;
  private statusEl: HTMLElement;
  private pulseEl: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    this.root.classList.add('mic-indicator');
    this.root.innerHTML = `
      <div class="mic-pulse" aria-hidden="true"></div>
      <div class="mic-core" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/>
        </svg>
      </div>
      <span class="mic-label">Idle</span>
    `;
    this.statusEl = this.root.querySelector('.mic-label') as HTMLElement;
    this.pulseEl = this.root.querySelector('.mic-pulse') as HTMLElement;
    this.setStatus('idle');
  }

  setStatus(status: MicPipelineStatus): void {
    this.root.dataset.status = status;
    this.statusEl.textContent = LABELS[status];
    this.root.setAttribute('aria-label', `Microphone ${LABELS[status]}`);
  }

  setActiveMic(active: boolean): void {
    this.root.classList.toggle('mic-active-flag', active);
  }
}
