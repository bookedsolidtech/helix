import { HxButton, HxButtonGroup } from '@helixui/react';

type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

interface ThemeSwitcherProps {
  currentTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
}

const themes: readonly ThemeName[] = ['light', 'dark', 'high-contrast', 'auto'] as const;

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2>Theme Switcher</h2>
      <p>
        Toggle between themes. The <code>&lt;HxTheme&gt;</code> provider wraps the entire app and
        injects <code>--hx-*</code> design tokens for the selected theme.
      </p>
      <HxButtonGroup>
        {themes.map((name) => (
          <HxButton
            key={name}
            variant={currentTheme === name ? 'primary' : 'outline'}
            size="sm"
            onHxClick={() => onThemeChange(name)}
          >
            {name}
          </HxButton>
        ))}
      </HxButtonGroup>
    </section>
  );
}
