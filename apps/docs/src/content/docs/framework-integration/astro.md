---
title: 'Astro 5 Integration'
description: 'Using HELIX web components in Astro 5, including Islands architecture, static rendering, SSR, and Starlight integration.'
sidebar:
  order: 5
---

# Astro 5 Integration

Astro 5 is an excellent host for HELIX web components. Because custom elements are pure browser APIs, they slot naturally into Astro's Islands architecture — zero framework overhead, full progressively-enhanced interactivity.

> **Meta note:** The HELiX documentation site itself is built with Astro Starlight. Every pattern on this page is used in production here.

## Installation

```bash
npm install @helixui/library
```

## Importing Components

### Option 1 — Import in a layout or page (recommended)

Import HELIX in a client-side `<script>` tag inside any `.astro` file. Astro bundles and deduplicates scripts automatically:

```astro
---
// src/layouts/BaseLayout.astro
---
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My Site</title>
  </head>
  <body>
    <slot />
    <script>
      import '@helixui/library';
    </script>
  </body>
</html>
```

### Option 2 — Import individual components

For smaller bundles, import only the components you need:

```astro
<script>
  import '@helixui/library/components/hx-button';
  import '@helixui/library/components/hx-text-input';
</script>
```

## Basic Usage — Static HTML (No Hydration)

HELIX components work as plain HTML with no JavaScript framework required. Add them directly to `.astro` template markup:

```astro
---
// src/pages/contact.astro
---
<BaseLayout>
  <hx-button variant="primary">Contact Us</hx-button>
  <hx-text-input name="email" type="email" placeholder="you@example.com" />
</BaseLayout>

<script>
  import '@helixui/library';
</script>
```

The components upgrade in the browser as the script loads. During SSR, Astro renders them as unknown HTML elements — this is expected behavior for custom elements and causes no visible flash when HELIX is loaded in `<head>` or early in `<body>`.

## Astro Islands Pattern

Use Astro Islands when you need reactive behavior around HELIX components. The Island provides the JavaScript framework; HELIX handles the UI.

### `client:load` — Hydrate immediately

```astro
---
// src/components/SaveButton.astro
---
<hx-button variant="primary" id="save-btn">Save</hx-button>

<script>
  import '@helixui/library/components/hx-button';

  const btn = document.getElementById('save-btn');
  btn?.addEventListener('hx-click', () => {
    console.log('saved!');
  });
</script>
```

For framework Islands (React, Svelte, Vue) wrapping HELIX components, apply `client:load` on the Island component — not on the `hx-*` element itself:

```astro
---
import SaveForm from './SaveForm.jsx';
---
<SaveForm client:load />
```

### `client:idle` — Hydrate when browser is idle

Best for non-critical interactive components below the fold:

```astro
---
import Notifications from './Notifications.jsx';
---
<Notifications client:idle />
```

### `client:visible` — Hydrate when element enters viewport

Best for components deep in long pages:

```astro
---
import DataTable from './DataTable.jsx';
---
<DataTable client:visible />
```

## Event Handling in Astro Scripts

Astro's `<script>` tags run in the browser with full DOM access. Attach event listeners directly:

```astro
---
// src/pages/search.astro
---
<div>
  <hx-text-input id="search-input" name="q" placeholder="Search..." />
  <hx-button id="search-btn" variant="primary">Search</hx-button>
  <p id="result"></p>
</div>

<script>
  import '@helixui/library';

  const input = document.getElementById('search-input') as HTMLElement & { value: string };
  const btn = document.getElementById('search-btn');
  const result = document.getElementById('result');

  btn?.addEventListener('hx-click', () => {
    if (result) result.textContent = `Searching for: ${input.value}`;
  });

  input?.addEventListener('hx-input', (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    console.log('input:', value);
  });
</script>
```

## Hybrid Rendering with SSR

When using Astro's SSR adapter (`output: 'server'` or `output: 'hybrid'`), custom element registration must happen client-side only. The patterns above already handle this — `<script>` tags in `.astro` files are always client-side.

For server-rendered pages that need dynamic data driving HELIX component props:

```astro
---
// src/pages/profile/[id].astro
import { getUser } from '../lib/api';

export const prerender = false; // SSR page

const { id } = Astro.params;
const user = await getUser(id);
---
<BaseLayout>
  <hx-text-input name="name" value={user.name} />
  <hx-text-input name="email" type="email" value={user.email} />
  <hx-button type="submit" variant="primary">Update Profile</hx-button>
</BaseLayout>

<script>
  import '@helixui/library';
</script>
```

Astro serializes the server-fetched `value` props as HTML attributes. HELIX reads them on upgrade.

## Form Handling in Astro

HELIX form components participate in native HTML forms via `ElementInternals`. Works with Astro form actions in Astro 5:

### With Astro Actions (Astro 5)

