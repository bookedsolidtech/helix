---
title: 'Next.js 15 App Router Integration'
description: 'Using HELIX web components in Next.js 15 App Router, including SSR-safe patterns, use client boundaries, React Server Actions, hydration, and performance.'
sidebar:
  order: 3
---

# Next.js 15 App Router Integration

Next.js 15 App Router introduces unique challenges for web components: Server Components render on the server where custom element APIs don't exist, and Lit's browser-only lifecycle requires careful boundary placement. This guide covers every pattern you need to integrate HELiX reliably.

## Installation

```bash
npm install @helixui/library
```

If you want React wrapper components with full prop typing (optional), also install `@lit/react`:

```bash
npm install @lit/react
```

## The `'use client'` Boundary

Custom element registration (`customElements.define`) is a browser-only API. Any module that imports HELiX components must be a Client Component.

### What requires `'use client'`

- Any file that imports `@helixui/library` or individual components
- Any component that listens to HELiX custom events (`hx-click`, `hx-change`, etc.)
- Any component that holds a `ref` to a HELiX element

### What does NOT require `'use client'`

- Server Components that only render HELiX tag names as JSX — the HTML is valid, the element upgrades on the client
- Layout files that only pass children through

### Pattern: Client Boundary at the Loader

Register all components once in a dedicated Client Component at the root:

```tsx
// components/helix-loader.tsx
'use client';

import { useEffect } from 'react';

export function HelixLoader() {
  useEffect(() => {
    // Dynamically import so the registration only runs in the browser
    import('@helixui/library');
  }, []);

  return null;
}
```

```tsx
// app/layout.tsx  (Server Component — no 'use client' needed here)
import { HelixLoader } from '@/components/helix-loader';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HelixLoader />
        {children}
      </body>
    </html>
  );
}
```

With this pattern, Server Components can render HELiX tag names freely. The custom element upgrades after hydration without warnings.

### Pattern: Client Boundary per Interactive Component

For interactive components that need event handlers, create a thin Client Component wrapper:

```tsx
// components/save-button.tsx
'use client';

import { useRef, useEffect } from 'react';
import '@helixui/library/components/hx-button';

interface SaveButtonProps {
  onSave: () => void;
  label?: string;
}

export function SaveButton({ onSave, label = 'Save' }: SaveButtonProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('hx-click', onSave);
    return () => el.removeEventListener('hx-click', onSave);
  }, [onSave]);

  return <hx-button ref={ref} variant="primary">{label}</hx-button>;
}
```

The parent Server Component passes data down; the Client Component handles browser events:

```tsx
// app/dashboard/page.tsx  (Server Component)
import { SaveButton } from '@/components/save-button';

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      <SaveButton label="Save changes" onSave={async () => { 'use server'; /* ... */ }} />
    </main>
  );
}
```

## SSR-Safe Patterns with `next/dynamic`

Use `next/dynamic` with `ssr: false` when a component imports HELiX at module scope (outside `useEffect`) or relies on `window`/`document` during render:

```tsx
// app/some-page/page.tsx
import dynamic from 'next/dynamic';

const HeavyHelixForm = dynamic(
  () => import('@/components/helix-form').then((m) => m.HelixForm),
  {
    ssr: false,
    loading: () => <div aria-busy="true">Loading form…</div>,
  }
);

export default function SomePage() {
  return (
    <main>
      <HeavyHelixForm />
    </main>
  );
}
```

When to use `ssr: false` vs the `HelixLoader` pattern:

| Approach | When to use |
|----------|-------------|
| `HelixLoader` + `useEffect` import | Global registration, components used across many pages |
| `next/dynamic` with `ssr: false` | Heavy page-specific components, progressive enhancement |
| Direct module import with `'use client'` | Simple interactive islands with tight coupling |

## TypeScript Configuration

### `tsconfig.json` adjustments

HELiX ships types for every component. Add the library to your `types` or rely on automatic discovery via `node_modules/@helixui/library/`:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The key entries:

- `"lib": ["ES2022", "DOM", "DOM.Iterable"]` — required for `CustomElementRegistry`, `ElementInternals`, and other browser APIs used by HELiX
- `"strict": true` — required; HELiX types are authored under strict mode

### JSX type declarations

Create `src/helix.d.ts` so TypeScript recognizes HELiX elements in JSX:

```ts
// src/helix.d.ts
import type { HxButton, HxTextInput, HxCard } from '@helixui/library';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hx-button': React.DetailedHTMLProps<React.HTMLAttributes<HxButton>, HxButton> & {
        variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
        loading?: boolean;
        type?: 'button' | 'submit' | 'reset';
      };
      'hx-text-input': React.DetailedHTMLProps<
        React.HTMLAttributes<HxTextInput>,
        HxTextInput
      > & {
        value?: string;
        placeholder?: string;
        label?: string;
        disabled?: boolean;
        required?: boolean;
        name?: string;
        type?: string;
        'error-message'?: string;
      };
      'hx-card': React.DetailedHTMLProps<React.HTMLAttributes<HxCard>, HxCard> & {
        elevated?: boolean;
      };
      // Add additional components as needed
    }
  }
}
```

### Using `@lit/react` wrappers for full typing (optional)

`@lit/react` generates React wrapper components with full prop types and event forwarding. This eliminates the need for `ref`-based event listeners:

```tsx
// lib/helix-react.ts
'use client';

import { createComponent } from '@lit/react';
import React from 'react';
import { HxButton } from '@helixui/library';

export const HxButtonReact = createComponent({
  tagName: 'hx-button',
  elementClass: HxButton,
  react: React,
  events: {
    onHxClick: 'hx-click',
    onHxFocus: 'hx-focus',
    onHxBlur: 'hx-blur',
  },
});
```

Usage in a Client Component:

```tsx
'use client';

import { HxButtonReact } from '@/lib/helix-react';

export function ActionBar() {
  return (
    <HxButtonReact variant="primary" onHxClick={() => console.log('clicked')}>
      Confirm
    </HxButtonReact>
  );
}
```

## Form Handling with React Server Actions

HELiX form components use the `ElementInternals` API for native form participation — they work with standard HTML forms and therefore with React Server Actions.

### Basic Server Action form

```tsx
// app/contact/page.tsx
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-button';
import { submitContact } from './actions';

export default function ContactPage() {
  return (
    <form action={submitContact}>
      <hx-text-input name="name" label="Full name" required />
      <hx-text-input name="email" type="email" label="Email" required />
      <hx-button type="submit" variant="primary">Send</hx-button>
    </form>
  );
}
```

```ts
// app/contact/actions.ts
'use server';

export async function submitContact(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  // process...
}
```

Because HELiX form components participate natively in the form, `FormData` receives their values automatically — no manual wiring needed.

### Optimistic UI with `useActionState`

For client-side feedback during submission, combine a Server Action with `useActionState`:

```tsx
// components/contact-form.tsx
'use client';

import { useActionState } from 'react';
import { submitContact } from '@/app/contact/actions';
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-button';

interface FormState {
  error?: string;
  success?: boolean;
}

const initialState: FormState = {};

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContact, initialState);

  return (
    <form action={formAction}>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">Message sent!</p>}

      <hx-text-input name="name" label="Full name" required />
      <hx-text-input name="email" type="email" label="Email" required />
      <hx-button type="submit" variant="primary" loading={isPending ? true : undefined}>
        {isPending ? 'Sending…' : 'Send'}
      </hx-button>
    </form>
  );
}
```

```ts
// app/contact/actions.ts
'use server';

interface FormState {
  error?: string;
  success?: boolean;
}

export async function submitContact(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    if (!name || !email) return { error: 'All fields are required.' };
    // submit...
    return { success: true };
  } catch {
    return { error: 'Submission failed. Please try again.' };
  }
}
```

## Avoiding Hydration Mismatch Warnings

Lit components register in the browser via `customElements.define`. On the server, Next.js renders custom element tags as unknown HTML elements. This is correct behavior — no hydration mismatch occurs for the element tag itself.

### What DOES cause mismatches

1. **Attributes that differ between server and client render**

   ```tsx
   // Bad — Date.now() produces a different value server vs client
   <hx-card data-timestamp={Date.now()}>...</hx-card>

   // Good — derive stable values server-side
   <hx-card data-id={item.id}>...</hx-card>
   ```

2. **Conditional rendering based on browser APIs**

   ```tsx
   // Bad — window is undefined on the server
   <hx-button disabled={typeof window === 'undefined'}>...</hx-button>

   // Good — use useEffect to apply browser-dependent state after hydration
   'use client';
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   return <hx-button disabled={!mounted ? true : undefined}>...</hx-button>;
   ```

3. **Dynamic class names generated client-side**

   Ensure any className applied to a wrapper element around HELiX components is deterministic on both server and client.

### Suppressing false-positive warnings

If you use a third-party component that wraps HELiX elements and produces unavoidable mismatch warnings, suppress only the specific element:

