import { Component, input, output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HxButtonDirective } from '../../lib/helix.directives.js';
import type { ThemeName } from '../app.component.js';

const THEMES: readonly ThemeName[] = ['light', 'dark', 'high-contrast', 'auto'];

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [HxButtonDirective],
  template: `
    <section style="margin-bottom: 2rem">
      <h2>Theme Switcher</h2>
      <p>
        Toggle themes. The <code>&lt;hx-theme&gt;</code> element injects <code>--hx-*</code> design
        tokens for the selected theme.
      </p>
      <hx-button-group>
        @for (name of themes; track name) {
          <hx-button
            [variant]="currentTheme() === name ? 'primary' : 'outline'"
            size="sm"
            (hxClick)="themeChange.emit(name)"
          >
            {{ name }}
          </hx-button>
        }
      </hx-button-group>
    </section>
  `,
})
export class ThemeSwitcherComponent {
  currentTheme = input.required<ThemeName>();
  themeChange = output<ThemeName>();
  themes = THEMES;
}
