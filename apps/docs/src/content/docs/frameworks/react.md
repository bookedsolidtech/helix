---
title: React & Next.js
description: Using HELiX web components in React 18+ and Next.js 14+ applications, including TypeScript setup, event handling, and SSR configuration.
---

# React & Next.js

HELiX components work in React with no wrappers required. This guide covers installation, TypeScript types, event handling patterns, and Next.js-specific SSR configuration.

---

## Installation

```bash
npm install @wc-2026/library
```

---

## React 18+ Setup

### Registering Components

Register HELiX components once at the application root. In a Vite + React app, import from `main.tsx`:

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register all HELiX components
import '@wc-2026/library';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

For selective imports (better tree-shaking):

```tsx
// Register only what you use
import '@wc-2026/library/components/hx-button';
import '@wc-2026/library/components/hx-card';
import '@wc-2026/library/components/hx-text-input';
```

### Basic Usage

Once registered, use HELiX elements as JSX tags:

```tsx
// src/components/PatientCard.tsx
export function PatientCard({ name, room }: { name: string; room: string }) {
  return (
    <hx-card>
      <span slot="heading">{name}</span>
      <p>Room {room}</p>
    </hx-card>
  );
}
```

### TypeScript: Declaring Custom Elements in JSX

React's JSX types do not include custom elements by default. Declare them in a `.d.ts` file:

```typescript
// src/custom-elements.d.ts
import type { HxButtonElement } from '@wc-2026/library/types';
import type { HxCardElement } from '@wc-2026/library/types';
import type { HxTextInputElement } from '@wc-2026/library/types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hx-button': React.DetailedHTMLProps<
        React.HTMLAttributes<HxButtonElement> & {
          variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
          size?: 'sm' | 'md' | 'lg';
          disabled?: boolean;
          type?: 'button' | 'submit' | 'reset';
        },
        HxButtonElement
      >;
      'hx-card': React.DetailedHTMLProps<
        React.HTMLAttributes<HxCardElement>,
        HxCardElement
      >;
      'hx-text-input': React.DetailedHTMLProps<
        React.HTMLAttributes<HxTextInputElement> & {
          label?: string;
          value?: string;
          placeholder?: string;
          required?: boolean;
          disabled?: boolean;
          error?: string;
        },
        HxTextInputElement
      >;
    }
  }
}
```

### Handling Custom Events

React's synthetic event system does not recognize `hx-*` custom events. Use `useRef` and `addEventListener`:

```tsx
// src/components/PatientForm.tsx
import { useRef, useEffect } from 'react';

export function PatientForm() {
  const inputRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ value: string }>;
      console.log('Input changed:', customEvent.detail.value);
    };

    el.addEventListener('hx-change', handleChange);
    return () => el.removeEventListener('hx-change', handleChange);
  }, []);

  return (
    <form>
      <hx-text-input
        ref={inputRef}
        label="Patient Name"
        placeholder="Enter name"
      />
      <hx-button type="submit" variant="primary">
        Save
      </hx-button>
    </form>
  );
}
```

### Passing Object Props via Ref

React cannot pass objects/arrays as HTML attributes. Use `useEffect` and direct property assignment:

```tsx
import { useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
}

export function PatientSelect({ options, value, onChange }: Props) {
  const selectRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    // Object property — must use JS assignment, not attribute
    (el as HTMLElement & { options: SelectOption[] }).options = options;
  }, [options]);

  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const handleChange = (e: Event) => {
      onChange((e as CustomEvent<{ value: string }>).detail.value);
    };
    el.addEventListener('hx-change', handleChange);
    return () => el.removeEventListener('hx-change', handleChange);
  }, [onChange]);

  return <hx-select ref={selectRef} value={value} />;
}
```

---

## Next.js 14+ Setup

Next.js uses React Server Components (RSC) by default. Custom elements require browser APIs and cannot render on the server without special handling.

### The Rule: Always Import in Client Components

```tsx
// app/layout.tsx or any 'use client' component
'use client';

import '@wc-2026/library';
```

**Do not** import HELiX in Server Components — you will get a `ReferenceError: customElements is not defined`.

### Option 1: Dynamic Import (Recommended)

