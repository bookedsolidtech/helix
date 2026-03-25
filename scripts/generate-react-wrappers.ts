#!/usr/bin/env tsx
/**
 * Auto-generates React wrapper components from the HELiX Custom Elements Manifest.
 * Run: pnpm exec tsx scripts/generate-react-wrappers.ts
 *
 * Generates packages/hx-react/src/components/<ComponentName>/index.ts for each component.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const cemPath = resolve(rootDir, 'packages/hx-library/custom-elements.json');
const outputDir = resolve(rootDir, 'packages/hx-react/src/components');

// --- CEM Types (subset) ---
interface CemAttribute {
  name: string;
  type?: { text: string };
  description?: string;
  default?: string;
  reflects?: boolean;
}

interface CemProperty {
  name: string;
  type?: { text: string };
  description?: string;
  default?: string;
  attribute?: string;
  reflects?: boolean;
}

interface CemEvent {
  name: string;
  type?: { text: string };
  description?: string;
}

interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  customElement?: boolean;
  description?: string;
  attributes?: CemAttribute[];
  members?: (CemProperty & { kind: string })[];
  events?: CemEvent[];
  slots?: { name: string; description?: string }[];
  cssProperties?: { name: string; description?: string }[];
  cssParts?: { name: string; description?: string }[];
}

interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
}

interface Cem {
  schemaVersion: string;
  readme?: string;
  modules?: CemModule[];
}

// --- Utilities ---

/**
 * Converts hx-button -> HxButton (PascalCase React component name).
 * This is the *React* component name, distinct from the internal Helix class name.
 */
function toPascalCase(tagName: string): string {
  return tagName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Converts hx-change -> onHxChange (React event callback prop name).
 */
function toEventCallbackName(eventName: string): string {
  const camelCase = eventName
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  return 'on' + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * DOM-global type names that are valid without imports.
 */
const DOM_GLOBAL_TYPES = new Set([
  'Element',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLDialogElement',
  'HTMLFormElement',
  'HTMLInputElement',
  'HTMLSlotElement',
  'File',
  'ValidityState',
  'ElementInternals',
  'Event',
  'CustomEvent',
  'EventTarget',
  'Node',
]);

/**
 * Primitive and built-in TypeScript types safe to use without imports.
 */
const SAFE_BUILTIN_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'unknown',
  'any',
  'never',
  'void',
  'object',
  'Record',
  'Partial',
  'Set',
  'Map',
  'Array',
  'Date',
  'ReturnType',
]);

/**
 * Checks if a type token is safe to emit without importing.
 * Handles array types (Foo[]) and generic types (Foo<Bar>).
 */
function isKnownSafeType(token: string): boolean {
  // Strip array suffix
  const base = token.replace(/\[\]$/, '').split('<')[0] ?? token;
  return SAFE_BUILTIN_TYPES.has(base) || DOM_GLOBAL_TYPES.has(base);
}

/**
 * Sanitizes a CEM type string for use in TypeScript source.
 * Named types from the library that cannot be imported are replaced with `string`
 * to avoid unresolved identifier errors in the generated wrapper code.
 */
function sanitizeType(typeText: string | undefined): string {
  if (!typeText) return 'unknown';

  // Normalize whitespace (CEM types can have newlines and extra spaces)
  const normalized = typeText.replace(/\s+/g, ' ').trim();

  // Handle parenthesized array types like (A | B | C)[]
  // These represent a union wrapped in parens with an array suffix.
  const parenArrayMatch = normalized.match(/^\((.+)\)\[\]$/);
  if (parenArrayMatch) {
    const innerSanitized = sanitizeType(parenArrayMatch[1]);
    return `(${innerSanitized})[]`;
  }

  // Split union type into tokens, sanitize each, rejoin
  const unionParts = normalized.split('|').map((part) => part.trim());

  const sanitizedParts = unionParts.map((part) => {
    // Keep string literals (quoted values)
    if (part.startsWith("'") || part.startsWith('"')) return part;
    // Keep null / undefined as-is
    if (part === 'null' || part === 'undefined') return part;

    // For complex generics like Partial<Record<...>>, Record<...>, ReturnType<...>
    // — keep if they start with a known safe base
    const baseToken = part.replace(/\[\]$/, '').split('<')[0]?.trim() ?? part;
    if (isKnownSafeType(baseToken)) return part;

    // Anything else is a library-internal named type — replace with `string`
    // so the generated code compiles without needing to import that type.
    return 'string';
  });

  return sanitizedParts.join(' | ');
}

function getPublicProperties(decl: CemDeclaration): CemProperty[] {
  if (!decl.members) return [];
  return decl.members
    .filter(
      (m) =>
        m.kind === 'field' &&
        !m.name.startsWith('_') &&
        !m.name.startsWith('#') &&
        m.name !== 'formAssociated',
    )
    .map((m) => ({
      name: m.name,
      type: m.type,
      description: m.description,
      default: m.default,
      attribute: m.attribute,
      reflects: m.reflects,
    }));
}

/**
 * Derives the component's directory name for import path resolution.
 * e.g. "src/components/hx-button/hx-button.ts" -> "hx-button"
 */
function getComponentDirFromModulePath(modulePath: string): string {
  // modulePath is like "src/components/hx-button/hx-button.ts"
  // or "src/components/hx-accordion/hx-accordion-item.ts"
  const parts = modulePath.split('/');
  // The component directory is always at index 2 (after src/components/)
  return parts[2] ?? dirname(modulePath);
}

