import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { CemReader } from '../core/cem-reader.js';
import type {
  CemField,
  CemEvent,
  CemSlot,
  CemCssPart,
  CemCssProperty,
} from '../core/cem-reader.js';
import { getConfig } from '../config.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerateDocsOptions {
  /** Absolute or relative path to the component .ts file, e.g. packages/hx-library/src/components/hx-button/hx-button.ts */
  componentPath: string;
}

export interface GenerateDocsResult {
  tagName: string;
  className: string;
  /** Generated Storybook story file content */
  storiesContent: string;
  /** Generated Drupal Twig template content */
  twigContent: string;
  /** Absolute path to where the stories file should be written (co-located with the component) */
  storiesFilePath: string;
  /** Absolute path to where the Twig file should be written (co-located with the component) */
  twigFilePath: string;
  warnings: string[];
}

// ─── Regex-based TS source fallback ───────────────────────────────────────────

interface FallbackDocMeta {
  tagName: string;
  className: string;
  description: string;
  properties: Array<{
    name: string;
    type: string;
    default: string;
    attribute: string;
    description: string;
  }>;
  events: Array<{ name: string; description: string }>;
  slots: Array<{ name: string; description: string }>;
  cssParts: Array<{ name: string; description: string }>;
  cssProperties: Array<{ name: string; default: string; description: string }>;
}

function extractTagName(source: string): string | undefined {
  const m = source.match(/@customElement\(['"]([^'"]+)['"]\)/);
  return m?.[1];
}

function extractClassName(source: string): string | undefined {
  const m = source.match(/export\s+class\s+(\w+)\s+extends/);
  return m?.[1];
}

function extractClassDescription(source: string): string {
  // Extract the leading JSDoc summary from the class
  const m = source.match(/\/\*\*[\s\S]*?@summary\s+([^\n*]+)/);
  return m?.[1]?.trim() ?? '';
}

function extractPropertiesFromSource(source: string): FallbackDocMeta['properties'] {
  const results: FallbackDocMeta['properties'] = [];
  const propRe =
    /@property\(\{[^}]*\}\)\s+(?:override\s+)?(\w+)(?::\s*([^=\n]+?))?\s*(?:=\s*([^;\n]+))?;/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(source)) !== null) {
    const name = m[1] ?? '';
    const rawType = (m[2] ?? 'string').trim();
    const defaultVal = (m[3] ?? '').trim();
    const beforeProp = source.slice(0, m.index);
    // Extract attribute
    const attrMatch = beforeProp.match(/@property\(\{[^}]*attribute:\s*['"]([^'"]+)['"]/);
    const attribute = attrMatch?.[1] ?? name;
    // Extract description from the JSDoc block directly before @property
    const docMatch = beforeProp.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*@property/);
    const description = docMatch
      ? (docMatch[1] ?? '')
          .replace(/\s*\*\s*/g, ' ')
          .replace(/@attr[^\n]*/g, '')
          .trim()
      : '';
    results.push({ name, type: rawType, default: defaultVal, attribute, description });
  }
  return results;
}

function extractEventsFromSource(source: string): FallbackDocMeta['events'] {
  const results: FallbackDocMeta['events'] = [];
  const re = /@fires\s+\{[^}]*\}\s+([\w-]+)\s+-\s+([^\n*]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    if (m[1]) results.push({ name: m[1], description: (m[2] ?? '').trim() });
  }
  const re2 = /@fires\s+([\w-]+)/g;
  let m2: RegExpExecArray | null;
  while ((m2 = re2.exec(source)) !== null) {
    if (m2[1] && !results.find((e) => e.name === m2![1])) {
      results.push({ name: m2[1], description: '' });
    }
  }
  return results;
}

function extractSlotsFromSource(source: string): FallbackDocMeta['slots'] {
  const results: FallbackDocMeta['slots'] = [];
  const re = /@slot\s+([\w-]*)\s*-\s*([^\n*@]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    results.push({ name: m[1] ?? '', description: (m[2] ?? '').trim() });
  }
  return results;
}

function extractCssPartsFromSource(source: string): FallbackDocMeta['cssParts'] {
  const results: FallbackDocMeta['cssParts'] = [];
  const re = /@csspart\s+([\w-]+)\s*-\s*([^\n*@]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    results.push({ name: m[1] ?? '', description: (m[2] ?? '').trim() });
  }
  return results;
}