```tsx
'use client';

export function ClientOnlyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}
```

Use sparingly — prefer fixing the root cause.

## Performance: Lazy-Loading per Route

### Per-route component loading

Only load the HELiX components a route actually needs. Use per-component imports instead of the full library barrel:

```tsx
// app/forms/page.tsx
import dynamic from 'next/dynamic';

// Only loads hx-text-input and hx-button bundles for this route
const FormPage = dynamic(() => import('@/components/contact-form'), {
  ssr: false,
  loading: () => <div>Loading…</div>,
});

export default function FormsRoute() {
  return <FormPage />;
}
```

Inside `contact-form.tsx`, import only what you need:

```tsx
'use client';

// Tree-shakeable per-component imports (~3–5 KB each, min+gz)
import '@helixui/library/components/hx-text-input';
import '@helixui/library/components/hx-button';
```

Avoid importing the full library on every page:

```tsx
// Avoid unless you use most components on every route
import '@helixui/library'; // ~50 KB total
```

### Bundling with Next.js `transpilePackages`

If you encounter bundling issues with `@helixui/library` (ESM interop warnings), add it to `transpilePackages` in `next.config.ts`:

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@helixui/library'],
};

export default nextConfig;
```

### Preloading critical components

For above-the-fold HELiX components, preload the script in your layout:

```tsx
// app/layout.tsx
import { HelixLoader } from '@/components/helix-loader';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload the HELiX bundle for above-the-fold components */}
        <link rel="modulepreload" href="/_next/static/chunks/helix-library.js" />
      </head>
      <body>
        <HelixLoader />
        {children}
      </body>
    </html>
  );
}
```

## Common Pitfalls and Solutions

### Pitfall: `ReferenceError: customElements is not defined`

**Cause:** A module importing `@helixui/library` executed on the server (outside a Client Component or `useEffect`).

**Solution:** Ensure the import is inside `useEffect` or mark the file as `'use client'`:

```tsx
// Bad — runs during server render
import '@helixui/library'; // top-level import in a Server Component

// Good — deferred to browser
'use client';
useEffect(() => { import('@helixui/library'); }, []);
```

### Pitfall: Event handlers silently not firing

**Cause:** HELiX uses custom events (`hx-click`, `hx-change`) that React's synthetic event system does not forward.

**Solution:** Use a `ref` and `addEventListener`, or `@lit/react` wrappers:

```tsx
'use client';

const ref = useRef<HTMLElement>(null);
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const handler = (e: Event) => { /* ... */ };
  el.addEventListener('hx-click', handler);
  return () => el.removeEventListener('hx-click', handler);
}, []);

return <hx-button ref={ref}>Click me</hx-button>;
```

### Pitfall: Form values missing from `FormData`

**Cause:** HELiX form components require `name` attribute to participate in form data.

**Solution:** Always provide the `name` attribute:

```tsx
// Bad — value not included in FormData
<hx-text-input label="Email" type="email" />

// Good
<hx-text-input name="email" label="Email" type="email" required />
```

### Pitfall: `disabled="false"` still disables the component

**Cause:** HTML boolean attributes treat any string value (including `"false"`) as truthy. React does NOT omit the attribute when you pass `disabled="false"` as a string.

**Solution:** Use the boolean prop correctly — React omits it when `false`:

```tsx
// Bad — disabled="false" is still truthy in HTML
<hx-button disabled="false">Submit</hx-button>

// Good — React omits the attribute when the value is false
<hx-button disabled={isDisabled}>Submit</hx-button>
```

### Pitfall: TypeScript error on HELiX element props

**Cause:** JSX doesn't know about custom element props without type declarations.

**Solution:** Add declarations to `src/helix.d.ts` as shown in the [TypeScript section](#typescript-configuration).

### Pitfall: `next/dynamic` import resolves to `undefined`

**Cause:** The dynamic import path doesn't match an exported member.

**Solution:** Use the `.then((m) => m.ComponentName)` pattern to select the named export:

```tsx
// Bad — no named export selected
const MyForm = dynamic(() => import('@/components/helix-form'));

// Good
const MyForm = dynamic(
  () => import('@/components/helix-form').then((m) => m.HelixForm)
);
```

## Next Steps

- [React Integration](/framework-integration/react) — general React 18+ patterns
- [Design Tokens](/design-tokens/overview) — theming HELiX in your Next.js app
- [Component Library](/component-library/overview) — browse available components
- [Accessibility Guide](/components/accessibility/aria) — WCAG 2.1 AA in Next.js
