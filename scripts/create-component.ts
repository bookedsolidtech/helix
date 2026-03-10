#!/usr/bin/env tsx
/**
 * Component generator for wc-2026.
 *
 * Usage: npm run create:component hx-my-component
 *
 * Scaffolds the 5-file structure in packages/hx-library/src/components/<name>/
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Arg Parsing ───

const name = process.argv[2];

if (!name) {
  console.error('Error: component name is required.');
  console.error('Usage: npm run create:component hx-my-component');
  process.exit(1);
}

if (!name.startsWith('hx-')) {
  console.error(`Error: component name must start with "hx-". Got: "${name}"`);
  process.exit(1);
}

if (!/^hx-[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`Error: component name must be lowercase, hyphenated. Got: "${name}"`);
  process.exit(1);
}

// ─── Name Derivations ───

/**
 * "hx-my-component" → "HelixMyComponent"
 */
function toClassName(tagName: string): string {
  return tagName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * "hx-my-component" → "helixMyComponentStyles"
 */
function toStylesExport(tagName: string): string {
  const parts = tagName.split('-');
  const [first, ...rest] = parts;
  const camel = first + rest.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return `${camel}Styles`;
}

const className = toClassName(name);
const stylesExport = toStylesExport(name);

// ─── Paths ───

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const componentDir = resolve(repoRoot, 'packages/hx-library/src/components', name);

if (existsSync(componentDir)) {
  console.error(`Error: component directory already exists: ${componentDir}`);
  process.exit(1);
}

// ─── File Templates ───

const indexTs = `export { ${className} } from './${name}.js';
`;

const componentTs = `import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helix/tokens/lit';
import { ${stylesExport} } from './${name}.styles.js';

/**
 * TODO: Add component description.
 *
 * @summary TODO: One-line summary.
 *
 * @tag ${name}
 *
 * @slot - Default slot for content.
 *
 * @csspart root - The root container element.
 *
 * @cssprop [--${name}-color=var(--hx-color-primary-500)] - TODO: describe token.
 */
@customElement('${name}')
export class ${className} extends LitElement {
  static override styles = [tokenStyles, ${stylesExport}];

  /**
   * TODO: Add property description.
   * @attr
   */
  @property({ type: String, reflect: true })
  value = '';

  override render() {
    return html\`<div part="root">\${this.value}<slot></slot></div>\`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    '${name}': ${className};
  }
}
`;

const stylesTs = `import { css } from 'lit';

export const ${stylesExport} = css\`
  :host {
    display: block;
  }
\`;
`;

const storiesTs = `import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './${name}.js';

// ─────────────────────────────────────────────────
// Meta Configuration
// ─────────────────────────────────────────────────

const meta = {
  title: 'Components/${className.replace('Helix', '')}',
  component: '${name}',
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'TODO: Describe the value property.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────
// Stories
// ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    value: 'Hello from ${name}',
  },
  render: (args) => html\`<${name} value=\${args['value'] as string}></${name}>\`,
};
`;

const testTs = `import { describe, it, expect, afterEach } from 'vitest';
import { page } from '@vitest/browser/context';
import { fixture, shadowQuery, cleanup, checkA11y } from '../../test-utils.js';
import type { ${className} } from './${name}.js';
import './index.js';

afterEach(cleanup);

describe('${name}', () => {
  // ─── Rendering ───

  describe('Rendering', () => {
    it('renders with shadow DOM', async () => {
      const el = await fixture<${className}>('<${name}></${name}>');
      expect(el.shadowRoot).toBeTruthy();
    });

    it('exposes "root" CSS part', async () => {
      const el = await fixture<${className}>('<${name}></${name}>');
      const root = shadowQuery(el, '[part~="root"]');
      expect(root).toBeTruthy();
    });
  });

  // ─── Properties ───

  describe('Properties', () => {
    it('reflects value attr to host', async () => {
      const el = await fixture<${className}>('<${name} value="test"></${name}>');
      expect(el.getAttribute('value')).toBe('test');
    });
  });

  // ─── Slots ───

  describe('Slots', () => {
    it('default slot renders text', async () => {
      const el = await fixture<${className}>('<${name}>Hello</${name}>');
      expect(el.textContent?.trim()).toBe('Hello');
    });
  });

  // ─── Accessibility (axe-core) ───

  describe('Accessibility (axe-core)', () => {
    it('has no axe violations in default state', async () => {
      const el = await fixture<${className}>('<${name}>Content</${name}>');
      await page.screenshot();
      const { violations } = await checkA11y(el);
      expect(violations).toEqual([]);
    });
  });
});
`;

// ─── Write Files ───

mkdirSync(componentDir, { recursive: true });

const files: Record<string, string> = {
  'index.ts': indexTs,
  [`${name}.ts`]: componentTs,
  [`${name}.styles.ts`]: stylesTs,
  [`${name}.stories.ts`]: storiesTs,
  [`${name}.test.ts`]: testTs,
};

for (const [filename, content] of Object.entries(files)) {
  const filePath = resolve(componentDir, filename);
  writeFileSync(filePath, content, 'utf-8');
  console.log(`  created  ${filePath.replace(repoRoot + '/', '')}`);
}

console.log(`\nComponent "${name}" scaffolded successfully.`);
console.log('\nNext steps:');
console.log(
  `  1. Implement the component in packages/hx-library/src/components/${name}/${name}.ts`,
);
console.log(`  2. Add styles in packages/hx-library/src/components/${name}/${name}.styles.ts`);
console.log(`  3. Export from packages/hx-library/src/index.ts`);
console.log(`  4. Add Storybook stories in ${name}.stories.ts`);
console.log(`  5. Write tests in ${name}.test.ts`);
console.log(`  6. Run: npm run cem`);
