---
title: Register, Bundle, and Publish Your Component Package
description: Vite library-mode build, per-component entry points, CEM Analyzer, custom element registration strategy, CDN patterns for Drupal, @lit/react wrapper generation, and enterprise version pinning for consumer packages built on @helixui/library.
sidebar:
  order: 6
  badge:
    text: Distribution
    variant: tip
---

When your extended components graduate from a single project into a shared internal package, you need the same distribution infrastructure HELiX itself uses: per-component entry points, TypeScript declarations, CEM metadata, and framework wrappers. This guide walks through the full setup from `vite.config.ts` through npm publish.

---

## Package Structure

Mirror the HELiX monorepo pattern for a consumer package:

```
packages/my-design-system/
├── src/
│   ├── index.ts                          # Library barrel (re-exports)
│   └── components/
│       ├── org-patient-card/
│       │   ├── index.ts                  # Re-export
│       │   ├── org-patient-card.ts       # Component class
│       │   └── org-patient-card.styles.ts
│       └── org-clinical-button/
│           ├── index.ts
│           └── org-clinical-button.ts
├── custom-elements-manifest.config.mjs
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Vite Library Mode Configuration

Vite's library mode builds your component source into consumable ES modules. The key decisions are entry point discovery, format, and externalization.

### vite.config.ts

```ts
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Auto-discover component entry points — eliminates merge conflicts
// when multiple engineers add components in parallel.
function discoverEntryPoints() {
  const componentsDir = resolve(__dirname, 'src/components');
  const entries: Record<string, string> = {
    index: resolve(__dirname, 'src/index.ts'),
  };

  if (!existsSync(componentsDir)) return entries;

  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    const indexPath = resolve(componentsDir, dir, 'index.ts');
    if (existsSync(indexPath)) {
      entries[`components/${dir}/index`] = indexPath;
    }
  }

  return entries;
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.stories.ts'],
      // Declaration maps enable Go-to-Definition to jump to source .ts files
      // rather than the compiled .d.ts in node_modules.
      declarationMap: true,
    }),
  ],
  build: {
    lib: {
      entry: discoverEntryPoints(),
      formats: ['es'],
    },
    outDir: 'dist',
    rollupOptions: {
      // Externalize everything @helixui/library provides.
      // Consumers already have these — bundling them doubles the bytes.
      external: [/^lit/, /^@lit/, /^@helixui\/library/, /^@helixui\/tokens/, /^@floating-ui/],
      output: {
        // Entry files land at their declared path (components/org-patient-card/index.js).
        entryFileNames: '[name].js',
        // Shared internal utilities (e.g., a shared mixin) go into a hashed chunk.
        // Consumers never import chunks directly — only entry points.
        chunkFileNames: 'shared/[name]-[hash].js',
      },
    },
    sourcemap: true,
    // esbuild minification preserves class names needed for Lit decorators.
    minify: 'esbuild',
  },
});
```

### Why `formats: ['es']` only

HELiX and modern Drupal themes consume ES modules directly. CommonJS (`cjs`) output is only needed if you support Node.js consumers running without a bundler — uncommon for web component libraries. A single `es` format keeps the output clean and avoids the dual-package hazard where two module copies register the same element twice.

### Why `declarationMap: true`

Declaration maps (`.d.ts.map` files) let TypeScript editors follow Go-to-Definition through to your source `.ts` files rather than stopping at the compiled `.d.ts` in `node_modules`. This is the difference between seeing your actual component source versus a stripped type shell when a consumer debugs an issue.

---

## package.json Template

```json
{
  "name": "@your-org/design-system",
  "version": "0.1.0",
  "description": "Enterprise healthcare web components extending @helixui/library",
  "type": "module",
  "sideEffects": ["./dist/index.js", "./dist/components/*/index.js", "**/*.css"],
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./components/*": {
      "types": "./dist/components/*/index.d.ts",
      "import": "./dist/components/*/index.js"
    },
    "./custom-elements.json": "./custom-elements.json"
  },
  "files": ["dist", "custom-elements.json"],
  "customElements": "custom-elements.json",
  "scripts": {
    "build": "vite build && npm run cem",
    "cem": "cem analyze --config custom-elements-manifest.config.mjs",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "@helixui/library": ">=3.9.0 <4.0.0",
    "lit": ">=3.0.0"
  },
  "devDependencies": {
    "@custom-elements-manifest/analyzer": "^0.10.0",
    "@helixui/library": "^3.9.0",
    "lit": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "vite-plugin-dts": "^4.0.0"
  }
}
```

Key fields:

- **`"type": "module"`** — all `.js` files in the package are ES modules, matching HELiX
- **`"sideEffects"`** — Custom Element packages **cannot** declare `"sideEffects": false`: every component module calls `customElements.define()` at import time, which is a real side effect. The allow-list above tells bundlers to preserve the registration side effect for `index.js` + per-component entries (and CSS) while still tree-shaking everything else. Matches `@helixui/library`'s own package.json.
- **`"exports"`** — the subpath map tells Node.js and bundlers how to resolve `@your-org/design-system/components/org-patient-card`
- **`"customElements"`** — points IDEs and Storybook autodocs to your CEM file
- **`peerDependencies`** — `@helixui/library` and `lit` are required at runtime but supplied by the consumer; listing them here makes npm warn on version mismatches rather than silently installing a second copy

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["**/*.test.ts", "**/*.stories.ts", "dist"]
}
```