function extractCssPropertiesFromSource(source: string): FallbackDocMeta['cssProperties'] {
  const results: FallbackDocMeta['cssProperties'] = [];
  const re = /@cssprop\s+\[([^=\]]+)(?:=([^\]]*))?\]\s*-\s*([^\n*@]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    results.push({
      name: (m[1] ?? '').trim(),
      default: (m[2] ?? '').trim(),
      description: (m[3] ?? '').trim(),
    });
  }
  return results;
}

function parseFallbackDocMeta(componentPath: string): FallbackDocMeta | null {
  if (!existsSync(componentPath)) return null;
  const source = readFileSync(componentPath, 'utf8');
  const tagName = extractTagName(source);
  const className = extractClassName(source);
  if (!tagName || !className) return null;
  return {
    tagName,
    className,
    description: extractClassDescription(source),
    properties: extractPropertiesFromSource(source),
    events: extractEventsFromSource(source),
    slots: extractSlotsFromSource(source),
    cssParts: extractCssPartsFromSource(source),
    cssProperties: extractCssPropertiesFromSource(source),
  };
}

// ─── Name helpers ─────────────────────────────────────────────────────────────

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function toTitleCase(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function tagToClassName(tagName: string): string {
  return `Helix${toPascalCase(tagName.replace(/^hx-/, ''))}`;
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

function extractUnionValues(typeText: string): string[] {
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

function storybookControlForType(typeText: string): string {
  if (isBoolean(typeText)) return `'boolean'`;
  if (isEnumLike(typeText)) return `{ type: 'select' }`;
  return `'text'`;
}

function attrNameForField(field: CemField): string {
  return field.attribute ?? field.name;
}

// ─── Story name from enum value ───────────────────────────────────────────────

function toStoryName(value: string): string {
  // 'primary' → 'Primary', 'my-value' → 'MyValue'
  return toPascalCase(value.replace(/[^a-zA-Z0-9-]/g, '-'));
}

// ─── Storybook stories generator ─────────────────────────────────────────────

function generateArgTypes(fields: ReadonlyArray<CemField>, slots: ReadonlyArray<CemSlot>): string {
  if (fields.length === 0) return '';

  const argTypeEntries: string[] = [];

  for (const field of fields) {
    const typeText = field.type?.text ?? 'string';
    const control = storybookControlForType(typeText);
    const description = field.description ?? '';
    const defaultSummary = field.default ?? '';
    const attrName = attrNameForField(field);

    let entry = `    ${field.name}: {\n`;
    entry += `      control: ${control},\n`;

    if (isEnumLike(typeText)) {
      const values = extractUnionValues(typeText);
      entry += `      options: [${values.map((v) => `'${v}'`).join(', ')}],\n`;
    }

    if (description) {
      entry += `      description: '${description.replace(/'/g, "\\'")}',\n`;
    }

    entry += `      table: {\n`;

    if (isBoolean(typeText)) {
      entry += `        category: 'State',\n`;
    } else if (attrName === 'variant' || attrName === 'hx-size' || attrName === 'size') {
      entry += `        category: 'Visual',\n`;
    } else {
      entry += `        category: 'Properties',\n`;
    }

    if (defaultSummary) {
      entry += `        defaultValue: { summary: '${defaultSummary.replace(/'/g, '')}' },\n`;
    }

    entry += `        type: { summary: '${typeText.replace(/'/g, "\\'")}' },\n`;
    entry += `      },\n`;
    entry += `    },`;
    argTypeEntries.push(entry);
  }

  // Add a label arg for slot content if there's a default slot
  const hasDefaultSlot = slots.some((s) => s.name === '');
  if (hasDefaultSlot) {
    argTypeEntries.push(
      `    label: {\n      control: 'text',\n      description: 'Default slot content (label text).',\n      table: {\n        category: 'Content',\n        type: { summary: 'string' },\n      },\n    },`,
    );
  }

  return argTypeEntries.join('\n');
}

function generateDefaultArgs(fields: ReadonlyArray<CemField>): string {
  const entries: string[] = [];
  for (const field of fields) {
    const rawDefault = (field.default ?? '').replace(/'/g, '');
    if (!rawDefault) continue;
    if (isBoolean(field.type?.text ?? '')) {
      entries.push(`    ${field.name}: ${rawDefault},`);
    } else {
      entries.push(`    ${field.name}: '${rawDefault}',`);
    }
  }
  return entries.join('\n');
}

function generateRenderArgs(fields: ReadonlyArray<CemField>, tagName: string): string {
  const attrLines: string[] = [];
  for (const field of fields) {
    const typeText = field.type?.text ?? 'string';
    const attrName = attrNameForField(field);
    if (isBoolean(typeText)) {
      attrLines.push(`      ?${attrName}=\${args.${field.name}}`);
    } else {
      attrLines.push(`      ${attrName}=\${args.${field.name}}`);
    }
  }
  const attrStr = attrLines.join('\n');
  return `  render: (args) => html\`\n    <${tagName}\n${attrStr}\n    >\n      \${args.label ?? '${toTitleCase(tagName.replace(/^hx-/, ''))}'}\n    </${tagName}>\n  \`,`;
}

function generateEnumVariantStories(fields: ReadonlyArray<CemField>, tagName: string): string[] {
  const stories: string[] = [];
  for (const field of fields) {
    const typeText = field.type?.text ?? '';
    if (!isEnumLike(typeText)) continue;
    const values = extractUnionValues(typeText);
    for (const val of values) {
      const storyExportName = toStoryName(val);
      const attrName = attrNameForField(field);
      stories.push(
        [
          `// ─── ${toTitleCase(field.name)}: ${val} ───`,
          ``,
          `export const ${storyExportName}: Story = {`,
          `  args: {`,
          `    ${field.name}: '${val}',`,
          `    label: '${toTitleCase(val)} Action',`,
          `  },`,
          `};`,
        ].join('\n'),
      );
    }
  }
  return stories;
}

function generateBooleanStateStories(fields: ReadonlyArray<CemField>, tagName: string): string[] {
  const stories: string[] = [];
  for (const field of fields) {
    const typeText = field.type?.text ?? '';
    if (!isBoolean(typeText)) continue;
    // Skip full/inverted style booleans (generate only interactive-state ones)
    if (field.name === 'full' || field.name === 'inverted') continue;
    const storyExportName = toStoryName(field.name);
    stories.push(
      [
        `// ─── State: ${field.name} ───`,
        ``,
        `export const ${storyExportName}: Story = {`,
        `  args: {`,
        `    ${field.name}: true,`,
        `    label: '${toTitleCase(field.name)}',`,
        `  },`,
        `};`,
      ].join('\n'),
    );
  }
  return stories;
}

function generatePlayInteractionStory(tagName: string, events: ReadonlyArray<CemEvent>): string {
  const clickEvent = events.find((e) => e.name.includes('click'));
  if (!clickEvent) return '';

  return [
    `// ─── Interaction: click fires ${clickEvent.name} ───`,
    ``,
    `export const InteractionClick: Story = {`,
    `  name: 'Interaction — click fires ${clickEvent.name}',`,
    `  args: {`,
    `    label: 'Click me',`,
    `  },`,
    `  play: async ({ canvasElement }) => {`,
    `    const el = canvasElement.querySelector('${tagName}');`,
    `    await expect(el).toBeTruthy();`,
    ``,
    `    const inner = el!.shadowRoot!.querySelector('button') ?? el!.shadowRoot!.querySelector('a');`,
    `    await expect(inner).toBeTruthy();`,
    ``,
    `    let eventFired = false;`,
    `    el!.addEventListener('${clickEvent.name}', () => { eventFired = true; });`,
    ``,
    `    await userEvent.click(inner!);`,
    `    await expect(eventFired).toBe(true);`,
    `  },`,
    `};`,
  ].join('\n');
}

function generateStoriesFile(
  tagName: string,
  className: string,
  description: string,
  fields: ReadonlyArray<CemField>,
  events: ReadonlyArray<CemEvent>,
  slots: ReadonlyArray<CemSlot>,
  cssParts: ReadonlyArray<CemCssPart>,
  cssProperties: ReadonlyArray<CemCssProperty>,
): string {
  const title = toTitleCase(tagName.replace(/^hx-/, ''));
  const hasEvents = events.length > 0;
  const hasClickEvent = events.some((e) => e.name.includes('click'));

  const imports = [
    `import type { Meta, StoryObj } from '@storybook/web-components';`,
    `import { html } from 'lit';`,
    ...(hasClickEvent ? [`import { expect, userEvent } from 'storybook/test';`] : []),
    `import './${tagName}.js';`,
  ].join('\n');

  const argTypesStr = generateArgTypes(fields, slots);
  const defaultArgsStr = generateDefaultArgs(fields);
  const renderArgsStr = generateRenderArgs(fields, tagName);

  const argTypesBlock = argTypesStr ? `  argTypes: {\n${argTypesStr}\n  },\n` : '';
  const defaultArgsBlock = defaultArgsStr ? `  args: {\n${defaultArgsStr}\n  },\n` : '';

  const metaLines = [
    `const meta = {`,
    `  title: 'Components/${title}',`,
    `  component: '${tagName}',`,
    `  tags: ['autodocs'],`,
    ...(description
      ? [
          `  parameters: {\n    docs: {\n      description: {\n        component: '${description.replace(/'/g, "\\'")}',\n      },\n    },\n  },`,
        ]
      : []),
    argTypesBlock.trimEnd(),
    defaultArgsBlock.trimEnd(),
    renderArgsStr,
    `} satisfies Meta;`,
  ]
    .filter((l) => l !== '')
    .join('\n');

  // Generate Default story with play function if there's a click event
  const defaultStory = hasClickEvent
    ? [
        `export const Default: Story = {`,
        `  args: {`,
        `    label: 'Schedule Appointment',`,
        `  },`,
        `  play: async ({ canvasElement }) => {`,
        `    const el = canvasElement.querySelector('${tagName}');`,
        `    await expect(el).toBeTruthy();`,
        ``,
        `    const inner = el!.shadowRoot!.querySelector('button') ?? el!.shadowRoot!.querySelector('a');`,
        `    await expect(inner).toBeTruthy();`,
        ``,
        `    let eventFired = false;`,
        `    const handler = () => { eventFired = true; };`,
        `    el!.addEventListener('${events.find((e) => e.name.includes('click'))!.name}', handler);`,
        ``,
        `    await userEvent.click(inner!);`,
        `    await expect(eventFired).toBe(true);`,
        ``,
        `    el!.removeEventListener('${events.find((e) => e.name.includes('click'))!.name}', handler);`,
        `  },`,
        `};`,
      ].join('\n')
    : [
        `export const Default: Story = {`,
        `  args: {`,
        `    label: '${title} content',`,
        `  },`,
        `};`,
      ].join('\n');

  const enumVariantStories = generateEnumVariantStories(fields, tagName);
  const booleanStateStories = generateBooleanStateStories(fields, tagName);
  const interactionStory = hasClickEvent ? generatePlayInteractionStory(tagName, events) : '';

  // CSS parts story
  const cssPartStory =
    cssParts.length > 0
      ? [
          `// ─── CSS Parts documentation ───`,
          ``,
          `export const CssPartsDemo: Story = {`,
          `  name: 'CSS Parts',`,
          `  render: () => html\``,
          `    <style>`,
          `      .parts-demo ${tagName}::part(${cssParts[0]?.name ?? 'button'}) {`,
          `        outline: 2px dashed var(--hx-color-primary-500);`,
          `        outline-offset: 2px;`,
          `      }`,
          `    </style>`,
          `    <div class="parts-demo">`,
          `      <${tagName}>Styled via CSS part</${tagName}>`,
          `    </div>`,
          `  \`,`,
          `};`,
        ].join('\n')
      : '';

  const allStoryBlocks = [
    `// ─── Default ───`,
    ``,
    defaultStory,
    ``,
    ...(enumVariantStories.length > 0
      ? [`// ─── Variant stories ───`, ``, ...enumVariantStories.map((s) => s + '\n')]
      : []),
    ...(booleanStateStories.length > 0
      ? [`// ─── State stories ───`, ``, ...booleanStateStories.map((s) => s + '\n')]
      : []),
    ...(interactionStory ? [interactionStory, ``] : []),
    ...(cssPartStory ? [cssPartStory, ``] : []),
  ].join('\n');

  return [
    imports,
    ``,
    `// ─────────────────────────────────────────────────`,
    `// Meta Configuration`,
    `// ─────────────────────────────────────────────────`,
    ``,
    metaLines,
    ``,
    `export default meta;`,
    `type Story = StoryObj;`,
    ``,
    `// ─────────────────────────────────────────────────`,
    `// Stories`,
    `// ─────────────────────────────────────────────────`,
    ``,
    allStoryBlocks,
  ].join('\n');
}

// ─── Twig template generator ──────────────────────────────────────────────────

function generateTwigTemplate(
  tagName: string,
  description: string,
  fields: ReadonlyArray<CemField>,
  slots: ReadonlyArray<CemSlot>,
  cssParts: ReadonlyArray<CemCssPart>,
  cssProperties: ReadonlyArray<CemCssProperty>,
): string {
  const title = toTitleCase(tagName.replace(/^hx-/, ''));
  const separator = '='.repeat(Math.max(40, tagName.length + 28));

  const paramDocs = fields.map((f) => {
    const typeText = (f.type?.text ?? 'string').replace(/'/g, '"');
    const defaultVal = f.default ?? '';
    const attrName = attrNameForField(f);
    const desc = f.description ? ` ${f.description}` : '';
    return `    ${attrName.padEnd(12)} (${typeText.padEnd(8)})${defaultVal ? ` Default: ${defaultVal}.` : ''}${desc}`;
  });

  const slotDocs = slots.map((s) => {
    const slotName = s.name === '' ? 'default' : s.name;
    const desc = s.description ?? '';
    return `    ${slotName.padEnd(12)} — ${desc || 'Slot content.'}`;
  });

  const partDocs =
    cssParts.length > 0
      ? cssParts.map(
          (p) => `    ${p.name.padEnd(12)} — ${p.description ?? 'CSS part for styling.'}`,
        )
      : [];

  const cssPropDocs =
    cssProperties.length > 0
      ? cssProperties.map(
          (p) =>
            `    ${p.name.padEnd(35)} — ${p.description ?? ''}${p.default ? ` (default: ${p.default})` : ''}`,
        )
      : [];

  const commentLines = [
    `{#`,
    `  ${tagName} — Drupal Twig Template`,
    `  ${separator}`,
    ``,
    ...(description ? [`  ${description}`, ``] : []),
    `  Parameters:`,
    ...paramDocs,
    `    attributes     (object  ) Optional. Additional HTML attributes passed through.`,
    ``,
    ...(slotDocs.length > 0 ? [`  Slots:`, ...slotDocs, ``] : []),
    ...(partDocs.length > 0 ? [`  CSS Parts (styleable via ::part()):`, ...partDocs, ``] : []),
    ...(cssPropDocs.length > 0 ? [`  CSS Custom Properties:`, ...cssPropDocs, ``] : []),
    `  Usage:`,
    `    {% include '${tagName}.twig' with {`,
    ...fields
      .filter((f) => {
        const defaultVal = (f.default ?? '').replace(/'/g, '');
        return defaultVal !== '';
      })
      .map((f) => {
        const attrName = attrNameForField(f);
        const typeText = f.type?.text ?? 'string';
        const defaultVal = (f.default ?? '').replace(/'/g, '');
        if (isBoolean(typeText)) {
          return `      ${attrName}: false,`;
        }
        return `      ${attrName}: '${defaultVal}',`;
      }),
    `      content: '${title} label',`,
    `    } %}`,
    `#}`,
  ];

  // Build attribute output lines for each property
  const booleanAttrs = fields.filter((f) => isBoolean(f.type?.text ?? ''));
  const stringAttrs = fields.filter((f) => !isBoolean(f.type?.text ?? ''));

  const attrOutputLines: string[] = [
    `  {% for key, val in attributes|default({}) %}{{ key }}="{{ val }}" {% endfor %}`,
  ];

  for (const field of stringAttrs) {
    const attrName = attrNameForField(field);
    attrOutputLines.push(
      `  {% if ${attrName} is defined and ${attrName} is not empty %}${attrName}="{{ ${attrName} }}"{% endif %}`,
    );
  }

  for (const field of booleanAttrs) {
    const attrName = attrNameForField(field);
    attrOutputLines.push(`  {% if ${attrName} is defined and ${attrName} %}${attrName}{% endif %}`);
  }

  // Slot blocks
  const hasDefaultSlot = slots.some((s) => s.name === '');
  const namedSlots = slots.filter((s) => s.name !== '');

  const slotLines: string[] = [];
  for (const slot of namedSlots) {
    slotLines.push(
      `  {%- block ${slot.name.replace(/-/g, '_')} %}`,
      `    {%- if ${slot.name.replace(/-/g, '_')} is defined %}<span slot="${slot.name}">{{ ${slot.name.replace(/-/g, '_')} }}</span>{% endif -%}`,
      `  {% endblock -%}`,
    );
  }
  if (hasDefaultSlot) {
    slotLines.push(`  {%- block default %}{{ content|default('') }}{% endblock -%}`);
  }

  const innerContent = slotLines.length > 0 ? slotLines.join('\n') : `  {{ content|default('') }}`;

  const templateLines = [
    ...commentLines,
    ``,
    `<${tagName}`,
    ...attrOutputLines,
    `>`,
    innerContent,
    `</${tagName}>`,
    ``,
  ];

  return templateLines.join('\n');
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

function resolveComponentPath(componentPath: string): string {
  if (componentPath.startsWith('/')) return componentPath;
  const { projectRoot } = getConfig();
  return resolve(projectRoot, componentPath);
}

function deriveTagNameFromPath(componentPath: string): string {
  const base = basename(componentPath, '.ts');
  if (base.startsWith('hx-')) return base;
  const dir = basename(dirname(componentPath));
  if (dir.startsWith('hx-')) return dir;
  return base;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateDocs(options: GenerateDocsOptions): GenerateDocsResult {
  const { componentPath: rawPath } = options;
  const componentPath = resolveComponentPath(rawPath);
  const warnings: string[] = [];

  const tagName = deriveTagNameFromPath(componentPath);
  const className = tagToClassName(tagName);

  // ── 1. Try CEM first ──────────────────────────────────────────────────────
  let fields: CemField[] = [];
  let events: CemEvent[] = [];
  let slots: CemSlot[] = [];
  let cssParts: CemCssPart[] = [];
  let cssProperties: CemCssProperty[] = [];
  let description = '';
  let resolvedClassName = className;

  const reader = new CemReader();
  const cem = reader.loadSafe();

  if (cem !== null) {
    const component = reader.getComponent(tagName);
    if (component !== undefined) {
      const allFields = reader.getProperties(tagName);
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
      cssProperties = reader.getCssProperties(tagName);
      description = component.description ?? '';
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
  if (fields.length === 0 && existsSync(componentPath)) {
    const meta = parseFallbackDocMeta(componentPath);
    if (meta !== null) {
      resolvedClassName = meta.className;
      description = meta.description;
      fields = meta.properties.map((p) => ({
        kind: 'field' as const,
        name: p.name,
        type: { text: p.type },
        default: p.default,
        attribute: p.attribute,
        description: p.description,
      }));
      events = meta.events;
      slots = meta.slots;
      cssParts = meta.cssParts;
      cssProperties = meta.cssProperties;
    } else {
      warnings.push(
        `Could not parse TypeScript source at "${componentPath}". Generating minimal story scaffold.`,
      );
    }
  }

  // ── 3. Output paths ───────────────────────────────────────────────────────
  const componentDir = dirname(componentPath);
  const storiesFilePath = resolve(componentDir, `${tagName}.stories.ts`);
  const twigFilePath = resolve(componentDir, `${tagName}.twig`);

  // ── 4. Generate content ───────────────────────────────────────────────────
  const storiesContent = generateStoriesFile(
    tagName,
    resolvedClassName,
    description,
    fields,
    events,
    slots,
    cssParts,
    cssProperties,
  );

  const twigContent = generateTwigTemplate(
    tagName,
    description,
    fields,
    slots,
    cssParts,
    cssProperties,
  );

  return {
    tagName,
    className: resolvedClassName,
    storiesContent,
    twigContent,
    storiesFilePath,
    twigFilePath,
    warnings,
  };
}
