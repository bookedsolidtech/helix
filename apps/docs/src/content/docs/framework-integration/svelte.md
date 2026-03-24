---
title: 'Svelte Integration'
description: 'Using HELIX web components in Svelte 5 and SvelteKit, including custom element configuration, event binding, two-way binding, and SSR.'
sidebar:
  order: 6
---

# Svelte Integration

Svelte 5 and SvelteKit work well with HELIX web components. Custom elements require one compiler option to distinguish them from Svelte components, and HELIX's `hx-` event prefix binds naturally with Svelte's event directive syntax.

## Installation

```bash
npm install @helixui/library
```

## Configuration

Tell Svelte's compiler to treat `hx-*` elements as custom elements rather than unknown Svelte components. Without this, Svelte warns about unknown tags.

### Vite / SvelteKit (`svelte.config.js`)

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
  compilerOptions: {
    // Treat any element starting with hx- as a custom element
    customElement: false, // keep false — this configures Svelte components as CEs
  },
  vite: {
    plugins: [],
  },
};

export default config;
```

To suppress unknown-element warnings, add the `hx-` prefix to Svelte's known elements list via the `vite-plugin-svelte` compiler option:

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
};

export default config;
```

```js
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        // Silence "unknown element" warnings for hx-* custom elements
        customElement: false,
      },
    }),
  ],
});
```

For targeted warning suppression without compiler flags, add a `<!-- svelte-ignore unknown-prop -->` comment on specific elements or configure the warning in your linter.

## Importing Components

Import HELIX once at the top of your root layout. In SvelteKit, use the `+layout.svelte` file:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import '@helixui/library';
  let { children } = $props();
</script>

<slot />
{@render children?.()}
```

Or import individual components to reduce bundle size:

```svelte
<script>
  import '@helixui/library/components/hx-button';
  import '@helixui/library/components/hx-text-input';
</script>
```

## Basic Usage

```svelte
<script>
  import '@helixui/library';
</script>

<hx-button variant="primary">Save Changes</hx-button>
<hx-text-input name="email" type="email" placeholder="you@example.com" />
```

## Event Binding

Svelte 5 uses `on:event-name` (Svelte 4) or the `onevent` property pattern with the new runes syntax. HELIX dispatches `hx-` prefixed custom events.

### Svelte 5 (Runes)

In Svelte 5, use `on:hx-eventname` in templates. The hyphenated event names work as-is:

```svelte
<script>
  import '@helixui/library';

  function handleSave() {
    console.log('saved!');
  }

  function handleInput(e) {
    const value = e.target.value;
    console.log('input:', value);
  }
</script>

<hx-button variant="primary" on:hx-click={handleSave}>Save</hx-button>
<hx-text-input name="search" on:hx-input={handleInput} />
```

### Svelte 4

The same `on:hx-*` syntax works in Svelte 4:

```svelte
<script>
  import '@helixui/library';

  function handleClick(event) {
    console.log('hx-click fired', event);
  }
</script>

<hx-button variant="primary" on:hx-click={handleClick}>
  Click Me
</hx-button>
```

### Multiple Events

```svelte
<hx-text-input
  name="email"
  type="email"
  on:hx-input={onInput}
  on:hx-change={onChange}
  on:hx-focus={onFocus}
  on:hx-blur={onBlur}
/>
```

## Two-Way Binding Patterns

Svelte's `bind:value` is not directly compatible with HELIX custom elements (it expects native `<input>` elements). Use reactive state with event handlers instead.

### Manual Binding (Svelte 5 Runes)

```svelte
<script>
  import '@helixui/library';

  let email = $state('');
</script>

<hx-text-input
  name="email"
  value={email}
  on:hx-input={(e) => { email = e.target.value; }}
/>
<p>You typed: {email}</p>
```

### Manual Binding (Svelte 4)

```svelte
<script>
  import '@helixui/library';

  let email = '';
</script>

<hx-text-input
  name="email"
  value={email}
  on:hx-input={(e) => { email = e.target.value; }}
/>
<p>You typed: {email}</p>
```

### Reusable Binding Action

For frequent two-way binding, a Svelte action provides a clean abstraction:

```ts
// src/lib/actions/hxBind.ts
import type { Action } from 'svelte/action';

export const hxBind: Action<HTMLElement, { value: string; onChange: (v: string) => void }> = (
  node,
  { value, onChange },
) => {
  // Set initial value
  (node as HTMLInputElement).value = value;

  function handleInput(e: Event) {
    onChange((e.target as HTMLInputElement).value);
  }

  node.addEventListener('hx-input', handleInput);

  return {
    update({ value: newValue }) {
      (node as HTMLInputElement).value = newValue;
    },
    destroy() {
      node.removeEventListener('hx-input', handleInput);
    },
  };
};
```

```svelte
<script>
  import '@helixui/library';
  import { hxBind } from '$lib/actions/hxBind';

  let email = $state('');
