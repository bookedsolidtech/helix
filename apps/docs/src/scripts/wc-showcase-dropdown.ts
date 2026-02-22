class WcShowcaseDropdown extends HTMLElement {
  trigger: HTMLButtonElement;
  panel: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null = null;
  animFrame: number = 0;
  particles: {
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
    color: string;
    opacity: number;
  }[] = [];

  constructor() {
    super();
    const trigger = this.querySelector('.showcase-trigger');
    const panel = this.querySelector('.showcase-panel');
    const canvas = this.querySelector('.panel-particles');

    if (!trigger || !panel || !canvas) {
      throw new Error('WcShowcaseDropdown: Required elements not found');
    }

    this.trigger = trigger as HTMLButtonElement;
    this.panel = panel as HTMLElement;
    this.canvas = canvas as HTMLCanvasElement;

    this.trigger.addEventListener('click', () => this.toggle());

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.contains(e.target as Node)) {
        this.close();
      }
    });

    this.panel.addEventListener('keydown', (e) => {
      const items = [...this.panel.querySelectorAll('.showcase-item')] as HTMLElement[];
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[(idx + 1) % items.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length]?.focus();
      }
    });
  }

  initParticles() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const colors = [
      'rgba(6, 182, 212,', // cyan-500
      'rgba(16, 185, 129,', // emerald-500
      'rgba(102, 126, 234,', // indigo
      'rgba(20, 184, 166,', // teal-500
      'rgba(59, 130, 246,', // blue-500
    ];
    this.particles = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
      const colorIndex = Math.floor(Math.random() * colors.length);
      this.particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: colors[colorIndex] ?? colors[0] ?? 'rgba(6, 182, 212,',
        opacity: Math.random() * 0.4 + 0.15,
      });
    }
  }

  animateParticles() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Update + draw particles
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

    // Draw molecular connections
    const maxDist = 100;
    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];
      if (!a) continue;
      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        if (!b) continue;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = 0.08 * (1 - dist / maxDist);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    this.animFrame = requestAnimationFrame(() => this.animateParticles());
  }

  startParticles() {
    const rect = this.panel.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
    }
    this.initParticles();
    this.animateParticles();
  }

  stopParticles() {
    cancelAnimationFrame(this.animFrame);
  }

  toggle() {
    if (this.trigger.getAttribute('aria-expanded') === 'true') {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.trigger.setAttribute('aria-expanded', 'true');
    this.panel.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.panel.classList.add('is-open');
        this.startParticles();
      });
    });
  }

  close() {
    this.trigger.setAttribute('aria-expanded', 'false');
    this.panel.classList.remove('is-open');
    this.stopParticles();
    const panel = this.panel;
    setTimeout(() => {
      if (this.trigger.getAttribute('aria-expanded') !== 'true') {
        panel.style.display = 'none';
      }
    }, 350);
  }
}

customElements.define('wc-showcase-dropdown', WcShowcaseDropdown);
