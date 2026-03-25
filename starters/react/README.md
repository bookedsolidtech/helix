# HELiX React Starter

A standalone [Vite](https://vitejs.dev/) + React 19 starter that demonstrates how to consume
`@helixui/react` — the officially generated React wrapper layer for the HELiX enterprise
healthcare web component library.

---

## Prerequisites

- Node.js 20 or 22
- npm 10+

---

## Installation and setup

```bash
cd starters/react
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To build for production:

```bash
npm run build   # runs tsc -b && vite build
npm run preview # preview the production build locally
```

---

## Using `@helixui/react`

`@helixui/react` provides fully-typed React wrappers for every HELiX web component. The wrappers
are auto-generated from the Custom Elements Manifest (CEM) and each wrapper includes a `'use
client'` directive, making them safe to use in frameworks that distinguish server and client
rendering (Next.js App Router, Remix).

### Basic import

```tsx
// Side-effect import — registers all hx-* custom elements
import '@helixui/library';

import { HxButton, HxCard, HxText } from '@helixui/react';

export default function MyComponent() {
  return (
    <HxCard>
      <HxText variant="body-lg" as="p">Hello, HELiX</HxText>
      <HxButton variant="primary">Click me</HxButton>
    </HxCard>
  );
}
```

### Typed event handlers: `onHxClick`, `onHxInput`, `onHxChange`

Every HELiX event is exposed as a typed callback prop. The naming convention mirrors the
`hx-*` custom event name: `hx-click` becomes `onHxClick`, `hx-input` becomes `onHxInput`, etc.

All event callbacks are typed as `(event: Event) => void`. To read values from the event, cast
`event.target` to the appropriate element type:

```tsx
import { HxButton, HxTextInput } from '@helixui/react';

function SearchBar() {
  function handleClick(event: Event) {
    // event is typed as Event — cast target for DOM access
    console.log('Button element:', event.target);
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    console.log('Current value:', target.value);
  }

  return (
    <>
      <HxTextInput label="Search" onHxInput={handleInput} />
      <HxButton variant="primary" onHxClick={handleClick}>Search</HxButton>
    </>
  );
}
```

---

## React Hook Form + Zod integration

The `PatientRegistrationForm` component (`src/components/PatientRegistrationForm.tsx`) shows the
recommended pattern for form management with HELiX inputs.

Key points:

1. Use `Controller` from `react-hook-form` to wrap each HELiX input — this bridges RHF's
   controlled field API with the web component's event model.
2. Wire `onHxInput` (fires on every keystroke) to `field.onChange` for live validation.
3. Wire `onHxChange` (fires on blur / commit) to `field.onChange` as a secondary sync point.
4. Pass the `error` prop directly from `fieldState.error?.message` for inline validation display.

```tsx
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HxTextInput, HxButton } from '@helixui/react';

const schema = z.object({
  email: z.string().email('Invalid email'),
});

export default function MyForm() {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <form onSubmit={handleSubmit(console.log)} noValidate>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <HxTextInput
            label="Email"
            value={field.value}
            error={errors.email?.message}
            onHxInput={(e: Event) => {
              field.onChange((e.target as HTMLInputElement).value);
            }}
          />
        )}
      />
      <HxButton type="submit" variant="primary">Submit</HxButton>
    </form>
  );
}
```

---

## CEM-driven wrapper generation

`@helixui/react` wrappers are **auto-generated** from `packages/hx-library/custom-elements.json`
(the Custom Elements Manifest) via `scripts/generate-react-wrappers.ts` in the HELiX monorepo.

When a new component is added to `@helixui/library`, regenerating the wrappers is a single
command run from the monorepo root:

```bash
pnpm --filter=@helixui/react run generate
```

This reads the CEM, produces a typed wrapper + `index.ts` for every declared custom element, and
updates the package's `src/index.ts` barrel export. The entire public API of `@helixui/react` —
props, event callbacks, TypeScript types — is derived from CEM declarations.

**Do not edit generated files manually.** Always update the Lit component source and run `generate`
to propagate changes.

---

## Next.js App Router

See [`examples/nextjs/`](./examples/nextjs/) for a complete Next.js 15 App Router example.

### `'use client'` boundary pattern

Web components access browser APIs (`customElements`, `HTMLElement`, DOM) during initialization.
These APIs do not exist in the Node.js SSR runtime. Any component that imports HELiX must be
declared a Client Component:

```tsx
'use client';

import '@helixui/library';   // MUST be inside a 'use client' file
import { HxButton } from '@helixui/react';
```

Keep Server Components as the outer shell (layouts, data fetching, metadata) and delegate all
HELiX rendering to Client Component subtrees.

### `transpilePackages` configuration

Add the following to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ['@helixui/library', '@helixui/react', '@lit/react', 'lit'],
};
```

Next.js does not transpile `node_modules` by default. HELiX and Lit use ES module syntax and
decorators that require transpilation through Next.js's webpack pipeline.

### SSR / hydration

Next.js server-renders the HTML shell for Client Components using React's `renderToString` path —
the module is not executed on the server, so `customElements.define` is never called. The browser
receives standard HTML, loads the client bundle, and upgrades the `hx-*` elements. React then
hydrates the tree. The result is a fast initial paint with no layout shift.

---

## Project structure

```
starters/react/
├── src/
│   ├── main.tsx                         # React DOM entry point
│   ├── App.tsx                          # Root component, header, card examples
│   └── components/
│       └── PatientRegistrationForm.tsx  # RHF + Zod form example
├── examples/
│   └── nextjs/                          # Next.js 15 App Router example
│       ├── app/
│       │   ├── layout.tsx               # Server Component layout
│       │   ├── page.tsx                 # Server Component page
│       │   └── components/
│       │       └── HelixComponents.tsx  # 'use client' boundary
│       ├── next.config.ts
│       └── tsconfig.json
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```