Use `next/dynamic` with `{ ssr: false }` to ensure components only load client-side:

```tsx
// app/components/HxComponents.tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

function HxComponentsLoader({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import('@wc-2026/library').then(() => setLoaded(true));
  }, []);

  if (!loaded) return null; // or a skeleton
  return <>{children}</>;
}

export default dynamic(() => Promise.resolve(HxComponentsLoader), {
  ssr: false,
});
```

```tsx
// app/patient/page.tsx (Server Component)
import HxComponentsLoader from '@/components/HxComponentsLoader';

export default function PatientPage() {
  return (
    <main>
      <h1>Patient Dashboard</h1>
      <HxComponentsLoader>
        <hx-card>
          <span slot="heading">Patient Summary</span>
        </hx-card>
      </HxComponentsLoader>
    </main>
  );
}
```

### Option 2: Client Component Boundary

Wrap your HELiX usage in a dedicated client component:

```tsx
// app/components/PatientCard.client.tsx
'use client';

import '@wc-2026/library/components/hx-card';
import '@wc-2026/library/components/hx-button';

interface Props {
  name: string;
  room: string;
  onEdit: () => void;
}

export function PatientCard({ name, room, onEdit }: Props) {
  return (
    <hx-card>
      <span slot="heading">{name}</span>
      <p>Room {room}</p>
      <hx-button slot="actions" variant="ghost" onClick={onEdit}>
        Edit
      </hx-button>
    </hx-card>
  );
}
```

```tsx
// app/patient/page.tsx (Server Component — no HELiX imports here)
import { PatientCard } from '@/components/PatientCard.client';

export default async function PatientPage() {
  const patient = await fetchPatient();
  return <PatientCard name={patient.name} room={patient.room} onEdit={() => {}} />;
}
```

### Next.js App Router: Global Registration

For apps-wide registration, add a client component to your root layout:

```tsx
// app/components/WebComponentsProvider.tsx
'use client';

import { useEffect } from 'react';

export function WebComponentsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    import('@wc-2026/library');
  }, []);

  return <>{children}</>;
}
```

```tsx
// app/layout.tsx
import { WebComponentsProvider } from './components/WebComponentsProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebComponentsProvider>{children}</WebComponentsProvider>
      </body>
    </html>
  );
}
```

### next.config.js: Transpile the Library

If you encounter module resolution errors, add the library to `transpilePackages`:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wc-2026/library'],
};

module.exports = nextConfig;
```

---

## Complete Example: Patient Form (Next.js)

```tsx
// app/components/PatientForm.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import '@wc-2026/library/components/hx-text-input';
import '@wc-2026/library/components/hx-button';
import '@wc-2026/library/components/hx-form';

interface PatientFormData {
  name: string;
  mrn: string;
  room: string;
}

export function PatientForm({ onSubmit }: { onSubmit: (data: PatientFormData) => void }) {
  const [formData, setFormData] = useState<PatientFormData>({ name: '', mrn: '', room: '' });

  const nameRef = useRef<HTMLElement>(null);
  const mrnRef = useRef<HTMLElement>(null);
  const roomRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const refs = [
      { ref: nameRef, field: 'name' as const },
      { ref: mrnRef, field: 'mrn' as const },
      { ref: roomRef, field: 'room' as const },
    ];

    const cleanups = refs.map(({ ref, field }) => {
      const el = ref.current;
      if (!el) return () => {};

      const handler = (e: Event) => {
        const detail = (e as CustomEvent<{ value: string }>).detail;
        setFormData((prev) => ({ ...prev, [field]: detail.value }));
      };

      el.addEventListener('hx-input', handler);
      return () => el.removeEventListener('hx-input', handler);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <hx-text-input ref={nameRef} label="Patient Name" required />
      <hx-text-input ref={mrnRef} label="MRN" required />
      <hx-text-input ref={roomRef} label="Room Number" />
      <hx-button type="submit" variant="primary">
        Register Patient
      </hx-button>
    </form>
  );
}
```

---

## Related

- [Vue & Nuxt](./vue/)
- [SSR/SSG Compatibility](./ssr-compatibility/)
- [Common Gotchas](./gotchas/)
