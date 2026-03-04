# @helixds/tailwind-preset

Tailwind CSS v3 preset that maps Helix Design System tokens to utility classes
via CSS custom property references. All token values resolve at runtime, giving
consumers full theming support by overriding `--hx-*` CSS variables.

## Installation

```bash
npm install @helixds/tailwind-preset tailwindcss
```

The Helix token CSS must also be loaded so the `--hx-*` custom properties are
defined. Import it once at the root of your application:

```ts
// main.ts / app entry point
import '@helix/tokens/tokens.css';
```

Or in CSS:

```css
@import '@helix/tokens/tokens.css';
```

## Usage

Add the preset to your `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';
import helixPreset from '@helixds/tailwind-preset';

const config: Config = {
  presets: [helixPreset],
  content: [
    './src/**/*.{html,ts,tsx,vue,svelte}',
  ],
};

export default config;
```

That is all that is required. Every Helix token is now available as a Tailwind
utility class.

## Dark mode

Dark mode is activated by adding `data-theme="dark"` to any ancestor element.
The standard approach is to put it on `<html>`:

```html
<!-- light (default) -->
<html>...</html>

<!-- dark -->
<html data-theme="dark">...</html>
```

Toggle it in JavaScript:

```ts
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.removeAttribute('data-theme'); // back to light
```

Tailwind's `dark:` variant then works as expected:

```html
<div class="bg-hx-surface-default dark:text-hx-text-primary">
  Content
</div>
```

The Helix CSS variable layer handles the actual value swap automatically.
No Tailwind-specific dark mode configuration beyond what the preset provides
is needed.

## Token mapping reference

### Colors

Color scales map `--hx-color-<name>-<step>` to `<name>-<step>` utilities.

| Token prefix        | Tailwind class prefix  | Steps              |
|---------------------|------------------------|--------------------|
| `--hx-color-primary`   | `primary`           | 50-950             |
| `--hx-color-secondary` | `secondary`         | 50-950             |
| `--hx-color-accent`    | `accent`            | 50-950             |
| `--hx-color-neutral`   | `neutral`           | 0, 50-950          |
| `--hx-color-success`   | `success`           | 50-950             |
| `--hx-color-warning`   | `warning`           | 50-950             |
| `--hx-color-error`     | `error`             | 50-950             |
| `--hx-color-info`      | `info`              | 50-950             |

Semantic color aliases are also available:

```html
<p class="text-hx-text-primary">Primary text</p>
<div class="bg-hx-surface-raised">Raised surface</div>
<div class="border border-hx-border-default">Default border</div>
```

### Spacing

Maps `--hx-space-<step>` to Tailwind spacing utilities (`p-`, `m-`, `gap-`, etc.):

```html
<div class="p-4 gap-8 mt-12">...</div>
```

Available steps: `0`, `px`, `1`-`8`, `10`, `12`, `14`, `16`, `20`, `24`, `32`,
`40`, `48`, `64`.

### Typography

```html
<!-- Font family -->
<p class="font-sans">Sans-serif body text</p>
<p class="font-mono">Monospace code</p>

<!-- Font size -->
<p class="text-sm">Small</p>
<p class="text-md">Medium (base)</p>
<h2 class="text-2xl">Heading level 2</h2>

<!-- Font weight -->
<p class="font-semibold">Semibold</p>
<p class="font-bold">Bold</p>

<!-- Line height -->
<p class="leading-normal">Normal line height</p>
<p class="leading-tight">Tight line height</p>
```

Available font sizes: `2xs`, `xs`, `sm`, `md` (alias `base`), `lg`, `xl`,
`2xl`, `3xl`, `4xl`, `5xl`.

### Shadows

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-md">Medium shadow (default)</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-inner">Inner shadow</div>
```

### Border radius

```html
<button class="rounded-md">Default button radius</button>
<div class="rounded-xl">Extra-large radius</div>
<div class="rounded-full">Pill / circle</div>
```

### Z-index

```html
<div class="z-modal">Modal layer</div>
<div class="z-tooltip">Tooltip layer</div>
```

Available: `base`, `dropdown`, `sticky`, `fixed`, `backdrop`, `modal`,
`popover`, `tooltip`, `toast`.

## Theming for consumers

Consumers override semantic tokens at the `:root` level. Because all Tailwind
utilities reference CSS variables, the change propagates automatically to every
utility class in the consuming application:

```css
/* Brand override in a Drupal theme or React app */
:root {
  --hx-color-primary-500: #7c3aed; /* purple brand */
  --hx-font-family-sans: 'Fira Sans', sans-serif;
}
```

No rebuild of Tailwind output is required — only a CSS variable override.

## Architecture notes

- This preset does not import from `@helix/tokens` at runtime. All CSS variable
  references are hardcoded strings, keeping the preset dependency-free and
  lightweight.
- The preset uses `theme.extend` throughout, so all default Tailwind utilities
  remain available alongside Helix tokens.
- Dark mode values are provided entirely by the `@helix/tokens` CSS layer
  (`[data-theme="dark"]` selector block). The preset only configures Tailwind
  to honour the same selector strategy.