`useDefineForClassFields: false` is required for Lit decorators to work correctly — Lit relies on class field initializers running before `connectedCallback`, which the TypeScript `define` semantics break.

---

## CEM Analyzer for Extended Components

The Custom Elements Manifest captures your public API — properties, events, slots, and CSS custom properties — in machine-readable form. IDEs, Storybook, and API documentation sites consume it.

### custom-elements-manifest.config.mjs

```js
import { readFileSync } from 'fs';

export default {
  globs: ['src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.stories.ts'],
  outdir: '.',
  // The CEM Analyzer discovers properties declared with @property,
  // events documented with @fires, slots with @slot, and CSS custom
  // properties with @cssprop. These JSDoc annotations are required.
  packagejson: true,
};
```

### Required JSDoc for CEM discovery

Every component class needs these annotations or the CEM will be incomplete:

```typescript
/**
 * @tag org-patient-card
 * @summary Patient information card extending HelixCard.
 *
 * @slot image - Patient photo or avatar.
 * @slot heading - Patient name. Use a heading element (h2, h3).
 * @slot - Default slot for patient details and clinical notes.
 * @slot footer - Timestamps and metadata.
 * @slot actions - Action buttons (schedule, message, view chart).
 *
 * @csspart status-badge - The status indicator badge.
 *
 * @cssprop [--org-patient-card-status-color=var(--hx-color-neutral-500)] - Status badge color.
 *
 * @fires {CustomEvent<PatientCardStatusChangeDetail>} org-status-change - Fired when status changes.
 */
@customElement('org-patient-card')
export class PatientCard extends HelixCard {
  /** @attr status */
  @property({ type: String, reflect: true })
  status: 'stable' | 'monitoring' | 'critical' | 'discharged' = 'stable';
}
```

---

## Custom Element Registration Strategy

### The Double-Registration Problem

When both `@helixui/library` and your consumer package are loaded — for example, a Drupal page loads HELiX globally and a component module registers an extended element — `customElements.define()` can be called twice for the same tag name. The browser throws a `NotSupportedError: Operation is not supported` and the element fails silently.

Your extended components use a **different tag name** (`org-patient-card`, not `hx-card`), so they do not conflict with HELiX's own registrations. But within your own package, you must guard against duplicate registrations when a module is loaded multiple times through different import paths.

### Safe Registration Pattern

Use `customElements.get()` to check before defining:

```typescript
// org-patient-card.ts
import { HelixCard } from '@helixui/library/components/hx-card';

export class PatientCard extends HelixCard {
  // ... implementation
}

// Guard against duplicate registration when both
// `@your-org/design-system` and a local build are present.
if (!customElements.get('org-patient-card')) {
  customElements.define('org-patient-card', PatientCard);
}
```

For Lit components that use `@customElement`, the decorator calls `define()` unconditionally. Use the manual pattern above instead of `@customElement` when double-registration is a risk (CDN + bundled hybrid deployments):

```typescript
// Remove @customElement decorator when registration must be guarded
export class PatientCard extends HelixCard {
  // @customElement('org-patient-card') — removed for safe registration
}

// Explicit guarded define
if (!customElements.get('org-patient-card')) {
  customElements.define('org-patient-card', PatientCard);
}

declare global {
  interface HTMLElementTagNameMap {
    'org-patient-card': PatientCard;
  }
}
```

### Why HELiX Components Are Safe to Load Twice

`@helixui/library` components use `@customElement` directly. They are safe because consumers load only one copy of the package — npm deduplication ensures a single `node_modules/@helixui/library` exists at any given version. CDN loads require careful import map coordination (see below).

---

## CDN Loading Patterns for Drupal

