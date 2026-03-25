import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HxButtonDirective } from '../../lib/helix.directives.js';
import type { HxClickDetail } from '../../lib/helix.directives.js';

const VARIANTS = ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

@Component({
  selector: 'app-button-demo',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [HxButtonDirective],
  template: `
    <section style="margin-bottom: 2rem">
      <h2>Button Demo</h2>

      <h3>Variants</h3>
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
        @for (v of variants; track v) {
          <hx-button [variant]="v">{{ v }}</hx-button>
        }
      </div>

      <h3>Sizes</h3>
      <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap">
        @for (s of sizes; track s) {
          <hx-button [size]="s" variant="primary">{{ s }}</hx-button>
        }
      </div>

      <h3>Event handling</h3>
      <div style="display: flex; gap: 0.5rem; align-items: center">
        <hx-button variant="primary" (hxClick)="clickCount.update(n => n + 1)">
          Click me
        </hx-button>
        <span>
          Clicked <strong>{{ clickCount() }}</strong> time{{ clickCount() !== 1 ? 's' : '' }}
        </span>
      </div>

      <h3>Loading state</h3>
      <hx-button variant="secondary" [loading]="loading()" (hxClick)="handleLoadingClick($event)">
        {{ loading() ? 'Processing...' : 'Simulate async action' }}
      </hx-button>

      <h3>Disabled</h3>
      <hx-button variant="primary" disabled>Disabled button</hx-button>

      <h3>Full width</h3>
      <hx-button variant="outline" full>Full-width button</hx-button>
    </section>
  `,
})
export class ButtonDemoComponent {
  variants = VARIANTS;
  sizes = SIZES;
  clickCount = signal(0);
  loading = signal(false);

  handleLoadingClick(_detail: HxClickDetail): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 2000);
  }
}
