class WcPinGate extends HTMLElement {
  private pin: string = '';
  private readonly VALID_PINS: Record<string, string> = { '4843': 'viewer', '0727': 'admin' };
  private readonly STORAGE_KEY = 'wc-auth';
  private readonly TIMEOUT_MS = 120 * 60 * 1000; // 120 minutes (2 hours)
  private dots: NodeListOf<Element>;
  private errorEl: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrame: number = 0;
  private particles: { x: number; y: number; size: number; vx: number; vy: number; color: string; opacity: number }[] = [];

  constructor() {
    super();
    this.dots = this.querySelectorAll('.pin-dot');
    this.errorEl = this.querySelector('#pin-error')!;
    this.canvas = this.querySelector('.pin-particles')!;

    // Check auth immediately
    if (this.isAuthenticated()) {
      this.hide();
      this.startActivityTracking();
      return;
    }

    // Show the gate
    this.show();
    this.bindEvents();
  }

  isAuthenticated(): boolean {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.authenticated || !data.timestamp) return false;
      const elapsed = Date.now() - data.timestamp;
      if (elapsed > this.TIMEOUT_MS) {
        localStorage.removeItem(this.STORAGE_KEY);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Refresh the session timestamp on user activity */
  private refreshSession(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.authenticated) {
        data.timestamp = Date.now();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      }
    } catch { /* ignore */ }
  }

  /** Start listening for user activity to keep session alive */
  private startActivityTracking(): void {
    // Throttle to once per 30s for more responsive session refreshes
    let lastRefresh = 0;
    const throttledRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh > 30_000) {
        lastRefresh = now;
        this.refreshSession();
      }
    };
    document.addEventListener('click', throttledRefresh, { passive: true });
    document.addEventListener('keydown', throttledRefresh, { passive: true });
    document.addEventListener('scroll', throttledRefresh, { passive: true });

    // Refresh session on Astro page navigations (View Transitions)
    document.addEventListener('astro:page-load', () => {
      this.refreshSession();
    });

    // Refresh session when user returns to the tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refreshSession();
      }
    });
  }

  authenticate(role: string = 'viewer'): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
      authenticated: true,
      timestamp: Date.now(),
      role
    }));
  }

  show(): void {
    // Reset PIN state
    this.pin = '';
    this.dots.forEach(dot => dot.classList.remove('filled', 'success', 'error'));
    this.clearError();

    this.setAttribute('aria-hidden', 'false');
    this.classList.remove('dismissing');
    this.classList.add('visible');
    document.body.style.overflow = 'hidden';
    this.startParticles();

    // Make gate itself focusable and grab focus
    this.setAttribute('tabindex', '-1');
    requestAnimationFrame(() => {
      this.focus();
    });

    // Focus trap: if anything outside the gate gets focus, steal it back
    this._focusTrap = (e: FocusEvent) => {
      if (!this.classList.contains('visible')) return;
      const target = e.target as Node;
      if (target && !this.contains(target)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.focus();
      }
    };
    document.addEventListener('focusin', this._focusTrap, true);
  }

  private _focusTrap: ((e: FocusEvent) => void) | null = null;

  hide(): void {
    this.classList.add('dismissing');
    document.body.style.overflow = '';
    this.stopParticles();
    // Remove focus trap
    if (this._focusTrap) {
      document.removeEventListener('focusin', this._focusTrap, true);
      this._focusTrap = null;
    }
    setTimeout(() => {
      this.setAttribute('aria-hidden', 'true');
      this.classList.remove('visible', 'dismissing');
    }, 600);
  }

  bindEvents(): void {
    // Key button clicks
    this.querySelectorAll('.key[data-digit]').forEach(key => {
      key.addEventListener('click', () => {
        const digit = (key as HTMLElement).dataset.digit;
        if (digit !== undefined) this.addDigit(digit);
      });
    });

    // Delete button
    this.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      this.deleteDigit();
    });

    // T9 letter-to-digit mapping (so typing "HUGE" works)
    const letterMap: Record<string, string> = {
      a:'2',b:'2',c:'2', d:'3',e:'3',f:'3',
      g:'4',h:'4',i:'4', j:'5',k:'5',l:'5',
      m:'6',n:'6',o:'6', p:'7',q:'7',r:'7',s:'7',
      t:'8',u:'8',v:'8', w:'9',x:'9',y:'9',z:'9',
    };

    // Keyboard input -- capture phase so we beat Starlight's handlers,
    // but let system shortcuts (Cmd/Ctrl combos) pass through.
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.classList.contains('visible')) return;

      // Let system/OS shortcuts through (screenshots, copy, etc.)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      let digit: string | undefined;

      if (e.key >= '0' && e.key <= '9') {
        digit = e.key;
      } else if (letterMap[e.key.toLowerCase()]) {
        digit = letterMap[e.key.toLowerCase()];
      }

      if (digit) {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.addDigit(digit);
        const keyEl = this.querySelector(`.key[data-digit="${digit}"]`);
        if (keyEl) {
          keyEl.classList.add('pressed');
          setTimeout(() => keyEl.classList.remove('pressed'), 150);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        e.stopImmediatePropagation();
        this.deleteDigit();
        const delEl = this.querySelector('[data-action="delete"]');
        if (delEl) {
          delEl.classList.add('pressed');
          setTimeout(() => delEl.classList.remove('pressed'), 150);
        }
      } else if (e.key === 'Tab') {
        // Prevent tab from leaving the gate
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true); // CAPTURE phase -- fires before Starlight search etc.
  }

  addDigit(digit: string): void {
    if (this.pin.length >= 4) return;
    this.pin += digit;
    this.updateDots();
    this.clearError();

    if (this.pin.length === 4) {
      setTimeout(() => this.checkPin(), 200);
    }
  }

  deleteDigit(): void {
    if (this.pin.length === 0) return;
    this.pin = this.pin.slice(0, -1);
    this.updateDots();
    this.clearError();
  }

  updateDots(): void {
    this.dots.forEach((dot, i) => {
      if (i < this.pin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  checkPin(): void {
    const role = this.VALID_PINS[this.pin];
    if (role) {
      // Success
      this.dots.forEach(dot => dot.classList.add('success'));
      this.authenticate(role);
      this.startActivityTracking();
      setTimeout(() => {
        this.hide();
        // Dispatch event so admin menu can react
        window.dispatchEvent(new CustomEvent('wc-auth-change', { detail: { role } }));
      }, 500);
    } else {
      // Failure - shake animation
      this.dots.forEach(dot => dot.classList.add('error'));
      const display = this.querySelector('.pin-display');
      if (display) {
        display.classList.add('shake');
        setTimeout(() => display.classList.remove('shake'), 500);
      }
      this.showError('Incorrect code');
      setTimeout(() => {
        this.pin = '';
        this.dots.forEach(dot => {
          dot.classList.remove('filled', 'error');
        });
      }, 600);
    }
  }

  showError(msg: string): void {
    this.errorEl.textContent = msg;
    this.errorEl.classList.add('visible');
  }

  clearError(): void {
    this.errorEl.textContent = '';
    this.errorEl.classList.remove('visible');
  }

  // === Particle system (matches Header.astro molecular pattern) ===
  initParticles(): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const colors = [
      'rgba(6, 182, 212,',    // cyan
      'rgba(16, 185, 129,',   // emerald
      'rgba(102, 126, 234,',  // indigo
      'rgba(139, 92, 246,',   // violet
      'rgba(59, 130, 246,',   // blue
    ];
    this.particles = [];
    const count = 120;
    const idx = colors.length;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.5 + 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * idx)]!,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
  }

  animateParticles(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > w) p.x = 0;
      if (p.x < 0) p.x = w;
      if (p.y > h) p.y = 0;
      if (p.y < 0) p.y = h;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.opacity + ')';
      ctx.fill();
    }

    // Molecular connections
    const maxDist = 120;
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i]!;
      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = 0.06 * (1 - dist / maxDist);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    this.animFrame = requestAnimationFrame(() => this.animateParticles());
  }

  startParticles(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
      // Reset canvas dimensions after scale
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
    }
    this.initParticles();
    this.animateParticles();
  }

  stopParticles(): void {
    cancelAnimationFrame(this.animFrame);
  }
}

customElements.define('wc-pin-gate', WcPinGate);
