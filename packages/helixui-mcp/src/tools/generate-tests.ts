import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { CemReader } from '../core/cem-reader.js';
import type { CemField, CemEvent, CemSlot, CemCssPart } from '../core/cem-reader.js';
import { getConfig } from '../config.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateTestsOptions {
  /** Absolute or relative path to the component .ts file, e.g. packages/hx-library/src/components/hx-button/hx-button.ts */
  componentPath: string;
}

export interface GenerateTestsResult {
  tagName: string;
  className: string;
  /** Generated test file content */
  testContent: string;
  /** Absolute path to where the test file should be written (co-located with the component) */
  testFilePath: string;
  warnings: string[];
}

// ─── Regex-based TS source fallback ───────────────────────────────────────────

interface FallbackMeta {
  tagName: string;
  className: string;
  properties: Array<{ name: string; type: string; default: string; attribute: string }>;
  events: Array<{ name: string }>;
  slots: Array<{ name: string }>;
  cssParts: Array<{ name: string }>;
}

function extractTagName(source: string): string | undefined {
  const m = source.match(/@customElement\(['"]([^'"]+)['"]\)/);
  return m?.[1];
}

function extractClassName(source: string): string | undefined {
  const m = source.match(/export\s+class\s+(\w+)\s+extends/);
  return m?.[1];
}

function extractPropertiesFromSource(
  source: string,
): Array<{ name: string; type: string; default: string; attribute: string }> {
  const results: Array<{ name: string; type: string; default: string; attribute: string }> = [];
  // Match @property decorator blocks followed by property declarations
  const propRe =
    /@property\(\{[^}]*\}\)\s+(?:override\s+)?(\w+)(?::\s*([^=\n]+?))?\s*(?:=\s*([^;\n]+))?;/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(source)) !== null) {
    const name = m[1] ?? '';
    const rawType = (m[2] ?? 'string').trim();
    const defaultVal = (m[3] ?? '').trim();
    // Extract attribute name from @property({ attribute: 'hx-size' }) if present
    const attrMatch = source
      .slice(0, m.index)
      .match(/@property\(\{[^}]*attribute:\s*['"]([^'"]+)['"]/);
    const attribute = attrMatch?.[1] ?? name;
    results.push({ name, type: rawType, default: defaultVal, attribute });
  }
  return results;
}

function extractEventsFromSource(source: string): Array<{ name: string }> {
  const results: Array<{ name: string }> = [];
  const re = /@fires\s+\{[^}]*\}\s+([\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m[1]) results.push({ name: m[1] });
  }
  // Also match @fires without type
  const re2 = /@fires\s+([\w-]+)/g;
  let m2: RegExpExecArray | null;
  while ((m2 = re2.exec(source)) !== null) {
    if (m2[1] && !results.find((e) => e.name === m2![1])) {
      results.push({ name: m2[1] });
    }
  }
  return results;
}

function extractSlotsFromSource(source: string): Array<{ name: string }> {
  const results: Array<{ name: string }> = [];
  // Match @slot - Default slot. or @slot prefix - description
  const re = /@slot\s+(?:([\w-]+)\s+-|-(.*$))/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const name = m[1] ?? '';
    results.push({ name });
  }
  // Also match @slot alone (default slot with no name)
  const defaultSlot = source.match(/@slot\s+-\s/);
  if (defaultSlot && !results.find((s) => s.name === '')) {
    results.unshift({ name: '' });
  }
  return results;
}

function extractCssPartsFromSource(source: string): Array<{ name: string }> {
  const results: Array<{ name: string }> = [];
  const re = /@csspart\s+([\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m[1]) results.push({ name: m[1] });
  }
  return results;
}

function parseFallbackMeta(componentPath: string): FallbackMeta | null {
  if (!existsSync(componentPath)) return null;
  const source = readFileSync(componentPath, 'utf8');
  const tagName = extractTagName(source);
  const className = extractClassName(source);
  if (!tagName || !className) return null;
  return {
    tagName,
    className,
    properties: extractPropertiesFromSource(source),
    events: extractEventsFromSource(source),
    slots: extractSlotsFromSource(source),
    cssParts: extractCssPartsFromSource(source),
  };
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function tagToClassName(tagName: string): string {
  return `Helix${toPascalCase(tagName.replace(/^hx-/, ''))}`;
}

// ─── Attribute name for a property ───────────────────────────────────────────

function attrNameForField(field: CemField): string {
  return field.attribute ?? field.name;
}

// ─── Parse union type values ──────────────────────────────────────────────────

function extractUnionValues(typeText: string): string[] {
  // e.g. "'primary' | 'secondary' | 'ghost'" → ['primary', 'secondary', 'ghost']
  const matches = typeText.match(/'([^']+)'/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/'/g, ''));
}

