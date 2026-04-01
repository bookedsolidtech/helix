# HELiX — Next.js App Router Example

This example demonstrates how to use `@helixui/react` (HELiX web component wrappers) inside a
**Next.js 15 App Router** project.

---

## Why `'use client'` is required for web components

HELiX components are Lit 3.x web components. When `@helixui/library` is imported, each component
class calls `customElements.define('hx-button', HxButton)`. The `customElements` registry is a
**browser API** — it does not exist in the Node.js runtime used for server-side rendering.

If you import `@helixui/library` (or any `@helixui/react` wrapper) inside a Server Component,
Next.js will throw a `ReferenceError: customElements is not defined` at build time.

**Solution:** put all HELiX usage inside a `'use client'` boundary:

```tsx
'use client';

import '@helixui/library'; // registers hx-* elements — browser-only
import { HxButton } from '@helixui/react';

export default function MyClientComponent() {
  return <HxButton onHxClick={(e) => console.log(e)}>Click me</HxButton>;
}
```

The `@helixui/react` wrappers already include `'use client'` at the top of every generated file,
so they cannot be accidentally consumed in a Server Component. You still need to add `'use client'`
to your own files that import them.

---

## How hydration works with the App Router

1. **Server render:** Next.js renders the page tree on the server. Client Components are
   server-rendered to an HTML shell (React's `renderToString` path does NOT execute the module,
   so `customElements.define` is never called on the server).
2. **HTML streamed to browser:** The `hx-*` element tags appear in the HTML as
   `HTMLElement` nodes (unknown custom elements). The browser renders them as empty boxes.
3. **Client bundle loads:** The JavaScript bundle — including `@helixui/library` — executes in
   the browser.
4. **Custom element upgrade:** Each `hx-*` element is upgraded by the registry. Lit runs the
   constructor, connectedCallback, and first render.
5. **React hydration:** React reconciles its virtual DOM with the server-rendered HTML.

The result is a fast initial paint (SSR HTML) followed by interactive web components with no
layout shift, because the component shell was already in the DOM.

---

## `transpilePackages` requirement

Add this to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ['@helixui/library', '@helixui/react', '@lit/react', 'lit'],
};
```

Next.js uses webpack (or Turbopack) and by default does not transpile code inside `node_modules`.
`@helixui/library` and Lit use ES module syntax (bare `import`, `export`, decorators, private
class fields) that webpack does not handle without transpilation. The `transpilePackages` option
instructs Next.js to include these packages in its transpilation pipeline.

---

## Project structure

```
examples/nextjs/
├── app/
│   ├── layout.tsx              # Server Component — metadata only, no HELiX imports
│   ├── page.tsx                # Server Component — renders <HelixComponents />
│   └── components/
│       └── HelixComponents.tsx # 'use client' boundary — all HELiX usage lives here
├── next.config.ts              # transpilePackages config
├── tsconfig.json               # strict TypeScript
└── package.json
```

---

## Running this example

```bash
cd starters/react/examples/nextjs
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
