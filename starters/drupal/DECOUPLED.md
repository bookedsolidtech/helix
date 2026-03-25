# HELiX + Decoupled Drupal (Next.js for Drupal)

This document covers how to consume Drupal content via JSON:API or GraphQL
in a Next.js frontend and render it using HELiX web components.

HELiX components are framework-agnostic custom elements. They work in any
JavaScript environment that supports the Custom Elements specification,
including React (via Next.js) and plain HTML files.

---

## Architecture Overview

```
Drupal (backend CMS)
  JSON:API / GraphQL
    Next.js (frontend)
      React components that render hx-* custom elements
        HELiX web components hydrate in the browser
```

The Drupal instance acts as a headless CMS. Next.js fetches content at build
time (SSG), request time (SSR), or on the client (CSR), then passes the data
to React components that emit `hx-*` element markup.

---

## Installing @helixui/library in Next.js

```bash
npm install @helixui/library@1.1.2
```

Import the library once at the application entry point to register all
custom elements:

```ts
// app/layout.tsx (Next.js App Router)
import '@helixui/library';
```

For page router projects, import in `pages/_app.tsx`:

```ts
// pages/_app.tsx
import '@helixui/library';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
```

---

## TypeScript Custom Element Type Declarations

The `@helixui/library` package ships a `custom-elements.json` manifest.
Add JSX type declarations so TypeScript recognises `hx-*` element attributes:

```ts
// types/helix.d.ts
import type { HelixButton, HelixCard, HelixAlert } from '@helixui/library';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'hx-button': React.DetailedHTMLProps<React.HTMLAttributes<HelixButton>, HelixButton> & {
        variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline';
        'hx-size'?: 'sm' | 'md' | 'lg';
        type?: 'button' | 'submit' | 'reset';
        href?: string;
        target?: string;
        disabled?: boolean;
        loading?: boolean;
        'aria-label'?: string;
      };
      'hx-card': React.DetailedHTMLProps<React.HTMLAttributes<HelixCard>, HelixCard> & {
        variant?: 'default' | 'featured' | 'compact';
        elevation?: 'flat' | 'raised' | 'floating';
        'hx-href'?: string;
        'hx-aria-label'?: string;
      };
      'hx-alert': React.DetailedHTMLProps<React.HTMLAttributes<HelixAlert>, HelixAlert> & {
        variant?: 'info' | 'success' | 'warning' | 'error';
        dismissible?: boolean;
        open?: boolean;
        'show-icon'?: boolean;
        accent?: boolean;
      };
      'hx-text-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        name?: string;
        value?: string;
        type?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        error?: string;
        'help-text'?: string;
      };
      'hx-select': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        name?: string;
        required?: boolean;
        disabled?: boolean;
        error?: string;
        'help-text'?: string;
      };
      'hx-badge': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        variant?: string;
        'hx-size'?: string;
        removable?: boolean;
        pill?: boolean;
        pulse?: boolean;
        count?: number;
        max?: number;
      };
      'hx-dialog': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        heading?: string;
        open?: boolean;
        modal?: boolean;
        'hide-close-button'?: boolean;
      };
      'hx-tooltip': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        placement?: string;
        'show-delay'?: number;
        'hide-delay'?: number;
      };
      'hx-checkbox': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        label?: string;
        name?: string;
        value?: string;
        checked?: boolean;
        disabled?: boolean;
        required?: boolean;
        error?: string;
        'help-text'?: string;
        'hx-size'?: string;
      };
    }
  }
}
```

---

## Fetching Drupal Content via JSON:API

### Node listing (SSG)

```ts
// lib/drupal.ts
const DRUPAL_BASE_URL = process.env.DRUPAL_BASE_URL ?? 'https://cms.example.com';

export interface DrupalNode {
  id: string;
  title: string;
  body: { value: string; summary: string } | null;
  field_image?: { uri: { url: string }; resourceIdObjMeta: { alt: string } } | null;
  path: { alias: string };
}

export async function getNodes(type: string): Promise<DrupalNode[]> {
  const res = await fetch(
    `${DRUPAL_BASE_URL}/jsonapi/node/${type}?include=field_image`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Failed to fetch nodes: ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}
```

### Node detail (SSG with ISR)

```ts
// app/patients/[slug]/page.tsx
import { getNodes } from '@/lib/drupal';
import { PatientCard } from '@/components/PatientCard';

export default async function PatientPage({ params }: { params: { slug: string } }) {
  const nodes = await getNodes('patient');
  const node = nodes.find((n) => n.path.alias === `/${params.slug}`);
  if (!node) notFound();

  return <PatientCard node={node} />;
}
```

---

## React Components Wrapping hx-* Elements

### PatientCard component

