import { useState } from 'react';
import { HxTheme } from '@helixui/react';
import { ThemeSwitcher } from './demos/ThemeSwitcher.js';
import { ButtonDemo } from './demos/ButtonDemo.js';
import { FormDemo } from './demos/FormDemo.js';
import { CardDemo } from './demos/CardDemo.js';

type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

export function App() {
  const [theme, setTheme] = useState<ThemeName>('light');

  return (
    <HxTheme theme={theme}>
      <div style={{ padding: '2rem', maxWidth: '960px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1>HELiX React Starter Kit</h1>
          <p>
            Demonstrates how to use HELiX web components in React via <code>@helixui/react</code>{' '}
            wrappers built with <code>@lit/react</code>.
          </p>
        </header>

        <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />

        <main>
          <ButtonDemo />
          <FormDemo />
          <CardDemo />
        </main>
      </div>
    </HxTheme>
  );
}
