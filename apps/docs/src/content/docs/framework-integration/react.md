---
title: 'React Integration'
description: 'Using HELIX web components in React 18+ and Next.js, including event binding, refs, TypeScript types, form integration, and SSR.'
sidebar:
  order: 2
---

# React Integration

HELIX components work in React 18+ with a few important patterns to follow. React 19 introduced native custom element support; React 18 requires `ref`-based event binding.

## Installation

```bash
npm install @helixui/library
```

## Importing Components

Import components at the root of your app (or in a client-side module):

```tsx
// app.tsx or a dedicated helix.ts loader
import '@helixui/library/components/hx-button';
import '@helixui/library/components/hx-text-input';
// Or import all components
import '@helixui/library';
```

## Basic Usage

```tsx
export default function MyPage() {
  return (
    <div>
      <hx-button variant="primary">Save</hx-button>
    </div>
  );
}
```

## Event Binding

React's synthetic event system does not forward custom events from web components. Use a `ref` to attach native DOM event listeners.

```tsx
import { useRef, useEffect } from 'react';

export function SaveButton() {
  const buttonRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const handleClick = (e: Event) => {
      console.log('hx-click fired', e);
    };

    el.addEventListener('hx-click', handleClick);
    return () => el.removeEventListener('hx-click', handleClick);
  }, []);

  return <hx-button ref={buttonRef} variant="primary">Save</hx-button>;
}
```

### React 19 Shorthand

React 19 forwards custom events natively using the `on*` prop convention when the event name matches. For HELIX's `hx-` prefixed events, use a ref until official React 19 support is confirmed.

## TypeScript Types

Add JSX type declarations so TypeScript knows about HELIX elements. Create a `helix.d.ts` in your `src/` directory:

```ts
// src/helix.d.ts
import type { HxButton, HxTextInput } from '@helixui/library';

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
      'hx-text-input': React.DetailedHTMLProps<React.HTMLAttributes<HxTextInput>, HxTextInput> & {
        value?: string;
        placeholder?: string;
        disabled?: boolean;
        required?: boolean;
        name?: string;
      };
      // Add additional components as needed
    }
  }
}
```

## Boolean Attributes

React renders boolean props as attributes. Follow HELIX's [boolean attribute semantics](/guides/boolean-attributes):

```tsx
{/* Correct — presence of attribute = true */}
<hx-button disabled>Disabled</hx-button>

{/* Correct — omit attribute = false */}
<hx-button>Enabled</hx-button>

{/* Wrong — disabled="false" still disables the button */}
<hx-button disabled={false}>Not what you think</hx-button>
```

React automatically omits boolean props when they are `false`, so this pattern works correctly:

```tsx
<hx-button disabled={isDisabled}>Submit</hx-button>
```

## Form Integration

HELIX form components use the [ElementInternals API](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) for native form participation. They work with HTML `<form>` elements out of the box — no React state required.

### Uncontrolled Forms

```tsx
function ContactForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    console.log(data.get('email'));
  };

  return (
    <form onSubmit={handleSubmit}>
      <hx-text-input name="email" type="email" required />
      <hx-button type="submit">Send</hx-button>
    </form>
  );
}
```

### Controlled Pattern via Ref

For controlled inputs, use a ref to read and set the `value` property:

```tsx
import { useRef, useEffect, useState } from 'react';

function ControlledInput() {
  const inputRef = useRef<HTMLElement & { value: string }>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const handleChange = (e: Event) => {
      setValue((e.target as HTMLInputElement).value);
    };

    el.addEventListener('hx-change', handleChange);
    return () => el.removeEventListener('hx-change', handleChange);
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = value;
    }
  }, [value]);

  return <hx-text-input ref={inputRef} name="search" />;
}
```

## SSR / Next.js

Custom elements are browser-only APIs. In Next.js (App Router), import HELIX components inside a Client Component:

```tsx
// components/HelixLoader.tsx
'use client';

import { useEffect } from 'react';

export function HelixLoader() {
  useEffect(() => {
    import('@helixui/library');
  }, []);

  return null;
}
```

Place `<HelixLoader />` in your root layout. HELIX elements in Server Components render as unknown elements on the server and hydrate on the client — this is expected behavior for custom elements.

```tsx
// app/layout.tsx
import { HelixLoader } from '@/components/HelixLoader';

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

## Next Steps

- [Vue Integration](/framework-integration/vue)
- [Boolean Attributes reference](/guides/boolean-attributes)
- [Component Library](/component-library/overview)