Drupal themes often load HELiX from a CDN and serve extended components from the theme's file system. The combination requires coordinating module specifiers so that both the CDN copy of HELiX and the local extended components share the same Lit instance.

### importmap for shared dependencies

An import map pins bare module specifiers to resolved URLs, preventing duplicate module instances:

```html
<!-- In the Drupal theme's html.html.twig, before any <script type="module">.
     `@helixui/library` imports `@helixui/tokens`, `@helixui/icons`, and
     `@floating-ui/dom` from bare specifiers — every transitive dep needs
     an import-map entry, or browsers will fail to resolve them. -->
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
      "@lit/reactive-element": "https://cdn.jsdelivr.net/npm/@lit/reactive-element@2/reactive-element.js",
      "lit-html": "https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js",
      "@helixui/tokens": "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.4/dist/index.js",
      "@helixui/icons": "https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist/index.js",
      "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1/+esm",
      "@helixui/library": "https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js",
      "@helixui/library/components/hx-card": "https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-card/index.js"
    }
  }
</script>

<!-- HELiX from CDN -->
<script
  type="module"
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js"
></script>

<!-- Your extended components from the theme's file system -->
<script type="module" src="/themes/custom/my-theme/js/dist/index.js"></script>
```

> Per-component imports resolve to `dist/components/<tag>/index.js` — bare prefix mappings like `"@helixui/library/components/": "…/dist/components/"` won't work in every browser because the resolved URL omits `/index.js`. Map each component explicitly (or rely on the aggregate `dist/index.js` entry).

Without the import map, `/themes/custom/my-theme/js/dist/index.js` ships a bundled copy of Lit and HELiX classes. The CDN copy loaded earlier registers identical Lit base classes under different module URLs — two different `LitElement` prototypes. Components extending the bundled copy no longer extend the CDN copy, and the `instanceof` checks Lit uses internally break.

### Per-component script tags

For incremental adoption — loading only the components a specific page needs:

```html
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/",
      "lit/directives/class-map.js": "https://cdn.jsdelivr.net/npm/lit@3/directives/class-map.js",
      "@helixui/tokens": "https://cdn.jsdelivr.net/npm/@helixui/tokens@3.9.4/dist/index.js",
      "@helixui/icons": "https://cdn.jsdelivr.net/npm/@helixui/icons@1.1.0/dist/index.js",
      "@floating-ui/dom": "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1/+esm",
      "@helixui/library/components/hx-card": "https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-card/index.js"
    }
  }
</script>

<script type="module">
  // Explicit import — only registers hx-card and its dependencies
  import 'https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/components/hx-card/index.js';
  import '/themes/custom/my-theme/js/dist/components/org-patient-card/index.js';
</script>
```

### Drupal library definition

In `my_theme.libraries.yml`, attach the import map before all module scripts:

```yaml
helix_importmap:
  header: true
  js:
    js/helix-importmap.js: { type: external, attributes: { type: importmap } }

helix_base:
  header: true
  dependencies:
    - my_theme/helix_importmap
  js:
    https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js:
      type: external
      attributes:
        type: module

org_components:
  header: true
  dependencies:
    - my_theme/helix_base
  js:
    js/dist/index.js: { attributes: { type: module } }
```

The import map must load before any `type="module"` scripts that use the mapped specifiers. Setting `header: true` and listing `helix_importmap` as a dependency of all downstream libraries guarantees ordering.

---

## React Wrapper Generation

`@helixui/react` demonstrates a CEM-driven approach: read the generated `custom-elements.json`, generate one `@lit/react` wrapper per component. Apply the same pattern to your consumer package.

### What `@lit/react` createComponent does

`createComponent` bridges the web component's imperative DOM event model to React's synthetic event system. Without it, React consumers must add `ref` callbacks to attach event listeners manually:

```tsx
// Without @lit/react — verbose and fragile
function PatientCardWrapper() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log(detail.status);
    };
    el?.addEventListener('org-status-change', handler);
    return () => el?.removeEventListener('org-status-change', handler);
  }, []);

  return <org-patient-card ref={ref} status="stable" />;
}
```

```tsx
// With @lit/react — declarative and type-safe
import { OrgPatientCard } from '@your-org/react';

function PatientCardWrapper() {
  return <OrgPatientCard status="stable" onOrgStatusChange={(e) => console.log(e.detail.status)} />;
}
```

### Wrapper template