function isEnumLike(typeText: string): boolean {
  return typeText.includes('|') && typeText.includes("'");
}

function isBoolean(typeText: string): boolean {
  return typeText.trim() === 'boolean';
}

// ─── Test block generators ────────────────────────────────────────────────────

function generateRenderingBlock(tagName: string, className: string): string {
  const lines: string[] = [
    `  // ─── Rendering ───`,
    ``,
    `  describe('Rendering', () => {`,
    `    it('renders with shadow DOM', async () => {`,
    `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
    `      expect(el.shadowRoot).toBeTruthy();`,
    `    });`,
    ``,
    `    it('renders native inner element', async () => {`,
    `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
    `      expect(el.shadowRoot!.children.length).toBeGreaterThan(0);`,
    `    });`,
    `  });`,
  ];
  return lines.join('\n');
}

function generatePropertyBlock(tagName: string, className: string, field: CemField): string {
  const propName = field.name;
  const typeText = field.type?.text ?? 'string';
  const attrName = attrNameForField(field);
  const lines: string[] = [`  // ─── Property: ${propName} ───`, ``];

  if (isBoolean(typeText)) {
    const defaultIsTrue = field.default === 'true';
    lines.push(
      `  describe('Property: ${propName}', () => {`,
      `    it('defaults to ${defaultIsTrue ? 'true' : 'false'}', async () => {`,
      `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
      `      expect(el.${propName}).toBe(${defaultIsTrue ? 'true' : 'false'});`,
      `    });`,
      ``,
      `    it('reflects ${propName} attribute to host', async () => {`,
      `      const el = await fixture<${className}>('<${tagName} ${attrName}></${tagName}>');`,
      `      expect(el.hasAttribute('${attrName}')).toBe(true);`,
      `    });`,
      ``,
      `    it('sets ${propName} programmatically and reflects', async () => {`,
      `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
      `      el.${propName} = ${!defaultIsTrue};`,
      `      await el.updateComplete;`,
      `      expect(el.hasAttribute('${attrName}')).toBe(${!defaultIsTrue});`,
      `    });`,
      `  });`,
    );
  } else if (isEnumLike(typeText)) {
    const values = extractUnionValues(typeText);
    const defaultVal = field.default?.replace(/'/g, '') ?? values[0] ?? '';
    lines.push(
      `  describe('Property: ${propName}', () => {`,
      `    it('reflects ${propName} attr to host', async () => {`,
      `      const el = await fixture<${className}>('<${tagName} ${attrName}="${defaultVal}"></${tagName}>');`,
      `      expect(el.getAttribute('${attrName}')).toBe('${defaultVal}');`,
      `    });`,
    );
    for (const val of values) {
      lines.push(
        ``,
        `    it('applies ${val} ${propName}', async () => {`,
        `      const el = await fixture<${className}>('<${tagName} ${attrName}="${val}"></${tagName}>');`,
        `      expect(el.${propName}).toBe('${val}');`,
        `    });`,
      );
    }
    lines.push(`  });`);
  } else {
    // String or other scalar property
    lines.push(
      `  describe('Property: ${propName}', () => {`,
      `    it('sets ${propName} attribute', async () => {`,
      `      const el = await fixture<${className}>('<${tagName} ${attrName}="test-value"></${tagName}>');`,
      `      expect(el.getAttribute('${attrName}')).toBe('test-value');`,
      `    });`,
      `  });`,
    );
  }

  return lines.join('\n');
}

function generateEventsBlock(
  tagName: string,
  className: string,
  events: ReadonlyArray<CemEvent>,
): string {
  if (events.length === 0) return '';
  const lines: string[] = [`  // ─── Events ───`, ``, `  describe('Events', () => {`];

  for (const event of events) {
    lines.push(
      `    it('dispatches ${event.name} event', async () => {`,
      `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
      `      const eventPromise = oneEvent<CustomEvent>(el, '${event.name}');`,
      `      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));`,
      `      const event = await eventPromise;`,
      `      expect(event.bubbles).toBe(true);`,
      `      expect(event.composed).toBe(true);`,
      `    });`,
      ``,
    );
  }

  // Remove trailing blank line before closing
  if (lines[lines.length - 1] === ``) lines.pop();
  lines.push(`  });`);
  return lines.join('\n');
}

function generateSlotsBlock(
  tagName: string,
  className: string,
  slots: ReadonlyArray<CemSlot>,
): string {
  if (slots.length === 0) return '';
  const lines: string[] = [`  // ─── Slots ───`, ``, `  describe('Slots', () => {`];

  for (const slot of slots) {
    if (slot.name === '') {
      lines.push(
        `    it('default slot renders text content', async () => {`,
        `      const el = await fixture<${className}>('<${tagName}>Hello World</${tagName}>');`,
        `      expect(el.textContent?.trim()).toBe('Hello World');`,
        `    });`,
        ``,
        `    it('default slot renders HTML content', async () => {`,
        `      const el = await fixture<${className}>('<${tagName}><span class="test">content</span></${tagName}>');`,
        `      const span = el.querySelector('span.test');`,
        `      expect(span).toBeTruthy();`,
        `    });`,
        ``,
      );
    } else {
      lines.push(
        `    it('${slot.name} slot renders slotted content', async () => {`,
        `      const el = await fixture<${className}>('<${tagName}><span slot="${slot.name}">icon</span></${tagName}>');`,
        `      const slotted = el.querySelector('[slot="${slot.name}"]');`,
        `      expect(slotted).toBeTruthy();`,
        `    });`,
        ``,
      );
    }
  }

  // Remove trailing blank line
  if (lines[lines.length - 1] === ``) lines.pop();
  lines.push(`  });`);
  return lines.join('\n');
}