function generateTypesFile(
  componentName: string,
  properties: CemProperty[],
  events: CemEvent[],
): string {
  const propLines: string[] = [];

  propLines.push('  /** Slot content (children) */');
  propLines.push('  children?: React.ReactNode;');
  propLines.push('  /** CSS class name */');
  propLines.push('  className?: string;');
  propLines.push('  /** Inline styles */');
  propLines.push('  style?: React.CSSProperties;');

  for (const prop of properties) {
    const safeDesc = (prop.description ?? '').replace(/\*\//g, '*\\/');
    const comment = safeDesc ? `  /** ${safeDesc} */\n` : '';
    const typeStr = sanitizeType(prop.type?.text);
    propLines.push(`${comment}  ${prop.name}?: ${typeStr};`);
  }

  if (events.length > 0) {
    propLines.push('');
    propLines.push('  // Event callbacks');
    for (const e of events) {
      const callbackName = toEventCallbackName(e.name);
      const desc = e.description ?? `Event: ${e.name}`;
      propLines.push(`  /** ${desc} */`);
      propLines.push(`  ${callbackName}?: (event: Event) => void;`);
    }
  }

  return `/**
 * TypeScript types for ${componentName} React wrapper.
 * Auto-generated by scripts/generate-react-wrappers.ts — DO NOT EDIT MANUALLY.
 */

import type React from 'react';

export interface ${componentName}Props {
${propLines.join('\n')}
}
`;
}

function generateComponentFile(
  decl: CemDeclaration,
  componentName: string,
  componentDir: string,
  events: CemEvent[],
): string {
  const tagName = decl.tagName!;
  // The actual Helix element class name (e.g. HelixButton)
  const elementClassName = decl.name;

  // Import path: @helixui/library/components/<dir>
  // Uses the wildcard exports map: "./components/*" -> "./dist/components/*/index.js"
  const elementImportPath = `@helixui/library/components/${componentDir}`;

  // When the CEM class name matches the React component name, alias the import
  // to avoid TypeScript declaration merge conflicts.
  const hasNameCollision = elementClassName === componentName;
  const importAlias = hasNameCollision ? `${elementClassName}Element` : elementClassName;
  const importStatement = hasNameCollision
    ? `import { ${elementClassName} as ${importAlias} } from '${elementImportPath}';`
    : `import { ${elementClassName} } from '${elementImportPath}';`;

  const eventMapEntries = events
    .map((e) => {
      const callbackName = toEventCallbackName(e.name);
      return `    ${callbackName}: '${e.name}'`;
    })
    .join(',\n');

  const eventMap = events.length > 0 ? `{\n${eventMapEntries}\n  }` : '{}';

  return `'use client';
/**
 * React wrapper for <${tagName}> web component.
 * Auto-generated by scripts/generate-react-wrappers.ts — DO NOT EDIT MANUALLY.
 * Re-run: pnpm --filter=@helixui/react run generate
 */

import React from 'react';
import { createComponent } from '@lit/react';
${importStatement}

import type { ${componentName}Props } from './types.js';

export type { ${componentName}Props };

/**
 * ${decl.description ?? `${componentName} web component wrapper for React.`}
 *
 * @example
 * \`\`\`tsx
 * import { ${componentName} } from '@helixui/react';
 *
 * <${componentName} />
 * \`\`\`
 */
export const ${componentName} = createComponent({
  tagName: '${tagName}',
  elementClass: ${importAlias},
  react: React,
  events: ${eventMap},
  displayName: '${componentName}',
});

export default ${componentName};
`;
}

function generateComponentIndex(componentName: string): string {
  return `export { ${componentName}, default } from './${componentName}.js';
export type { ${componentName}Props } from './types.js';
`;
}

// --- Main ---
function main(): void {
  if (!existsSync(cemPath)) {
    console.error(`ERROR: CEM not found at ${cemPath}`);
    console.error('Run: pnpm --filter=@helixui/library run build');
    process.exit(1);
  }

  const cem: Cem = JSON.parse(readFileSync(cemPath, 'utf-8'));

  interface ComponentEntry {
    decl: CemDeclaration;
    modulePath: string;
  }

  const components: ComponentEntry[] = [];

  for (const module of cem.modules ?? []) {
    for (const decl of module.declarations ?? []) {
      if (decl.customElement && decl.tagName && decl.kind === 'class') {
        components.push({ decl, modulePath: module.path });
      }
    }
  }

  console.log(`Found ${components.length} components in CEM`);

  mkdirSync(outputDir, { recursive: true });

  const allExports: string[] = [];

  for (const { decl, modulePath } of components) {
    const tagName = decl.tagName!;
    const componentName = toPascalCase(tagName);
    const componentDir = getComponentDirFromModulePath(modulePath);
    const properties = getPublicProperties(decl);
    const events = decl.events ?? [];

    const componentOutDir = resolve(outputDir, componentName);
    mkdirSync(componentOutDir, { recursive: true });

    // types.ts
    writeFileSync(
      resolve(componentOutDir, 'types.ts'),
      generateTypesFile(componentName, properties, events),
    );

    // <ComponentName>.ts
    writeFileSync(
      resolve(componentOutDir, `${componentName}.ts`),
      generateComponentFile(decl, componentName, componentDir, events),
    );

    // index.ts
    writeFileSync(resolve(componentOutDir, 'index.ts'), generateComponentIndex(componentName));

    allExports.push(componentName);
    console.log(`  Generated: ${componentName} (${tagName})`);
  }

  // Main src/index.ts
  const mainIndex =
    allExports
      .map((name) => `export { ${name}, type ${name}Props } from './components/${name}/index.js';`)
      .join('\n') + '\n';

  const srcDir = resolve(rootDir, 'packages/hx-react/src');
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(resolve(srcDir, 'index.ts'), mainIndex);

  console.log(`\nGenerated ${components.length} components`);
  console.log(`Main index: packages/hx-react/src/index.ts`);
}

main();