```typescript
// src/components/OrgPatientCard/OrgPatientCard.tsx
'use client';

import React from 'react';
import { createComponent } from '@lit/react';
import { PatientCard } from '@your-org/design-system/components/org-patient-card';

export const OrgPatientCard = createComponent({
  tagName: 'org-patient-card',
  elementClass: PatientCard,
  react: React,
  events: {
    // Map React prop name to DOM event name.
    // camelCase onX prop → kebab-case x event.
    onOrgStatusChange: 'org-status-change',
  },
  displayName: 'OrgPatientCard',
});

export type { OrgPatientCardProps } from './types.js';
export default OrgPatientCard;
```

### Types file

```typescript
// src/components/OrgPatientCard/types.ts
import type React from 'react';
import type { PatientCardStatusChangeDetail } from '@your-org/design-system';

export interface OrgPatientCardProps {
  variant?: 'default' | 'featured' | 'compact';
  elevation?: 'flat' | 'raised' | 'floating';
  status?: 'stable' | 'monitoring' | 'critical' | 'discharged';
  severity?: 'low' | 'medium' | 'high';
  mrn?: string;
  'hx-href'?: string;
  'hx-label'?: string;
  className?: string;
  children?: React.ReactNode;
  onOrgStatusChange?: (event: CustomEvent<PatientCardStatusChangeDetail>) => void;
}
```

Build an explicit interface per component from your CEM rather than `Partial<ElementClass>` — `Partial<>` exposes private fields, lifecycle hooks, and inherited Lit internals as if they were React props, and silently drifts the moment the component's class shape changes. The HELiX generator emits a similar shape per wrapper.

### Generator script

For packages with many components, generate wrappers from your CEM rather than hand-authoring each file:

```typescript
// scripts/generate-react-wrappers.ts
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const cem = JSON.parse(readFileSync('custom-elements.json', 'utf8'));
const outputDir = resolve('packages/react/src/components');

for (const module of cem.modules ?? []) {
  for (const declaration of module.declarations ?? []) {
    if (declaration.kind !== 'class' || !declaration.tagName) continue;

    const tagName = declaration.tagName;
    // org-patient-card -> OrgPatientCard
    const componentName = tagName
      .split('-')
      .map((p: string) => p[0].toUpperCase() + p.slice(1))
      .join('');

    const events: Record<string, string> = {};
    for (const event of declaration.events ?? []) {
      // org-status-change -> onOrgStatusChange
      const propName =
        'on' +
        event.name
          .split('-')
          .map((p: string) => p[0].toUpperCase() + p.slice(1))
          .join('');
      events[propName] = event.name;
    }

    const eventsSource =
      Object.keys(events).length > 0
        ? `events: {\n${Object.entries(events)
            .map(([k, v]) => `    ${k}: '${v}',`)
            .join('\n')}\n  },`
        : '';

    const source = `'use client';
import React from 'react';
import { createComponent } from '@lit/react';
import { ${declaration.name} } from '@your-org/design-system/components/${tagName}';

export const ${componentName} = createComponent({
  tagName: '${tagName}',
  elementClass: ${declaration.name},
  react: React,
  ${eventsSource}
  displayName: '${componentName}',
});

export default ${componentName};
`;

    mkdirSync(`${outputDir}/${componentName}`, { recursive: true });
    writeFileSync(`${outputDir}/${componentName}/${componentName}.tsx`, source);

    // Emit the per-component types.ts + index.ts so the wrapper directory
    // is self-contained. Production generators (`scripts/generate-react-wrappers.ts`
    // in @helixui/react) also append each wrapper to a top-level `src/index.ts`
    // re-export barrel — omitted here for brevity but required for the package
    // entry to resolve `import { OrgPatientCard } from '@your-org/react'`.
    writeFileSync(
      `${outputDir}/${componentName}/types.ts`,
      `import type React from 'react';\nexport interface ${componentName}Props { children?: React.ReactNode; }\n`,
    );
    writeFileSync(
      `${outputDir}/${componentName}/index.ts`,
      `export { ${componentName} } from './${componentName}.js';\nexport type { ${componentName}Props } from './types.js';\n`,
    );
  }
}
```

Run it after building your library:

```bash
npm run build && npx tsx scripts/generate-react-wrappers.ts
```

---

## Enterprise Version Pinning

### Pin `@helixui/library` as a peer dependency

Consumer packages should declare `@helixui/library` as a `peerDependency`, not a `dependency`:

```json
{
  "peerDependencies": {
    "@helixui/library": ">=3.9.0 <4.0.0",
    "lit": ">=3.0.0 <4.0.0"
  }
}
```

**Why peer, not dependency:**