```astro
---
// src/pages/contact.astro
import { actions } from 'astro:actions';
---
<form method="POST" action={actions.contact}>
  <hx-text-input name="name" required label="Name" />
  <hx-text-input name="email" type="email" required label="Email" />
  <hx-textarea name="message" required label="Message" />
  <hx-button type="submit" variant="primary">Send Message</hx-button>
</form>

<script>
  import '@helixui/library';
</script>
```

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  contact: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string(),
      email: z.string().email(),
      message: z.string(),
    }),
    handler: async ({ name, email, message }) => {
      // handle form data
      return { success: true };
    },
  }),
};
```

### With Standard Form Submission

```astro
---
// src/pages/search.astro
const query = Astro.url.searchParams.get('q') ?? '';
---
<form method="GET">
  <hx-text-input name="q" value={query} placeholder="Search..." />
  <hx-button type="submit">Search</hx-button>
</form>

<script>
  import '@helixui/library';
</script>
```

## TypeScript Support

Astro uses TypeScript by default. Add type declarations for HELIX elements to get IDE autocompletion in `.astro` files:

```ts
// src/env.d.ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface HTMLElementTagNameMap {
    'hx-button': HTMLElement & {
      variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
      size?: 'sm' | 'md' | 'lg';
      disabled?: boolean;
      loading?: boolean;
      type?: 'button' | 'submit' | 'reset';
    };
    'hx-text-input': HTMLElement & {
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      required?: boolean;
      name?: string;
      type?: string;
      label?: string;
    };
    'hx-textarea': HTMLElement & {
      value?: string;
      placeholder?: string;
      disabled?: boolean;
      required?: boolean;
      name?: string;
      label?: string;
    };
  }
}

export {};
```

## Design Token Usage

Apply HELIX design tokens via global CSS in your Astro layout:

```astro
---
// src/layouts/BaseLayout.astro
---
<html lang="en">
  <head>
    <style is:global>
      :root {
        /* Override semantic tokens for brand theming */
        --hx-color-primary: #1a56db;
        --hx-color-secondary: #6b7280;
        --hx-spacing-md: 1.25rem;
        --hx-radius-md: 0.5rem;
      }
    </style>
  </head>
  <body>
    <slot />
    <script>
      import '@helixui/library';
    </script>
  </body>
</html>
```

Per-component token overrides work via inline styles or a scoped `<style>` block:

```astro
<hx-button style="--hx-button-bg: navy; --hx-button-radius: 0;">
  Custom Styled
</hx-button>
```

## Starlight Integration

When building documentation sites with Astro Starlight (like this one), you can use HELIX components in MDX files and custom Starlight components.

### In MDX Pages

Enable MDX in `astro.config.mjs`:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mdx from '@astrojs/mdx';

export default defineConfig({
  integrations: [starlight({ /* ... */ }), mdx()],
});
```

Then use HELIX components in `.mdx` docs:

```mdx
---
title: My Guide
---

import '@helixui/library';

<hx-alert variant="info">
  This is an informational callout in your docs.
</hx-alert>

Regular markdown content continues here.
```

### In Custom Starlight Components

Override Starlight's built-in components to embed HELIX UI:

```astro
---
// src/components/Header.astro
// Overrides Starlight's default Header component
---
<header>
  <div class="header-inner">
    <slot name="site-title" />
    <hx-button variant="ghost" size="sm" id="theme-toggle">
      Toggle Theme
    </hx-button>
  </div>
</header>

<script>
  import '@helixui/library/components/hx-button';
  // event handling...
</script>
```

Register custom components in `astro.config.mjs`:

```js
starlight({
  components: {
    Header: './src/components/Header.astro',
  },
}),
```

## Common Pitfalls

**Components not upgrading.** If HELIX elements render as plain HTML with no styling, the script hasn't loaded. Verify `import '@helixui/library'` is inside a `<script>` tag (not a frontmatter `import`). Frontmatter imports run on the server; custom element registration is browser-only.

**`value` prop not reflected.** In Astro, component props become HTML attributes. HELIX reads initial values from attributes on upgrade, so this works. However, after upgrade, set `element.value` as a DOM property (not attribute) for dynamic updates from client-side scripts.

**TypeScript errors on `hx-*` elements.** Add the `HTMLElementTagNameMap` declarations shown above to `src/env.d.ts`. Astro's TypeScript config includes this file automatically.

**SSR mismatch warnings.** Astro may warn about unknown custom elements during SSR. This is cosmetic — components hydrate correctly in the browser. Suppress the warning by wrapping HELIX elements in a `<div>` with `set:html` if needed, or configure Astro's `compilerOptions` to recognize `hx-*` elements.

## Next Steps

- [Svelte Integration](/framework-integration/svelte)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Component Library](/component-library/overview)
