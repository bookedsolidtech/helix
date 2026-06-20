#!/usr/bin/env tsx
/**
 * Auto-generates React wrapper components from the HELiX Custom Elements Manifest.
 *
 * Run modes:
 *   pnpm exec tsx scripts/generate-react-wrappers.ts            # write wrappers
 *   pnpm exec tsx scripts/generate-react-wrappers.ts --check    # dry-run, diff only
 *
 * Determinism contract:
 *   - Components are sorted by tagName ascending before iteration
 *   - Main index exports are sorted alphabetically by component name
 *   - Re-running the generator against the same CEM produces byte-identical output
 *
 * Safety contract:
 *   - Declarations missing required fields (name, valid tagName, component dir)
 *     are logged with console.warn and skipped; the generator never throws
 *   - Orphan directories (present on disk, absent from CEM) are logged but not deleted
 *   - --check never touches packages/hx-react/src; it generates to a temp dir and diffs
 *
 * Generates packages/hx-react/src/components/<ComponentName>/index.ts for each component.
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  rmSync,
} from 'fs';
import { execSync } from 'child_process';
import { resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');
const cemPath = resolve(rootDir, 'packages/hx-library/custom-elements.json');
const realSrcDir = resolve(rootDir, 'packages/hx-react/src');
const realOutputDir = resolve(realSrcDir, 'components');

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

/** Matches a valid hx-* custom element tag name. */
const TAG_NAME_PATTERN = /^hx-[a-z][a-z0-9-]*$/;

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

  // Function/callback types like `(html: string) => string`. The union split below
  // would tear the signature at its `=>` / `|` boundaries and collapse it to `string`,
  // producing a wrapper prop that rejects every valid value. Preserve the signature
  // verbatim when it is SIMPLE (no generics/object literals) and every annotated type
  // is a known-safe builtin; drop a trailing optional `| undefined`/`| null` since the
  // generated `?` already encodes optionality. Anything more exotic falls back to the
  // prior `string` behavior so the generated code still compiles.
  if (normalized.includes('=>')) {
    const fnType = normalized.replace(/\s*\|\s*(?:undefined|null)\s*$/, '').trim();
    const annotatedTypes = [...fnType.matchAll(/(?::|=>)\s*([\w.]+(?:\[\])?)/g)].map(
      (m) => m[1] ?? '',
    );
    if (
      !/[<{]/.test(fnType) &&
      annotatedTypes.length > 0 &&
      annotatedTypes.every(isKnownSafeType)
    ) {
      return fnType;
    }
    return 'string';
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
 * Returns an empty string if the path does not resolve to a component directory.
 */
function getComponentDirFromModulePath(modulePath: string): string {
  // modulePath is like "src/components/hx-button/hx-button.ts"
  // or "src/components/hx-accordion/hx-accordion-item.ts"
  const parts = modulePath.split('/');
  // The component directory is always at index 2 (after src/components/)
  return parts[2] ?? '';
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
  tagName: string,
  events: CemEvent[],
): string {
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

interface ComponentEntry {
  decl: CemDeclaration;
  modulePath: string;
  tagName: string;
  componentName: string;
  componentDir: string;
}

interface CollectedComponents {
  components: ComponentEntry[];
  skipped: { reason: string; tagName: string | undefined; name: string | undefined }[];
}

/**
 * Walks the CEM and collects valid component entries, skipping any that fail guards.
 * Returns entries sorted deterministically by tagName ascending.
 */
function collectComponents(cem: Cem): CollectedComponents {
  const components: ComponentEntry[] = [];
  const skipped: CollectedComponents['skipped'] = [];

  for (const module of cem.modules ?? []) {
    for (const decl of module.declarations ?? []) {
      // Base predicate: must be a custom element class declaration
      if (!decl.customElement || !decl.tagName || decl.kind !== 'class') {
        continue;
      }

      // Guard: decl.name must be a non-empty string
      if (typeof decl.name !== 'string' || decl.name.trim() === '') {
        console.warn(
          `SKIP: tagName=${decl.tagName} — missing or empty decl.name in CEM (module: ${module.path})`,
        );
        skipped.push({
          reason: 'missing-name',
          tagName: decl.tagName,
          name: decl.name,
        });
        continue;
      }

      // Guard: tagName must match hx-* pattern
      if (!TAG_NAME_PATTERN.test(decl.tagName)) {
        console.warn(
          `SKIP: tagName=${decl.tagName} — does not match /^hx-[a-z][a-z0-9-]*$/ (module: ${module.path})`,
        );
        skipped.push({
          reason: 'invalid-tag-name',
          tagName: decl.tagName,
          name: decl.name,
        });
        continue;
      }

      // Guard: modulePath must yield a non-empty component directory segment
      const componentDir = getComponentDirFromModulePath(module.path);
      if (componentDir === '') {
        console.warn(
          `SKIP: tagName=${decl.tagName} — could not derive component directory from modulePath "${module.path}"`,
        );
        skipped.push({
          reason: 'invalid-module-path',
          tagName: decl.tagName,
          name: decl.name,
        });
        continue;
      }

      components.push({
        decl,
        modulePath: module.path,
        tagName: decl.tagName,
        componentName: toPascalCase(decl.tagName),
        componentDir,
      });
    }
  }

  // Deterministic ordering: sort by tagName ascending.
  components.sort((a, b) => (a.tagName < b.tagName ? -1 : a.tagName > b.tagName ? 1 : 0));

  return { components, skipped };
}

/**
 * Writes all generated wrapper files for the given components under `targetSrcDir`.
 * Layout:
 *   <targetSrcDir>/components/<ComponentName>/{types.ts, <ComponentName>.ts, index.ts}
 *   <targetSrcDir>/index.ts
 */
function writeAllWrappers(components: ComponentEntry[], targetSrcDir: string): void {
  const targetComponentsDir = resolve(targetSrcDir, 'components');
  mkdirSync(targetComponentsDir, { recursive: true });

  for (const entry of components) {
    const { decl, componentName, componentDir, tagName } = entry;
    const properties = getPublicProperties(decl);
    const events = decl.events ?? [];

    const componentOutDir = resolve(targetComponentsDir, componentName);
    mkdirSync(componentOutDir, { recursive: true });

    writeFileSync(
      resolve(componentOutDir, 'types.ts'),
      generateTypesFile(componentName, properties, events),
    );

    writeFileSync(
      resolve(componentOutDir, `${componentName}.ts`),
      generateComponentFile(decl, componentName, componentDir, tagName, events),
    );

    writeFileSync(resolve(componentOutDir, 'index.ts'), generateComponentIndex(componentName));
  }

  // Main src/index.ts — sort exports alphabetically by component name to guarantee
  // stable diffs on re-runs regardless of CEM module emit order.
  const sortedNames = components.map((c) => c.componentName).sort();
  const mainIndex =
    sortedNames
      .map((name) => `export { ${name}, type ${name}Props } from './components/${name}/index.js';`)
      .join('\n') + '\n';

  mkdirSync(targetSrcDir, { recursive: true });
  writeFileSync(resolve(targetSrcDir, 'index.ts'), mainIndex);
}

/**
 * Runs Prettier against the generated tree so output matches committed formatting.
 *
 * Passes --config explicitly so the formatting is identical whether the target tree
 * lives inside the repo (write mode) or in a system temp directory (--check mode).
 * Without --config, prettier's auto-discovery only walks up from the target tree and
 * would fall back to built-in defaults when the target is outside the repo.
 */
function formatTree(targetSrcDir: string): void {
  const prettierConfig = resolve(rootDir, '.prettierrc');
  execSync(`prettier --config "${prettierConfig}" --write "${targetSrcDir}"`, {
    cwd: rootDir,
    stdio: 'inherit',
  });
}

/**
 * After a write, compare the PascalCase component directories on disk under
 * packages/hx-react/src/components/ against the freshly generated set. Warn for
 * any directory that exists on disk but is not in the CEM output. Never deletes.
 */
function reportOrphanDirectories(generated: ComponentEntry[], componentsDir: string): string[] {
  if (!existsSync(componentsDir)) return [];

  const generatedNames = new Set(generated.map((c) => c.componentName));
  const orphans: string[] = [];
  for (const entry of readdirSync(componentsDir)) {
    const abs = resolve(componentsDir, entry);
    if (!statSync(abs).isDirectory()) continue;
    if (!generatedNames.has(entry)) {
      const relPath = relative(rootDir, abs);
      console.warn(`ORPHAN: ${relPath} — present on disk, absent from CEM`);
      orphans.push(entry);
    }
  }
  return orphans;
}

/**
 * Recursively walks a directory and returns a map of relative-path -> file contents.
 * Skips node_modules and dist defensively; the trees we compare do not contain these,
 * but the guard protects against accidental expansion of scope.
 */
function snapshotTree(root: string): Map<string, string> {
  const snapshot = new Map<string, string>();
  if (!existsSync(root)) return snapshot;

  function walk(dir: string): void {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name === 'dist') continue;
      const abs = resolve(dir, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        walk(abs);
      } else if (st.isFile()) {
        const rel = relative(root, abs);
        snapshot.set(rel, readFileSync(abs, 'utf-8'));
      }
    }
  }

  walk(root);
  return snapshot;
}

interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
}

