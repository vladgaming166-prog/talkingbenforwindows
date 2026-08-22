export class Toast {
  private host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = document.createElement('div');
    this.host.className = 'toast-host';
    host.appendChild(this.host);
  }

  show(message: string, ms = 2800): void {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    this.host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    window.setTimeout(() => {
      el.classList.remove('show');
      window.setTimeout(() => el.remove(), 250);
    }, ms);
  }
}