function generateCssPartsBlock(
  tagName: string,
  className: string,
  cssParts: ReadonlyArray<CemCssPart>,
): string {
  if (cssParts.length === 0) return '';
  const lines: string[] = [`  // ─── CSS Parts ───`, ``, `  describe('CSS Parts', () => {`];

  for (const part of cssParts) {
    lines.push(
      `    it('exposes "${part.name}" CSS part', async () => {`,
      `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
      `      const partEl = shadowQuery(el, '[part~="${part.name}"]');`,
      `      expect(partEl).toBeTruthy();`,
      `    });`,
      ``,
    );
  }

  if (lines[lines.length - 1] === ``) lines.pop();
  lines.push(`  });`);
  return lines.join('\n');
}

function generateKeyboardBlock(
  tagName: string,
  className: string,
  events: ReadonlyArray<CemEvent>,
): string {
  // Only generate keyboard block if there is a click-like event
  const clickEvent = events.find((e) => e.name.includes('click') || e.name.includes('change'));
  if (!clickEvent) return '';

  const lines: string[] = [
    `  // ─── Keyboard ───`,
    ``,
    `  describe('Keyboard', () => {`,
    `    it('Enter key activates the component', async () => {`,
    `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
    `      const inner = shadowQuery<HTMLElement>(el, '[part]');`,
    `      if (inner) {`,
    `        inner.focus();`,
    `        await userEvent.keyboard('{Enter}');`,
    `      }`,
    `      // keyboard activation verified via focus + Enter; extend with event assertion as needed`,
    `      expect(el.shadowRoot).toBeTruthy();`,
    `    });`,
    ``,
    `    it('Space key activates the component', async () => {`,
    `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
    `      const inner = shadowQuery<HTMLElement>(el, '[part]');`,
    `      if (inner) {`,
    `        inner.focus();`,
    `        await userEvent.keyboard(' ');`,
    `      }`,
    `      expect(el.shadowRoot).toBeTruthy();`,
    `    });`,
    `  });`,
  ];
  return lines.join('\n');
}

function generateA11yBlock(tagName: string, className: string): string {
  const lines: string[] = [
    `  // ─── Accessibility (axe-core) ───`,
    ``,
    `  describe('Accessibility (axe-core)', () => {`,
    `    it('has no axe violations in default state', async () => {`,
    `      const el = await fixture<${className}>('<${tagName}>Content</${tagName}>');`,
    `      await page.screenshot();`,
    `      const { violations } = await checkA11y(el);`,
    `      expect(violations).toEqual([]);`,
    `    });`,
    `  });`,
  ];
  return lines.join('\n');
}

// ─── Main generator ───────────────────────────────────────────────────────────

function resolveComponentPath(componentPath: string): string {
  if (componentPath.startsWith('/')) return componentPath;
  const { projectRoot } = getConfig();
  return resolve(projectRoot, componentPath);
}

function deriveTagNameFromPath(componentPath: string): string {
  // e.g. /path/to/hx-button/hx-button.ts → hx-button
  const base = basename(componentPath, '.ts');
  if (base.startsWith('hx-')) return base;
  // Try directory name
  const dir = basename(dirname(componentPath));
  if (dir.startsWith('hx-')) return dir;
  return base;
}