function diffSnapshots(expected: Map<string, string>, actual: Map<string, string>): DiffResult {
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const [path, content] of expected) {
    const actualContent = actual.get(path);
    if (actualContent === undefined) {
      added.push(path);
    } else if (actualContent !== content) {
      changed.push(path);
    }
  }
  for (const path of actual.keys()) {
    if (!expected.has(path)) {
      removed.push(path);
    }
  }

  added.sort();
  removed.sort();
  changed.sort();
  return { added, removed, changed };
}

interface RunOptions {
  check: boolean;
}

function parseArgs(argv: string[]): RunOptions {
  const check = argv.includes('--check');
  return { check };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));

  if (!existsSync(cemPath)) {
    console.error(`ERROR: CEM not found at ${cemPath}`);
    console.error('Run: pnpm --filter=@helixui/library run build');
    process.exit(1);
  }

  const cem: Cem = JSON.parse(readFileSync(cemPath, 'utf-8'));
  const { components, skipped } = collectComponents(cem);

  console.log(`Found ${components.length} components in CEM`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} declaration(s) due to guard failures`);
  }

  if (options.check) {
    // --- Dry-run / drift detection ---
    // Generate to a temp directory, format it with the same prettier config, then
    // compare against the real tree. Never touches packages/hx-react/src.
    const tempRoot = resolve(
      tmpdir(),
      `hx-react-wrappers-check-${process.pid}-${Date.now().toString(36)}`,
    );
    const tempSrcDir = resolve(tempRoot, 'src');

    try {
      mkdirSync(tempSrcDir, { recursive: true });
      writeAllWrappers(components, tempSrcDir);
      formatTree(tempSrcDir);

      const expected = snapshotTree(tempSrcDir);
      // Only compare the subset of the real src tree that the generator owns:
      // src/index.ts and everything under src/components/.
      const actualAll = snapshotTree(realSrcDir);
      const actual = new Map<string, string>();
      for (const [path, content] of actualAll) {
        if (path === 'index.ts' || path.startsWith(`components/`)) {
          actual.set(path, content);
        }
      }

      const diff = diffSnapshots(expected, actual);
      const hasDiff = diff.added.length + diff.removed.length + diff.changed.length > 0;

      if (!hasDiff) {
        console.log('\nOK: generator output matches committed tree (--check passed)');
        process.exit(0);
      }

      console.error('\nDRIFT: generator output differs from committed tree.');
      if (diff.added.length > 0) {
        console.error(`  Missing from disk (${diff.added.length}):`);
        for (const p of diff.added) console.error(`    + ${p}`);
      }
      if (diff.removed.length > 0) {
        console.error(`  Extra on disk (${diff.removed.length}):`);
        for (const p of diff.removed) console.error(`    - ${p}`);
      }
      if (diff.changed.length > 0) {
        console.error(`  Content differs (${diff.changed.length}):`);
        for (const p of diff.changed) console.error(`    ~ ${p}`);
      }
      console.error(
        '\nFix: run `pnpm --filter=@helixui/react run generate` and commit the result.',
      );
      process.exit(1);
    } finally {
      // Best-effort cleanup of the temp directory; do not fail the run on cleanup errors.
      try {
        rmSync(tempRoot, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
    return;
  }

  // --- Write mode ---
  mkdirSync(realOutputDir, { recursive: true });
  writeAllWrappers(components, realSrcDir);

  for (const c of components) {
    console.log(`  Generated: ${c.componentName} (${c.tagName})`);
  }

  console.log(`\nGenerated ${components.length} components`);
  console.log(`Main index: packages/hx-react/src/index.ts`);

  console.log('\nFormatting generated files with Prettier...');
  formatTree(realSrcDir);
  console.log('Done.');

  const orphans = reportOrphanDirectories(components, realOutputDir);
  if (orphans.length > 0) {
    console.warn(`\n${orphans.length} orphan director${orphans.length === 1 ? 'y' : 'ies'} found.`);
    console.warn('These directories are present on disk but absent from the current CEM.');
    console.warn(
      'Not deleted automatically. Remove manually if the component was intentionally retired.',
    );
  }
}

main();