```tsx
// components/PatientCard.tsx
'use client';

import type { DrupalNode } from '@/lib/drupal';

interface PatientCardProps {
  node: DrupalNode;
  onClick?: (href: string) => void;
}

/**
 * Wraps an hx-card component with Drupal node data.
 * The hx-card handles all visual presentation including hover states,
 * keyboard activation, and ARIA roles.
 */
export function PatientCard({ node, onClick }: PatientCardProps) {
  const href = node.path.alias;

  function handleHxClick(e: CustomEvent<{ href: string }>) {
    if (onClick) {
      onClick(e.detail.href);
    }
  }

  return (
    <hx-card
      variant="default"
      elevation="raised"
      hx-href={href}
      hx-aria-label={`View chart for ${node.title}`}
      // CustomEvent listener via ref in production — simplified here
    >
      {node.field_image && (
        <img
          slot="image"
          src={node.field_image.uri.url}
          alt={node.field_image.resourceIdObjMeta.alt}
        />
      )}
      <h3 slot="heading">{node.title}</h3>
      {node.body?.summary && <p>{node.body.summary}</p>}
    </hx-card>
  );
}
```

### ActionButton component

```tsx
// components/ActionButton.tsx
'use client';

interface ActionButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ActionButton({ label, variant = 'primary', type = 'button', href, disabled, onClick }: ActionButtonProps) {
  return (
    <hx-button
      variant={variant}
      type={type}
      href={href}
      disabled={disabled || undefined}
      onClick={onClick}
    >
      {label}
    </hx-button>
  );
}
```

---

## Handling CustomEvents in React

HELiX components dispatch CustomEvents that bubble and are composed (they
cross Shadow DOM boundaries). React's synthetic event system does not
recognise custom event names. Use `useEffect` with `addEventListener`:

```tsx
'use client';

import { useEffect, useRef } from 'react';

export function InteractiveCard({ href, title, body }: { href: string; title: string; body: string }) {
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    function handleClick(e: Event) {
      const customEvent = e as CustomEvent<{ href: string }>;
      window.location.href = customEvent.detail.href;
    }

    card.addEventListener('hx-click', handleClick);
    return () => card.removeEventListener('hx-click', handleClick);
  }, []);

  return (
    <hx-card
      ref={cardRef as React.RefObject<HTMLElement>}
      variant="default"
      elevation="raised"
      hx-href={href}
      hx-aria-label={`View: ${title}`}
    >
      <h3 slot="heading">{title}</h3>
      <p>{body}</p>
    </hx-card>
  );
}
```

---

## GraphQL (Drupal GraphQL Compose)

If using the `graphql_compose` Drupal module:

```ts
// lib/graphql.ts
const GRAPHQL_ENDPOINT = `${process.env.DRUPAL_BASE_URL}/graphql`;

const PATIENTS_QUERY = `
  query GetPatients {
    nodePatients(first: 20) {
      nodes {
        id
        title
        body { summary }
        path { alias }
      }
    }
  }
`;

export async function getPatients() {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: PATIENTS_QUERY }),
    next: { revalidate: 60 },
  });
  const json = await res.json();
  return json.data?.nodePatients?.nodes ?? [];
}
```

---

## Server-Side Rendering and Hydration

HELiX components use Shadow DOM and require client-side JavaScript to render
their visual presentation. For decoupled Drupal:

- Next.js renders the host element tags (`<hx-card>`, `<hx-button>`) on the
  server, including all slotted content.
- The slot content (heading, body text) is visible in the server-rendered HTML
  for SEO and no-JS accessibility.
- When JavaScript loads, the components hydrate and apply Shadow DOM styling.

This matches the progressive enhancement contract used by the Drupal module.

### Declarative Shadow DOM (DSD)

Lit 3.x supports Declarative Shadow DOM for true SSR. The `@helixui/library`
package does not yet ship a DSD-enabled server render entrypoint. When DSD
support is added, the `@lit-labs/ssr` package can be used with Next.js to
fully server-render Shadow DOM, eliminating the flash of unstyled content.

---

## Environment Variables

```bash
# .env.local
DRUPAL_BASE_URL=https://cms.example.com
DRUPAL_CLIENT_ID=nextjs-consumer
DRUPAL_CLIENT_SECRET=<oauth-secret>
```

---

## REST API Patterns

For simpler setups without JSON:API or GraphQL, Drupal's core REST module
can expose nodes as JSON:

```bash
# Enable REST module and configure resource
drush en rest restui -y
```

```ts
const node = await fetch(`${DRUPAL_BASE_URL}/node/${nid}?_format=json`).then(r => r.json());
```

The data structure differs from JSON:API — map fields manually to HELiX
component props.
