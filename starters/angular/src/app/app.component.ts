import { Component, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HxButtonDirective } from '../lib/helix.directives.js';
import { HxTextInputDirective } from '../lib/helix.directives.js';
import { ThemeSwitcherComponent } from './demos/theme-switcher.component.js';
import { ButtonDemoComponent } from './demos/button-demo.component.js';
import { FormDemoComponent } from './demos/form-demo.component.js';
import { CardDemoComponent } from './demos/card-demo.component.js';

export type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    HxButtonDirective,
    HxTextInputDirective,
    ThemeSwitcherComponent,
    ButtonDemoComponent,
    FormDemoComponent,
    CardDemoComponent,
  ],
  template: `
    <hx-theme [theme]="theme()">
      <div style="padding: 2rem; max-width: 960px; margin: 0 auto">
        <header style="margin-bottom: 2rem">
          <h1>HELiX Angular Starter Kit</h1>
          <p>
            Demonstrates HELiX web components in Angular 19 with
            <code>CUSTOM_ELEMENTS_SCHEMA</code>, typed <code>@Output()</code>
            directive wrappers, and Analog SSR.
          </p>
        </header>

        <app-theme-switcher [currentTheme]="theme()" (themeChange)="theme.set($event)" />

        <main>
          <app-button-demo />
          <app-form-demo />
          <app-card-demo />
        </main>
      </div>
    </hx-theme>
  `,
})
export class AppComponent {
  theme = signal<ThemeName>('light');
}
