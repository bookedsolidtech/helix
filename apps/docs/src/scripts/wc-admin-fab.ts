// Pitch FAB -- visible to ALL authenticated users
class WcAdminFab extends HTMLElement {
  trigger: HTMLButtonElement;
  panel: HTMLElement;
  nudge: HTMLElement;

  constructor() {
    super();
    this.trigger = this.querySelector('.fab-trigger')!;
    this.panel = this.querySelector('.fab-panel')!;
    this.nudge = this.querySelector('.fab-nudge')!;

    if (this.isAuthenticated()) this.reveal();

    // Listen for auth changes (login event)
    window.addEventListener('wc-auth-change', (() => {
      this.reveal();
    }) as EventListener);

    this.trigger.addEventListener('click', () => {
      this.dismissNudge();
      this.toggle();
    });

    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node)) this.closePanel();
    });

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closePanel();
        this.trigger.focus();
      }
    });
  }

  isAuthenticated(): boolean {
    try {
      const raw = localStorage.getItem('wc-auth');
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data.authenticated === true;
    } catch { return false; }
  }

  reveal() {
    this.setAttribute('aria-hidden', 'false');
    this.classList.add('visible');
    // Show nudge tooltip after a beat
    setTimeout(() => this.showNudge(), 1500);
  }

  showNudge() {
    // Skip nudge on mobile viewports (matches 50rem breakpoint)
    if (window.matchMedia('(max-width: 50rem)').matches) return;
    this.nudge.classList.add('visible');
    // Auto-dismiss after 6s
    setTimeout(() => this.dismissNudge(), 6000);
  }

  dismissNudge() {
    this.nudge.classList.remove('visible');
  }

  conceal() {
    this.setAttribute('aria-hidden', 'true');
    this.classList.remove('visible');
    this.closePanel();
  }

  toggle() {
    this.trigger.getAttribute('aria-expanded') === 'true' ? this.closePanel() : this.openPanel();
  }

  openPanel() {
    this.trigger.setAttribute('aria-expanded', 'true');
    this.panel.classList.add('is-open');
  }

  closePanel() {
    this.trigger.setAttribute('aria-expanded', 'false');
    this.panel.classList.remove('is-open');
  }
}

customElements.define('wc-admin-fab', WcAdminFab);
