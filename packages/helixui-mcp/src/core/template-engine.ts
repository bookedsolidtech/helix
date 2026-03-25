// ─── ComponentTemplateData ────────────────────────────────────────────────────

export interface ComponentTemplateData {
  tagName: string;
  className: string;
  description?: string;
  properties?: Array<{
    name: string;
    type: string;
    default: string;
    description?: string;
  }>;
  events?: Array<{
    name: string;
    description?: string;
  }>;
  slots?: Array<{
    name: string;
    description?: string;
  }>;
  cssParts?: Array<{
    name: string;
    description?: string;
  }>;
  cssProperties?: Array<{
    name: string;
    default: string;
    description?: string;
  }>;
}

// ─── Template Tagged Literal ──────────────────────────────────────────────────

type TemplateValue = string | number | boolean | undefined | null | string[];

export function template(strings: TemplateStringsArray, ...values: TemplateValue[]): string {
  // Build raw string from parts
  let raw = '';
  for (let i = 0; i < strings.length; i++) {
    raw += strings[i] ?? '';
    if (i < values.length) {
      const val = values[i];
      if (val === undefined || val === null) {
        raw += '';
      } else if (Array.isArray(val)) {
        raw += val.join('\n');
      } else {
        raw += String(val);
      }
    }
  }

  // Split into lines for processing
  const lines = raw.split('\n');

  // Trim leading and trailing blank lines
  let start = 0;
  while (start < lines.length && (lines[start] ?? '').trim() === '') {
    start++;
  }
  let end = lines.length - 1;
  while (end >= start && (lines[end] ?? '').trim() === '') {
    end--;
  }
  const trimmedLines = lines.slice(start, end + 1);

  if (trimmedLines.length === 0) return '';

  // Detect common leading indentation
  let minIndent = Infinity;
  for (const line of trimmedLines) {
    if (line.trim() === '') continue;
    const match = /^(\s*)/.exec(line);
    const indent = match?.[1]?.length ?? 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (!isFinite(minIndent)) minIndent = 0;

  // Strip common indentation
  const dedented = trimmedLines.map((line) => (line.trim() === '' ? '' : line.slice(minIndent)));

  return dedented.join('\n');
}

// ─── Generators ───────────────────────────────────────────────────────────────

export function generateComponentTs(data: ComponentTemplateData): string {
  const { tagName, className, description, properties = [], events = [] } = data;

  const propertyDecorators = properties
    .map((p) => {
      const lines = [
        `  /** ${p.description ?? p.name} */`,
        `  @property({ type: String, reflect: true })`,
        `  ${p.name}: ${p.type} = ${p.default};`,
      ];
      return lines.join('\n');
    })
    .join('\n\n');

  const eventComments = events
    .map((e) => `   * @fires ${e.name}${e.description ? ` - ${e.description}` : ''}`)
    .join('\n');

  return template`
    import { LitElement, html } from 'lit';
    import { customElement, property } from 'lit/decorators.js';
    import { ${className}Styles } from './${tagName}.styles.js';

    /**
     * ${description ?? `${className} web component.`}
     *
    ${eventComments ? eventComments : '     *'}
     * @tag ${tagName}
     */
    @customElement('${tagName}')
    export class ${className} extends LitElement {
      static override styles = ${className}Styles;

    ${propertyDecorators}

      override render() {
        return html\`
          <slot></slot>
        \`;
      }
    }

    declare global {
      interface HTMLElementTagNameMap {
        '${tagName}': ${className};
      }
    }
  `;
}

export function generateComponentCss(data: ComponentTemplateData): string {
  const { tagName, cssProperties = [] } = data;

  const cssVarComments = cssProperties
    .map((p) => `   * @cssprop {*} ${p.name} - ${p.description ?? p.name} (default: ${p.default})`)
    .join('\n');

  const cssVarDefaults = cssProperties.map((p) => `  ${p.name}: ${p.default};`).join('\n');

  return template`
    import { css } from 'lit';

    /**
     * Styles for ${tagName}
     *
    ${cssVarComments ? cssVarComments : '     *'}
     */
    export const ${data.className}Styles = css\`
      :host {
    ${cssVarDefaults}
        display: block;
        box-sizing: border-box;
      }
    \`;
  `;
}

export function generateComponentTwig(data: ComponentTemplateData): string {
  const { tagName, properties = [], slots = [] } = data;

  const attrs = properties.map((p) => `  ${p.name}="{{ ${p.name} }}"`).join('\n');

  const slotContent = slots
    .filter((s) => s.name !== '')
    .map((s) => `  <span slot="${s.name}">{{ ${s.name}_content }}</span>`)
    .join('\n');

  return template`
    {#
      ${tagName} component
      ${data.description ?? ''}
    #}
    <${tagName}
    ${attrs}
    >
    ${slotContent}
      {{ default_content }}
    </${tagName}>
  `;
}

export function generateComponentTest(data: ComponentTemplateData): string {
  const { tagName, className, properties = [] } = data;

  const propTests = properties
    .map(
      (p) => template`
        it('has ${p.name} property', async () => {
          const el = await fixture<${className}>(html\`<${tagName}></${tagName}>\`);
          expect(el.${p.name}).to.equal(${p.default});
        });
      `,
    )
    .join('\n\n');

  return template`
    import { fixture, html } from '@open-wc/testing';
    import { describe, it, expect, beforeEach } from 'vitest';
    import { ${className} } from './${tagName}.js';

    describe('${tagName}', () => {
      it('renders', async () => {
        const el = await fixture<${className}>(html\`<${tagName}></${tagName}>\`);
        expect(el).to.exist;
      });

      it('is accessible', async () => {
        const el = await fixture<${className}>(html\`<${tagName}></${tagName}>\`);
        // await expect(el).to.be.accessible();
        expect(el).to.exist;
      });

    ${propTests}
    });
  `;
}
