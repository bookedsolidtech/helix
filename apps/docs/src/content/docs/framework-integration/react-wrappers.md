---
title: '@helixui/react — React Wrappers'
description: 'Install and use the @helixui/react wrapper package: typed event callbacks, ref forwarding, tree-shaking, and Next.js 15 App Router integration.'
sidebar:
  order: 4
---

# @helixui/react — React Wrappers

`@helixui/react` provides auto-generated React wrapper components for every HELiX component. Each wrapper replaces `ref`-based `addEventListener` boilerplate with idiomatic React callback props (`onHxClick`, `onHxChange`, etc.) and ships full TypeScript types.

> **Status:** In development. This documentation is ready to publish when the package ships. The API described here matches the feature specification.

## Why Use the Wrapper Package?

React's synthetic event system does not forward custom DOM events. Without wrappers, listening to an `hx-click` event requires this:

```tsx
const ref = useRef<HTMLElement>(null);
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  el.addEventListener('hx-click', handleClick);
  return () => el.removeEventListener('hx-click', handleClick);
}, [handleClick]);
return <hx-button ref={ref}>Save</hx-button>;
```

With `@helixui/react`, that becomes:

```tsx
import { HxButton } from '@helixui/react';
return <HxButton onHxClick={handleClick}>Save</HxButton>;
```

The wrapper also provides:

- **Full TypeScript types** — props, events, and slots are typed without a manual `helix.d.ts`
- **Automatic ref forwarding** — `ref` gives you the underlying `HTMLElement`
- **React DevTools labels** — component tree shows `<HxButton>` instead of `<hx-button>`

## Installation

```bash
npm install @helixui/react
```

`@helixui/react` has a peer dependency on `react` and `react-dom`. No additional setup is required — the package registers web components internally.

## Import Patterns

### Named imports (recommended)

Import only what you need. Each component is tree-shakeable:

```ts
import { HxButton } from '@helixui/react';
import { HxTextInput } from '@helixui/react';
import { HxCard, HxDialog } from '@helixui/react';
```

### Barrel import

Import everything from the package root. Convenient for prototyping; prefer named imports in production for smaller bundles:

```ts
import * as Helix from '@helixui/react';
// <Helix.HxButton>, <Helix.HxTextInput>, ...
```

### Component naming convention

Every wrapper uses the PascalCase version of the tag name:

| Tag name | React wrapper |
|----------|--------------|
| `hx-button` | `HxButton` |
| `hx-text-input` | `HxTextInput` |
| `hx-card` | `HxCard` |
| `hx-dialog` | `HxDialog` |
| `hx-text-input` | `HxTextInput` |

## Typed Event Callbacks

Every `hx-*` event exposed by a component is available as a typed `on*` prop. The event name is converted from `kebab-case` to `camelCase` with an `on` prefix:

| DOM event | React prop |
|-----------|-----------|
| `hx-click` | `onHxClick` |
| `hx-change` | `onHxChange` |
| `hx-input` | `onHxInput` |
| `hx-focus` | `onHxFocus` |
| `hx-blur` | `onHxBlur` |
| `hx-open` | `onHxOpen` |
| `hx-close` | `onHxClose` |

### Event handler types

Event callbacks receive a `CustomEvent` with a typed `detail` payload:

```tsx
import { HxTextInput } from '@helixui/react';

function SearchField() {
  const handleInput = (e: CustomEvent<{ value: string }>) => {
    console.log(e.detail.value);
  };

  return (
    <HxTextInput
      label="Search"
      placeholder="Type to search…"
      onHxInput={handleInput}
    />
  );
}
```

### Button click example

```tsx
import { HxButton } from '@helixui/react';

function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <HxButton variant="primary" onHxClick={onSave}>
      Save
    </HxButton>
  );
}
```

## Ref Forwarding

Pass a `ref` to get the underlying `HTMLElement`. Use this to call imperative methods or read DOM properties directly:

```tsx
import { useRef } from 'react';
import { HxDialog } from '@helixui/react';

function ConfirmDialog() {
  const dialogRef = useRef<HTMLElement & { show: () => void; hide: () => void }>(null);

  const open = () => dialogRef.current?.show();
  const close = () => dialogRef.current?.hide();

  return (
    <>
      <HxButton onHxClick={open}>Open dialog</HxButton>
      <HxDialog ref={dialogRef} label="Confirm action" onHxClose={close}>
        <p>Are you sure?</p>
        <HxButton slot="footer" variant="primary" onHxClick={close}>Confirm</HxButton>
        <HxButton slot="footer" variant="ghost" onHxClick={close}>Cancel</HxButton>
      </HxDialog>
    </>
  );
}
```

## Slots

Pass slot content using the `slot` attribute on child elements, exactly as you would with raw web components:

```tsx
import { HxCard } from '@helixui/react';

function PatientCard({ name, id }: { name: string; id: string }) {
  return (
    <HxCard>
      <span slot="header">{name}</span>
      <p>Patient ID: {id}</p>
      <HxButton slot="footer" variant="ghost" size="sm">
        View record
      </HxButton>
    </HxCard>
  );
}
```

## Tree-Shaking Verification

To confirm only the components you import are included in your bundle, inspect with your bundler's analysis tool:

```bash
# Next.js bundle analyzer
npm install --save-dev @next/bundle-analyzer

# next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
export default withBundleAnalyzer({});

# Run
ANALYZE=true npm run build
```

In the bundle map, you should see individual component chunks (e.g., `hx-button.js`, `hx-text-input.js`) rather than a single monolithic `@helixui` chunk.

Each HELiX component is under 5 KB minified + gzipped. The `@helixui/react` wrapper layer adds approximately 1 KB total.

## Next.js 15 App Router Integration

### The `'use client'` requirement

Custom elements register via `customElements.define`, which is a browser-only API. Any file importing from `@helixui/react` must be a Client Component:

```tsx
'use client'; // Required — always at the top of files importing @helixui/react

import { HxButton } from '@helixui/react';

export function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <HxButton variant="primary" onHxClick={onClick}>{label}</HxButton>;
}
```

### Global registration in the root layout

For apps that use HELiX components on many pages, register all components once in the root layout:

```tsx
// components/helix-provider.tsx
'use client';

import { useEffect } from 'react';

export function HelixProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Registration happens automatically when @helixui/react is imported.
    // This component exists to ensure it loads on the client.
    import('@helixui/react');
  }, []);

  return <>{children}</>;
}
```

```tsx
// app/layout.tsx  (Server Component — no 'use client' needed)
import { HelixProvider } from '@/components/helix-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HelixProvider>{children}</HelixProvider>
      </body>
    </html>
  );
}
```

### Per-route Client Component pattern

For interactive islands, wrap only the interactive parts in Client Components:

```tsx
// components/patient-search.tsx
'use client';

import { useState } from 'react';
import { HxTextInput, HxButton } from '@helixui/react';

interface PatientSearchProps {
  onSearch: (query: string) => void;
}

export function PatientSearch({ onSearch }: PatientSearchProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="search-bar">
      <HxTextInput
        label="Search patients"
        placeholder="Name or patient ID"
        value={query}
        onHxInput={(e) => setQuery((e as CustomEvent<{ value: string }>).detail.value)}
      />
      <HxButton
        variant="primary"
        disabled={!query}
        onHxClick={() => onSearch(query)}
      >
        Search
      </HxButton>
    </div>
  );
}
```

```tsx
// app/patients/page.tsx  (Server Component)
import { PatientSearch } from '@/components/patient-search';

export default function PatientsPage() {
  return (
    <main>
      <h1>Patient Records</h1>
      <PatientSearch onSearch={async (query) => { 'use server'; /* ... */ }} />
    </main>
  );
}
```

## Complete Example App

A minimal patient portal UI demonstrating common wrapper patterns:

```tsx
// app/page.tsx  (Server Component)
import { PatientPortal } from '@/components/patient-portal';

export default function HomePage() {
  return <PatientPortal />;
}
```

```tsx
// components/patient-portal.tsx
'use client';

import { useState } from 'react';
import {
  HxButton,
  HxTextInput,
  HxCard,
  HxBadge,
  HxDialog,
} from '@helixui/react';

interface Patient {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

const MOCK_PATIENTS: Patient[] = [
  { id: 'P-001', name: 'Jane Smith', status: 'active' },
  { id: 'P-002', name: 'Robert Chen', status: 'inactive' },
  { id: 'P-003', name: 'Maria Garcia', status: 'active' },
];

export function PatientPortal() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = MOCK_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.id.includes(query)
  );

  const selectPatient = (patient: Patient) => {
    setSelected(patient);
    setDialogOpen(true);
  };

  return (
    <div className="portal">
      <h1>Patient Portal</h1>

      <HxTextInput
        label="Search patients"
        placeholder="Name or patient ID"
        onHxInput={(e) =>
          setQuery((e as CustomEvent<{ value: string }>).detail.value)
        }
      />

      <div className="patient-list">
        {filtered.map((patient) => (
          <HxCard key={patient.id}>
            <span slot="header">{patient.name}</span>
            <p>ID: {patient.id}</p>
            <HxBadge variant={patient.status === 'active' ? 'success' : 'neutral'}>
              {patient.status}
            </HxBadge>
            <HxButton
              slot="footer"
              variant="ghost"
              size="sm"
              onHxClick={() => selectPatient(patient)}
            >
              View record
            </HxButton>
          </HxCard>
        ))}
      </div>

      {selected && (
        <HxDialog
          open={dialogOpen}
          label={`Record: ${selected.name}`}
          onHxClose={() => setDialogOpen(false)}
        >
          <dl>
            <dt>Patient ID</dt>
            <dd>{selected.id}</dd>
            <dt>Status</dt>
            <dd>{selected.status}</dd>
          </dl>
          <HxButton
            slot="footer"
            variant="primary"
            onHxClick={() => setDialogOpen(false)}
          >
            Close
          </HxButton>
        </HxDialog>
      )}
    </div>
  );
}
```

## Next Steps

- [Wrapper Strategy overview](/guides/framework-wrappers) — architecture and when to use wrappers vs. raw web components
- [React Integration](/framework-integration/react) — raw web component patterns for React 18+
- [Next.js 15 guide](/framework-integration/nextjs) — full SSR, Server Actions, and hydration patterns
- [Design Tokens](/design-tokens/overview) — theming HELiX in your React app