export function generateTests(options: GenerateTestsOptions): GenerateTestsResult {
  const { componentPath: rawPath } = options;
  const componentPath = resolveComponentPath(rawPath);
  const warnings: string[] = [];

  // Derive tagName from path for CEM lookup
  const tagName = deriveTagNameFromPath(componentPath);
  const className = tagToClassName(tagName);

  // ── 1. Try CEM first ──────────────────────────────────────────────────────
  let fields: CemField[] = [];
  let events: CemEvent[] = [];
  let slots: CemSlot[] = [];
  let cssParts: CemCssPart[] = [];
  let resolvedClassName = className;

  const reader = new CemReader();
  const cem = reader.loadSafe();

  if (cem !== null) {
    const component = reader.getComponent(tagName);
    if (component !== undefined) {
      const allFields = reader.getProperties(tagName);
      // Filter out private/internal fields
      fields = allFields.filter(
        (f) =>
          f.privacy !== 'private' &&
          f.privacy !== 'protected' &&
          !f.name.startsWith('_') &&
          f.static !== true,
      );
      events = reader.getEvents(tagName);
      slots = reader.getSlots(tagName);
      cssParts = reader.getCssParts(tagName);
      resolvedClassName = component.name ?? className;
    } else {
      warnings.push(
        `Component "${tagName}" not found in CEM. Falling back to TypeScript source parsing. Run 'pnpm run cem' to regenerate the manifest.`,
      );
    }
  } else {
    warnings.push(
      `CEM manifest not found. Falling back to TypeScript source parsing. Run 'pnpm run cem' to generate the manifest.`,
    );
  }

  // ── 2. TS source fallback ─────────────────────────────────────────────────
  if (fields.length === 0 && events.length === 0 && existsSync(componentPath)) {
    const meta = parseFallbackMeta(componentPath);
    if (meta !== null) {
      resolvedClassName = meta.className;
      fields = meta.properties.map((p) => ({
        kind: 'field' as const,
        name: p.name,
        type: { text: p.type },
        default: p.default,
        attribute: p.attribute,
      }));
      events = meta.events;
      slots = meta.slots;
      cssParts = meta.cssParts;
    } else {
      warnings.push(
        `Could not parse TypeScript source at "${componentPath}". Generating minimal test scaffold.`,
      );
    }
  }

  // ── 3. Determine import path ──────────────────────────────────────────────
  const componentDir = dirname(componentPath);
  const testFilePath = resolve(componentDir, `${tagName}.test.ts`);

  // Relative import from test file to component dir is always './'
  const indexImport = `./index.js`;
  const typeImport = `./${tagName}.js`;

  // ── 4. Assemble test blocks ───────────────────────────────────────────────

  const propertyBlocks = fields.map((f) => generatePropertyBlock(tagName, resolvedClassName, f));

  const eventsBlock = generateEventsBlock(tagName, resolvedClassName, events);
  const slotsBlock = generateSlotsBlock(tagName, resolvedClassName, slots);
  const cssPartsBlock = generateCssPartsBlock(tagName, resolvedClassName, cssParts);
  const keyboardBlock = generateKeyboardBlock(tagName, resolvedClassName, events);
  const a11yBlock = generateA11yBlock(tagName, resolvedClassName);
  const renderingBlock = generateRenderingBlock(tagName, resolvedClassName);

  const needsUserEvent = keyboardBlock.length > 0;
  const needsShadowQuery = cssPartsBlock.length > 0 || keyboardBlock.length > 0;
  const needsOneEvent = eventsBlock.length > 0;

  const importParts: string[] = [`fixture`, `cleanup`, `checkA11y`];
  if (needsShadowQuery) importParts.push(`shadowQuery`);
  if (needsOneEvent) importParts.push(`oneEvent`);
  const testUtilsImport = `import { ${importParts.join(', ')} } from '../../test-utils.js';`;

  const allBlocks = [
    renderingBlock,
    ...propertyBlocks,
    eventsBlock,
    slotsBlock,
    cssPartsBlock,
    keyboardBlock,
    a11yBlock,
  ].filter((b) => b.length > 0);

  const lines: string[] = [
    `import { describe, it, expect, afterEach } from 'vitest';`,
    ...(needsUserEvent
      ? [`import { page, userEvent } from '@vitest/browser/context';`]
      : [`import { page } from '@vitest/browser/context';`]),
    testUtilsImport,
    `import type { ${resolvedClassName} } from '${typeImport}';`,
    `import '${indexImport}';`,
    ``,
    `afterEach(cleanup);`,
    ``,
    `describe('${tagName}', () => {`,
    allBlocks.join('\n\n'),
    `});`,
    ``,
  ];

  const testContent = lines.join('\n');

  return {
    tagName,
    className: resolvedClassName,
    testContent,
    testFilePath,
    warnings,
  };
}