</script>

<hx-text-input
  name="email"
  use:hxBind={{ value: email, onChange: (v) => (email = v) }}
/>
```

## Boolean Attributes

Svelte correctly handles boolean attributes — when a prop evaluates to `false`, the attribute is omitted, matching HELIX's [boolean attribute semantics](/guides/boolean-attributes):

```svelte
<script>
  let isDisabled = $state(false);
</script>

<!-- Correct: attribute present when true, absent when false -->
<hx-button disabled={isDisabled}>Submit</hx-button>
```

Avoid passing string `"false"`:

```svelte
<!-- Wrong: disabled="false" still disables the button -->
<hx-button disabled="false">Submit</hx-button>
```

## Form Integration

HELIX form components participate in native HTML forms via `ElementInternals`. Wrap them in a `<form>` and read submitted values with `FormData`:

```svelte
<script>
  import '@helixui/library';

  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log({
      username: data.get('username'),
      role: data.get('role'),
    });
  }
</script>

<form on:submit={handleSubmit}>
  <hx-text-input name="username" required />
  <hx-select name="role">
    <option value="admin">Admin</option>
    <option value="viewer">Viewer</option>
  </hx-select>
  <hx-button type="submit" variant="primary">Create User</hx-button>
</form>
```

### SvelteKit Form Actions

HELIX works with SvelteKit's progressive enhancement form actions:

```svelte
<!-- src/routes/contact/+page.svelte -->
<script>
  import '@helixui/library';
  import { enhance } from '$app/forms';

  let { form } = $props();
</script>

<form method="POST" use:enhance>
  <hx-text-input name="name" required label="Name" />
  <hx-text-input name="email" type="email" required label="Email" />
  <hx-textarea name="message" required label="Message" />
  <hx-button type="submit" variant="primary">Send</hx-button>
</form>

{#if form?.success}
  <hx-alert variant="success">Message sent!</hx-alert>
{/if}
```

```ts
// src/routes/contact/+page.server.ts
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name');
    const email = data.get('email');
    const message = data.get('message');

    // handle form submission
    return { success: true };
  },
};
```

## TypeScript Support

Extend Svelte's known HTML elements for full IDE autocomplete. Add to `src/app.d.ts`:

```ts
// src/app.d.ts
declare global {
  namespace App {
    // Svelte app namespace — add your app types here
  }

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
    'hx-select': HTMLElement & {
      value?: string;
      disabled?: boolean;
      required?: boolean;
      name?: string;
    };
  }
}

export {};
```

## SSR / SvelteKit Considerations

Custom element registration (`customElements.define`) is browser-only. In SvelteKit with SSR enabled, guard HELIX imports so they only run in the browser:

### Pattern 1 — `onMount` guard (component-level)

```svelte
<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    await import('@helixui/library');
  });
</script>

<hx-button variant="primary">Save</hx-button>
```

### Pattern 2 — `browser` check (layout-level)

For app-wide registration in `+layout.svelte`:

```svelte
<script>
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let { children } = $props();

  onMount(async () => {
    if (browser) {
      await import('@helixui/library');
    }
  });
</script>

{@render children?.()}
```

### Pattern 3 — Static prerendering

If your SvelteKit app is fully prerendered (`prerender = true`), you can import HELIX directly without guards — the output is static HTML and scripts run only in the browser:

```svelte
<script>
  // Safe when prerender = true: output is static HTML + browser scripts
  import '@helixui/library';
</script>
```

During SSR, SvelteKit renders HELIX elements as inert HTML tags. They upgrade in the browser after the script loads. No visible flash occurs when HELIX is loaded in `<head>` or early `<body>`.

## Common Pitfalls

**`hx-` event warnings.** Svelte may warn about unknown event names on custom elements in strict configurations. Use `<!-- svelte-ignore unknown-attribute -->` on specific lines, or configure your Svelte config to suppress unknown-element warnings for `hx-*` tags.

**`bind:value` silently fails.** Svelte's `bind:value` only works on native form elements. Use the manual binding pattern or the `hxBind` action described above.

**Properties vs. attributes.** Svelte passes non-string values as DOM properties when the binding is dynamic (`{someValue}`). HELIX properties accept both attribute strings and DOM properties — this works correctly for strings and booleans. For complex objects or arrays, set them as DOM properties via `bind:this` and direct assignment.

**SSR markup mismatch.** If SvelteKit SSR renders HELIX elements and the client hydrates with different prop values, a hydration mismatch warning appears. This is harmless for custom elements — they ignore SSR markup and re-render from scratch. To eliminate the warning, use the `onMount` pattern to render HELIX only on the client.

## Next Steps

- [Plain HTML / CDN Integration](/framework-integration/html)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Component Library](/component-library/overview)
