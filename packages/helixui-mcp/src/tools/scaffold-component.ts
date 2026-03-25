import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CemReader } from '../core/cem-reader.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScaffoldComponentOptions {
  /** Component name without hx- prefix, e.g. "media-card" */
  name: string;
  /** Optional base component tag name to extend, e.g. "hx-card" */
  extends?: string;
  /** Optional directory path; when set, files are written to {outputDir}/hx-{name}/ */
  outputDir?: string;
}

export interface ScaffoldComponentResult {
  tagName: string;
  className: string;
  /** Map of relative file path to file content */
  files: Record<string, string>;
  /** Absolute path to the written directory, if outputDir was provided */
  outputDir?: string;
  warnings: string[];
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

function toStylesVarName(name: string): string {
  return `helix${toPascalCase(name)}Styles`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_NAME = /^[a-z][a-z0-9-]*$/;

function validateName(name: string): void {
  if (!VALID_NAME.test(name)) {
    throw new Error(
      `Invalid component name "${name}". Must be lowercase alphanumeric with hyphens, starting with a lowercase letter (e.g. "media-card").`,
    );
  }
}

function validateBase(baseTag: string): void {
  if (!baseTag.startsWith('hx-')) {
    throw new Error(
      `Invalid base component "${baseTag}". Only hx-* components from @helixui library may be extended.`,
    );
  }
}

// ─── File generators ──────────────────────────────────────────────────────────

function generateIndex(className: string, tagName: string): string {
  return `export { ${className} } from './${tagName}.js';\n`;
}

function generateComponentClass(
  tagName: string,
  className: string,
  stylesVar: string,
  baseTag?: string,
  baseSlots?: string[],
  baseEvents?: string[],
  baseCssParts?: string[],
): string {
  const hasBase = baseTag !== undefined;
  const baseClassName = hasBase ? tagToClassName(baseTag) : undefined;

  const slotDocs = (baseSlots ?? [])
    .map((s) =>
      s === '' ? ' * @slot - Default slot.' : ` * @slot ${s} - Inherited from ${baseTag}.`,
    )
    .join('\n');

  const eventDocs = (baseEvents ?? [])
    .map((e) => ` * @fires ${e} - Inherited from ${baseTag}.`)
    .join('\n');

  const partDocs = (baseCssParts ?? [])
    .map((p) => ` * @csspart ${p} - Inherited from ${baseTag}.`)
    .join('\n');

  const jsdocMiddle = [slotDocs, eventDocs, partDocs].filter(Boolean).join('\n');

  const imports = hasBase
    ? [
        `import { customElement } from 'lit/decorators.js';`,
        `import { tokenStyles } from '@helixui/tokens/lit';`,
        `import { ${baseClassName} } from '../${baseTag}/index.js';`,
        `import { ${stylesVar} } from './${tagName}.styles.js';`,
      ]
    : [
        `import { LitElement, html } from 'lit';`,
        `import { customElement } from 'lit/decorators.js';`,
        `import { tokenStyles } from '@helixui/tokens/lit';`,
        `import { ${stylesVar} } from './${tagName}.styles.js';`,
      ];

  const extendsClause = hasBase && baseClassName !== undefined ? baseClassName : 'LitElement';

  const renderBody = hasBase ? `    return super.render();` : `    return html\`<slot></slot>\`;`;

  return [
    imports.join('\n'),
    '',
    '/**',
    ` * @tag ${tagName}`,
    ` * @summary ${toTitleCase(tagName.replace(/^hx-/, ''))} web component.`,
    ...(jsdocMiddle ? [' *', jsdocMiddle] : []),
    ' */',
    `@customElement('${tagName}')`,
    `export class ${className} extends ${extendsClause} {`,
    `  static override styles = [tokenStyles, ${stylesVar}];`,
    '',
    '  override render() {',
    renderBody,
    '  }',
    '}',
    '',
    'declare global {',
    '  interface HTMLElementTagNameMap {',
    `    '${tagName}': ${className};`,
    '  }',
    '}',
    '',
  ].join('\n');
}

function generateStyles(tagName: string, stylesVar: string, baseTag?: string): string {
  const cssProps = [
    `    --_bg: var(--${tagName}-bg, var(--hx-color-surface));`,
    `    --_color: var(--${tagName}-color, var(--hx-color-on-surface));`,
    `    --_padding: var(--${tagName}-padding, var(--hx-space-4));`,
    `    --_radius: var(--${tagName}-radius, var(--hx-border-radius-md));`,
  ];

  const csspropDocs = [
    ` * @cssprop [--${tagName}-bg=var(--hx-color-surface)] - Background color.`,
    ` * @cssprop [--${tagName}-color=var(--hx-color-on-surface)] - Text color.`,
    ` * @cssprop [--${tagName}-padding=var(--hx-space-4)] - Inner padding.`,
    ` * @cssprop [--${tagName}-radius=var(--hx-border-radius-md)] - Border radius.`,
  ];

  const baseNote = baseTag ? ` Extends ${baseTag}.` : '';

  return [
    `import { css } from 'lit';`,
    '',
    '/**',
    ` * Styles for ${tagName}.${baseNote}`,
    ' *',
    ...csspropDocs,
    ' */',
    `export const ${stylesVar} = css\``,
    '  :host {',
    ...cssProps,
    '',
    '    display: block;',
    '    box-sizing: border-box;',
    '    background: var(--_bg);',
    '    color: var(--_color);',
    '    padding: var(--_padding);',
    '    border-radius: var(--_radius);',
    '  }',
    `\`;`,
    '',
  ].join('\n');
}

function generateTest(tagName: string, className: string): string {
  return [
    `import { describe, it, expect, afterEach } from 'vitest';`,
    `import { fixture, cleanup, checkA11y } from '../../test-utils.js';`,
    `import type { ${className} } from './${tagName}.js';`,
    `import './index.js';`,
    '',
    'afterEach(cleanup);',
    '',
    `describe('${tagName}', () => {`,
    "  describe('Rendering', () => {",
    "    it('renders with shadow DOM', async () => {",
    `      const el = await fixture<${className}>('<${tagName}></${tagName}>');`,
    '      expect(el.shadowRoot).toBeTruthy();',
    '    });',
    '  });',
    '',
    "  describe('Accessibility (axe-core)', () => {",
    "    it('has no axe violations in default state', async () => {",
    `      const el = await fixture<${className}>('<${tagName}>Content</${tagName}>');`,
    '      const { violations } = await checkA11y(el);',
    '      expect(violations).toEqual([]);',
    '    });',
    '  });',
    '});',
    '',
  ].join('\n');
}

function generateStories(tagName: string): string {
  const title = toTitleCase(tagName.replace(/^hx-/, ''));

  return [
    `import type { Meta, StoryObj } from '@storybook/web-components';`,
    `import { html } from 'lit';`,
    `import './${tagName}.js';`,
    '',
    `const meta = {`,
    `  title: 'Components/${title}',`,
    `  component: '${tagName}',`,
    `  tags: ['autodocs'],`,
    `} satisfies Meta;`,
    '',
    'export default meta;',
    'type Story = StoryObj;',
    '',
    'export const Default: Story = {',
    `  render: () => html\`<${tagName}>${title} content</${tagName}>\`,`,
    '};',
    '',
  ].join('\n');
}

function generateTwig(tagName: string, baseTag?: string): string {
  const title = toTitleCase(tagName.replace(/^hx-/, ''));
  const baseNote = baseTag ? `\n  Extends: ${baseTag}\n` : '';

  return [
    '{#',
    `  ${tagName} — Drupal Twig Template`,
    `  ${'='.repeat(tagName.length + 28)}`,
    baseNote,
    '  Parameters:',
    '    content    (string) Optional. Main slot content.',
    '    attributes (object) Optional. Additional HTML attributes.',
    '',
    '  Slots (Twig blocks):',
    '    default — Main content.',
    '',
    '  Usage:',
    `    {% include '${tagName}.twig' with {`,
    `      content: '${title} content',`,
    '    } %}',
    '#}',
    '',
    `<${tagName}`,
    '  {% for key, val in attributes|default({}) %}{{ key }}="{{ val }}" {% endfor %}',
    '>',
    '  {%- block default %}{{ content }}{% endblock -%}',
    `</${tagName}>`,
    '',
  ].join('\n');
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function scaffoldComponent(options: ScaffoldComponentOptions): ScaffoldComponentResult {
  const { name, outputDir } = options;
  const warnings: string[] = [];

  // Validate name
  validateName(name);

  // Validate base tag if provided
  const baseTag = options.extends;
  if (baseTag !== undefined) {
    validateBase(baseTag);
  }

  const tagName = `hx-${name}`;
  const className = tagToClassName(name);
  const stylesVar = toStylesVarName(name);

  // Read CEM for base component inheritance
  let baseSlots: string[] | undefined;
  let baseEvents: string[] | undefined;
  let baseCssParts: string[] | undefined;

  if (baseTag !== undefined) {
    const reader = new CemReader();
    const cem = reader.loadSafe();
    if (cem === null) {
      warnings.push(
        `CEM manifest not found. Generating base class inheritance without inherited slot/event/part metadata. Run 'pnpm run cem' to generate the manifest.`,
      );
    } else {
      const baseComp = reader.getComponent(baseTag);
      if (baseComp === undefined) {
        warnings.push(
          `Base component "${baseTag}" not found in CEM. Generating inheritance without metadata.`,
        );
      } else {
        baseSlots = reader.getSlots(baseTag).map((s) => s.name);
        baseEvents = reader.getEvents(baseTag).map((e) => e.name);
        baseCssParts = reader.getCssParts(baseTag).map((p) => p.name);
      }
    }
  }

  // Generate all files
  const files: Record<string, string> = {
    'index.ts': generateIndex(className, tagName),
    [`${tagName}.ts`]: generateComponentClass(
      tagName,
      className,
      stylesVar,
      baseTag,
      baseSlots,
      baseEvents,
      baseCssParts,
    ),
    [`${tagName}.styles.ts`]: generateStyles(tagName, stylesVar, baseTag),
    [`${tagName}.test.ts`]: generateTest(tagName, className),
    [`${tagName}.stories.ts`]: generateStories(tagName),
    [`${tagName}.twig`]: generateTwig(tagName, baseTag),
  };

  const result: ScaffoldComponentResult = { tagName, className, files, warnings };

  // Write to disk if outputDir provided
  if (outputDir !== undefined) {
    const compDir = join(outputDir, tagName);
    if (existsSync(compDir)) {
      throw new Error(
        `Component directory "${compDir}" already exists. Back up or delete it before scaffolding.`,
      );
    }
    mkdirSync(compDir, { recursive: true });
    for (const [filename, content] of Object.entries(files)) {
      writeFileSync(join(compDir, filename), content, 'utf8');
    }
    result.outputDir = compDir;
  }

  return result;
}