When `@helixui/library` is a regular `dependency`, npm may install two copies at different versions — one for your package, one for the consumer's direct usage. Two copies means two `customElements` registries from the same tag names, two `LitElement` base classes, and broken `instanceof` checks. Peer dependencies force npm to resolve to a single shared instance.

### Lock the range, not the exact version

Use a range (e.g. `>=3.9.0 <4.0.0`) rather than an exact pin (`=3.9.2`). An exact pin means every patch bug fix in HELiX requires your package to publish a new release. A range allows consumers to pick up patch releases without updating your package — which is the correct behavior for stable, semver-compliant packages.

### Changesets for your own package

Use changesets to manage your version bumps relative to HELiX's:

```bash
npm install --save-dev @changesets/cli
npx changeset init
```

In `.changeset/config.json`:

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

Set `"access": "restricted"` for private internal packages. Set `"access": "public"` only if publishing to the public npm registry.

### Managing breaking changes across the dependency chain

When HELiX releases a major version, the upgrade path for consumer packages is (illustrated with a hypothetical jump from the current `v3` to a future `v4`):

1. **HELiX publishes `v4.0.0`** — breaking changes documented in CHANGELOG, deprecated APIs removed
2. **You update your `peerDependencies`** — `"@helixui/library": ">=4.0.0 <5.0.0"`
3. **You audit your extended components** — any subclasses that relied on changed public API must be updated
4. **You publish a new major of your package** — bump your own major, signaling the peer-dependency upgrade requirement
5. **End consumers update both packages** — `@helixui/library@^4` and `@your-org/design-system@<your-new-major>`

Do not try to maintain compatibility with both `@helixui/library@^3` and `@helixui/library@^4` in a single release of your package. The shared `LitElement` instance requirement makes version straddling unreliable. Use separate major versions.

### Pinning in Drupal projects

For Drupal projects consuming via CDN, pin the CDN URL to the major version:

```html
<!-- Pinned to major 3, receives patch + minor updates automatically -->
<script src="https://cdn.jsdelivr.net/npm/@helixui/library@3/dist/index.js" type="module"></script>

<!-- Pinned to exact version for zero-change deployments in regulated environments -->
<script
  src="https://cdn.jsdelivr.net/npm/@helixui/library@3.11.2/dist/index.js"
  type="module"
></script>
```

For regulated healthcare environments (SOC 2, HIPAA-adjacent deployments), exact-version CDN pins or self-hosted copies are common — the `@<major>` floating-major tag updates automatically on CDN cache refresh, which may violate change management policies.

---

## Verifying Your Build

Before publishing, verify all pieces are in place:

```bash
# Build library + generate CEM
npm run build

# Confirm dist structure matches package.json exports
ls dist/
# index.js  index.d.ts  index.d.ts.map
# components/org-patient-card/index.js  ...

# Verify exports resolve correctly
node -e "import('@your-org/design-system').then(m => console.log(Object.keys(m)))"
node -e "import('@your-org/design-system/components/org-patient-card').then(m => console.log(Object.keys(m)))"

# Verify TypeScript types are resolvable — tsc has no -e flag, so write the
# probe to a temp file and type-check that. (Or just run `npm run type-check`.)
node -e "require('fs').writeFileSync('.types-probe.ts', \"import type { PatientCard } from '@your-org/design-system';\nconst _: PatientCard | undefined = undefined;\n\")"
npx tsc --noEmit --moduleResolution bundler --module esnext .types-probe.ts
rm .types-probe.ts

# Check CEM is present and complete
cat custom-elements.json | \
  node -e "const c=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); \
  c.modules.flatMap(m=>m.declarations??[]).filter(d=>d.customElement).forEach(d=>console.log(d.tagName))"
```

### pack before publish

Use `npm pack --dry-run` to verify the tarball contains what `"files"` declares and nothing more:

```bash
npm pack --dry-run
# Should list:
# dist/index.js
# dist/index.d.ts
# dist/components/org-patient-card/index.js
# dist/components/org-patient-card/index.d.ts
# custom-elements.json
# package.json
# README.md
```

If `src/` files appear in the output, your `"files"` field is misconfigured.

---

## Next Steps

- [Composing Higher-Order Components](/extending/compose-higher-order-components) — compound component patterns before committing to a published package
- [React Integration](/framework-integration/react) — full React wrapper setup for HELiX components
- [Drupal Integration](/drupal/installation/getting-started/) — Twig templates, Drupal libraries, and behavior patterns
- [Testing Extended Components](/extending/testing-extended-components/) — Vitest + axe-core test patterns for consumer packages
