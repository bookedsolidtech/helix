/**
 * CEM-driven code snippet generator.
 *
 * Takes parsed ComponentData from the CEM and produces ready-to-use
 * code snippets for HTML, React, Twig, and Drupal consumers.
 *
 * Supports optional manual overrides so curated content site examples
 * can replace the auto-generated output for specific frameworks.
 */
import type { ComponentData } from './cem-parser';

// ── Public Types ─────────────────────────────────────────────────────

export type SnippetFramework = 'html' | 'react' | 'twig' | 'drupal';

export interface Snippet {
  framework: SnippetFramework;
  label: string;
  code: string;
  /** Language key for the syntax highlighter (e.g., "html", "tsx", "twig") */
  language: string;
}

export interface SnippetResult {
  snippets: Snippet[];
}

export interface Snippets {
  html: string;
  react: string;
  twig: string;
  drupal: string;
}

/** Maps framework key to its display label and highlighter language */
const FRAMEWORK_META: Record<SnippetFramework, { label: string; language: string }> = {
  html: { label: 'HTML', language: 'html' },
  react: { label: 'React', language: 'tsx' },
  twig: { label: 'Twig', language: 'twig' },
  drupal: { label: 'Drupal', language: 'twig' },
};

/**
 * Convert a kebab-case attribute name to camelCase for React/JSX.
 */
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Build a representative attribute string for a property, using its
 * default value or a sensible placeholder.
 */
function getExampleValue(prop: { name: string; type: string; default: string }): string | null {
  if (prop.default === '\u2014' || prop.default === 'undefined' || prop.default === '') {
    return null;
  }

  let val = prop.default;
  if (val.startsWith("'") && val.endsWith("'")) {
    val = val.slice(1, -1);
  }
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1);
  }

  if (val === 'false') return null;

  return val;
}

/**
 * Build slot placeholder content for the snippet.
 */
function buildSlotContent(
  hasDefaultSlot: boolean,
  namedSlots: Array<{ name: string; description: string }>,
): string {
  const parts: string[] = [];

  if (hasDefaultSlot) {
    parts.push('\n  Content goes here');
  }

  for (const slot of namedSlots) {
    parts.push(`\n  <span slot="${slot.name}">${slot.description || slot.name}</span>`);
  }

  if (parts.length > 0) {
    return parts.join('') + '\n';
  }

  return '';
}

/**
 * Generate code snippets for all four target environments.
 */
export function generateSnippets(component: ComponentData): Snippets {
  const tag = component.tagName;

  const exampleProps = component.properties
    .map((prop) => ({
      ...prop,
      exampleValue: getExampleValue(prop),
    }))
    .filter((p) => p.exampleValue !== null);

  const hasDefaultSlot = component.slots.some(
    (s) => s.name === '(default)' || s.name === '' || s.name === 'default',
  );

  const namedSlots = component.slots.filter(
    (s) => s.name !== '(default)' && s.name !== '' && s.name !== 'default',
  );

  // ── HTML ─────────────────────────────────────────────────────────
  const htmlAttrs = exampleProps
    .map((p) => {
      if (p.type === 'boolean' && p.exampleValue === 'true') {
        return `  ${p.attribute}`;
      }
      return `  ${p.attribute}="${p.exampleValue}"`;
    })
    .join('\n');

  const slotContent = buildSlotContent(hasDefaultSlot, namedSlots);

  const htmlSnippet =
    exampleProps.length > 0
      ? `<${tag}\n${htmlAttrs}\n>${slotContent}</${tag}>`
      : `<${tag}>${slotContent}</${tag}>`;

  // ── React ────────────────────────────────────────────────────────
  const reactAttrs = exampleProps
    .map((p) => {
      const reactName = toCamelCase(p.attribute);
      if (p.type === 'boolean' && p.exampleValue === 'true') {
        return `  ${reactName}`;
      }
      return `  ${reactName}="${p.exampleValue}"`;
    })
    .join('\n');

  const reactSnippet =
    exampleProps.length > 0
      ? `<${tag}\n${reactAttrs}\n>${slotContent}</${tag}>`
      : `<${tag}>${slotContent}</${tag}>`;

  // ── Twig ─────────────────────────────────────────────────────────
  const twigAttrs = exampleProps
    .map((p) => {
      if (p.type === 'boolean' && p.exampleValue === 'true') {
        return `  ${p.attribute}`;
      }
      return `  ${p.attribute}="{{ ${toCamelCase(p.name)} }}"`;
    })
    .join('\n');

  const twigSnippet =
    exampleProps.length > 0
      ? `{# ${component.summary || tag} #}\n<${tag}\n${twigAttrs}\n>${slotContent}</${tag}>`
      : `{# ${component.summary || tag} #}\n<${tag}>${slotContent}</${tag}>`;

  // ── Drupal ───────────────────────────────────────────────────────
  const drupalBase = twigSnippet.replace(/^\{#.*#\}\n/, '');
  const drupalSnippet = [
    `{# @file ${tag}.html.twig #}`,
    `{# Drupal integration for ${component.summary || tag} #}`,
    ``,
    drupalBase,
    ``,
    `{# Attach the library in your theme's .libraries.yml: #}`,
    `{# global_styling: #}`,
    `{#   js: #}`,
    `{#     path/to/wc-library.js: {} #}`,
  ].join('\n');

  return {
    html: htmlSnippet,
    react: reactSnippet,
    twig: twigSnippet,
    drupal: drupalSnippet,
  };
}

/**
 * Generate snippets with optional manual overrides.
 *
 * For each framework, if an override is provided it replaces the
 * auto-generated output. Otherwise the CEM-driven snippet is used.
 *
 * Returns a structured SnippetResult suitable for the CodeSnippets
 * component and server-side syntax highlighting.
 */
export function generateSnippetsWithOverrides(
  component: ComponentData,
  overrides?: Partial<Record<SnippetFramework, string>>,
): SnippetResult {
  const auto = generateSnippets(component);

  const frameworks: SnippetFramework[] = ['html', 'react', 'twig', 'drupal'];

  const snippets: Snippet[] = frameworks.map((fw) => {
    const meta = FRAMEWORK_META[fw];
    const code = overrides?.[fw] ?? auto[fw];
    return {
      framework: fw,
      label: meta.label,
      code,
      language: meta.language,
    };
  });

  return { snippets };
}
