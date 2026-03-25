import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseArgs,
  mapCemTypeToJsonSchema,
  transformDeclaration,
  generateComponentYml,
  generateTwig,
  generateCss,
  generateJs,
  generateReadme,
  toTitleCase,
  toKebabCase,
  toHumanName,
  escapeYamlString,
  extractComponents,
} from '../generate-sdc.js';
import type {
  CemDeclaration,
  Cem,
  SdcComponent,
} from '../generate-sdc.js';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockButtonDeclaration: CemDeclaration = {
  kind: 'class',
  name: 'HelixButton',
  tagName: 'hx-button',
  description: 'A versatile button component for user interactions.',
  members: [
    {
      kind: 'field',
      name: 'variant',
      type: { text: 'string' },
      default: '"primary"',
      description: 'The button visual style.',
      attribute: 'variant',
      reflects: true,
    },
    {
      kind: 'field',
      name: 'disabled',
      type: { text: 'boolean' },
      default: 'false',
      description: 'Whether the button is disabled.',
      attribute: 'disabled',
      reflects: true,
    },
    {
      kind: 'field',
      name: 'size',
      type: { text: 'number' },
      default: '16',
      description: 'Internal size hint.',
      attribute: 'size',
    },
    {
      kind: 'method',
      name: 'focus',
      description: 'Focuses the button.',
    },
    {
      kind: 'field',
      name: '_internalState',
      type: { text: 'string' },
      description: 'Private internal state.',
      attribute: '_internalState',
    },
    {
      kind: 'field',
      name: 'internals',
      type: { text: 'object' },
      description: 'ElementInternals.',
    },
  ],
  slots: [
    { name: '', description: 'Default slot for button label.' },
    { name: 'prefix', description: 'Content placed before the label.' },
  ],
  events: [
    {
      name: 'hx-click',
      description: 'Fires when the button is clicked.',
      type: { text: 'CustomEvent' },
    },
  ],
  cssProperties: [
    {
      name: '--hx-button-bg',
      description: 'Button background color.',
      default: 'var(--hx-color-primary)',
    },
  ],
  cssParts: [{ name: 'button', description: 'The inner button element.' }],
};

const mockCardDeclaration: CemDeclaration = {
  kind: 'class',
  name: 'HelixCard',
  tagName: 'hx-card',
  description: 'A card container component.',
  members: [],
  slots: [],
  events: [],
  cssProperties: [],
  cssParts: [],
};

const mockDeprecatedDeclaration: CemDeclaration = {
  kind: 'class',
  name: 'HelixLegacy',
  tagName: 'hx-legacy',
  description: 'Old component.',
  deprecated: 'Use hx-button instead.',
  members: [],
  slots: [],
  events: [],
  cssProperties: [],
  cssParts: [],
};

const mockCem: Cem = {
  schemaVersion: '1.0.0',
  modules: [
    {
      kind: 'javascript-module',
      path: 'src/components/hx-button/hx-button.ts',
      declarations: [mockButtonDeclaration],
    },
    {
      kind: 'javascript-module',
      path: 'src/components/hx-card/hx-card.ts',
      declarations: [mockCardDeclaration],
    },
    {
      // Non-component module — should be skipped
      kind: 'javascript-module',
      path: 'src/utils/helpers.ts',
      declarations: [
        { kind: 'variable', name: 'CONSTANT', type: { text: 'string' } },
      ],
    },
    {
      // Explicitly non-javascript-module — should be skipped
      kind: 'css-module',
      path: 'src/tokens.css',
      declarations: [],
    },
  ],
};

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('returns defaults when no args provided', () => {
    const args = parseArgs([]);
    expect(args.cem).toBe('./custom-elements.json');
    expect(args.output).toBe('./drupal/components');
    expect(args.component).toBeNull();
    expect(args.help).toBe(false);
  });

  it('parses --cem flag', () => {
    const args = parseArgs(['--cem', '/path/to/cem.json']);
    expect(args.cem).toBe('/path/to/cem.json');
  });

  it('parses --output flag', () => {
    const args = parseArgs(['--output', '/tmp/drupal']);
    expect(args.output).toBe('/tmp/drupal');
  });

  it('parses --component flag', () => {
    const args = parseArgs(['--component', 'hx-button']);
    expect(args.component).toBe('hx-button');
  });

  it('parses --help flag', () => {
    expect(parseArgs(['--help']).help).toBe(true);
    expect(parseArgs(['-h']).help).toBe(true);
  });

  it('parses all flags together', () => {
    const args = parseArgs([
      '--cem', './cem.json',
      '--output', './out',
      '--component', 'hx-card',
    ]);
    expect(args.cem).toBe('./cem.json');
    expect(args.output).toBe('./out');
    expect(args.component).toBe('hx-card');
  });
});

// ---------------------------------------------------------------------------
// mapCemTypeToJsonSchema
// ---------------------------------------------------------------------------

describe('mapCemTypeToJsonSchema', () => {
  it('maps boolean', () => {
    expect(mapCemTypeToJsonSchema('boolean')).toBe('boolean');
    expect(mapCemTypeToJsonSchema('Boolean')).toBe('boolean');
  });

  it('maps number', () => {
    expect(mapCemTypeToJsonSchema('number')).toBe('number');
    expect(mapCemTypeToJsonSchema('NUMBER')).toBe('number');
  });

  it('maps string', () => {
    expect(mapCemTypeToJsonSchema('string')).toBe('string');
    expect(mapCemTypeToJsonSchema('STRING')).toBe('string');
  });

  it('maps union types to object', () => {
    expect(mapCemTypeToJsonSchema("'primary' | 'secondary'")).toBe('object');
    expect(mapCemTypeToJsonSchema('1 | 2 | 3')).toBe('object');
  });

  it('maps unknown types to object', () => {
    expect(mapCemTypeToJsonSchema('HTMLElement')).toBe('object');
    expect(mapCemTypeToJsonSchema('')).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// extractComponents
// ---------------------------------------------------------------------------

describe('extractComponents', () => {
  it('extracts only class declarations with tagName', () => {
    const components = extractComponents(mockCem);
    expect(components).toHaveLength(2);
    expect(components[0].tagName).toBe('hx-button');
    expect(components[1].tagName).toBe('hx-card');
  });

  it('skips non-javascript-module kinds', () => {
    const components = extractComponents(mockCem);
    const tags = components.map((c) => c.tagName);
    // css-module should not appear
    expect(tags).not.toContain(undefined);
  });

  it('skips declarations without tagName', () => {
    const components = extractComponents(mockCem);
    // helpers.ts variable has no tagName
    expect(components.every((c) => c.tagName !== undefined)).toBe(true);
  });

  it('returns empty array for empty CEM', () => {
    const emptyCem: Cem = { schemaVersion: '1.0.0', modules: [] };
    expect(extractComponents(emptyCem)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// transformDeclaration
// ---------------------------------------------------------------------------

describe('transformDeclaration', () => {
  let component: SdcComponent;

  beforeEach(() => {
    component = transformDeclaration(mockButtonDeclaration);
  });

  it('sets tagName and name', () => {
    expect(component.tagName).toBe('hx-button');
    expect(component.name).toBe('HX Button');
  });

  it('sets description', () => {
    expect(component.description).toBe('A versatile button component for user interactions.');
  });

  it('includes public attribute fields as props', () => {
    const names = component.props.map((p) => p.name);
    expect(names).toContain('variant');
    expect(names).toContain('disabled');
    expect(names).toContain('size');
  });

  it('excludes method members', () => {
    const names = component.props.map((p) => p.name);
    expect(names).not.toContain('focus');
  });

  it('excludes members without attribute property', () => {
    // internals has no attribute property
    const names = component.props.map((p) => p.name);
    expect(names).not.toContain('internals');
  });

  it('excludes members starting with underscore', () => {
    const names = component.props.map((p) => p.name);
    expect(names).not.toContain('_internalState');
  });

  it('correctly maps boolean default', () => {
    const disabledProp = component.props.find((p) => p.name === 'disabled');
    expect(disabledProp?.type).toBe('boolean');
    expect(disabledProp?.default).toBe(false);
  });

  it('correctly maps string default (strips quotes)', () => {
    const variantProp = component.props.find((p) => p.name === 'variant');
    expect(variantProp?.type).toBe('string');
    expect(variantProp?.default).toBe('primary');
  });

  it('correctly maps number default', () => {
    const sizeProp = component.props.find((p) => p.name === 'size');
    expect(sizeProp?.type).toBe('number');
    expect(sizeProp?.default).toBe(16);
  });

  it('maps slots correctly', () => {
    expect(component.slots).toHaveLength(2);
    const defaultSlot = component.slots.find((s) => s.name === '');
    expect(defaultSlot?.title).toBe('Default');
    const prefixSlot = component.slots.find((s) => s.name === 'prefix');
    expect(prefixSlot?.title).toBe('Prefix');
  });

  it('passes through events', () => {
    expect(component.events).toHaveLength(1);
    expect(component.events[0].name).toBe('hx-click');
  });

  it('passes through cssProperties', () => {
    expect(component.cssProperties).toHaveLength(1);
    expect(component.cssProperties[0].name).toBe('--hx-button-bg');
  });

  it('passes through cssParts', () => {
    expect(component.cssParts).toHaveLength(1);
    expect(component.cssParts[0].name).toBe('button');
  });

  it('handles deprecated flag as string', () => {
    const legacy = transformDeclaration(mockDeprecatedDeclaration);
    expect(legacy.deprecated).toBe('Use hx-button instead.');
  });

  it('handles component with no members', () => {
    const card = transformDeclaration(mockCardDeclaration);
    expect(card.props).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateComponentYml
// ---------------------------------------------------------------------------

describe('generateComponentYml', () => {
  let component: SdcComponent;
  let yml: string;

  beforeEach(() => {
    component = transformDeclaration(mockButtonDeclaration);
    yml = generateComponentYml(component);
  });

  it('includes $schema header', () => {
    expect(yml).toContain('$schema:');
    expect(yml).toContain('drupalcode.org');
  });

  it('includes component name', () => {
    expect(yml).toContain('name: HX Button');
  });

  it('includes status and group', () => {
    expect(yml).toContain('status: experimental');
    expect(yml).toContain('group: HELiX');
  });

  it('includes props section', () => {
    expect(yml).toContain('props:');
    expect(yml).toContain('type: object');
    expect(yml).toContain('properties:');
    expect(yml).toContain('variant:');
    expect(yml).toContain('disabled:');
  });

  it('includes slots section', () => {
    expect(yml).toContain('slots:');
    expect(yml).toContain('default:');
    expect(yml).toContain('prefix:');
  });

  it('includes libraryOverrides', () => {
    expect(yml).toContain('libraryOverrides: {}');
  });

  it('adds deprecated field for deprecated components', () => {
    const legacy = transformDeclaration(mockDeprecatedDeclaration);
    const legacyYml = generateComponentYml(legacy);
    expect(legacyYml).toContain('deprecated:');
    expect(legacyYml).toContain('Use hx-button instead.');
  });

  it('omits props section when no props', () => {
    const card = transformDeclaration(mockCardDeclaration);
    const cardYml = generateComponentYml(card);
    expect(cardYml).not.toContain('props:');
  });

  it('omits slots section when no slots', () => {
    const card = transformDeclaration(mockCardDeclaration);
    const cardYml = generateComponentYml(card);
    expect(cardYml).not.toContain('slots:');
  });

  it('writes boolean defaults without quotes', () => {
    expect(yml).toContain('default: false');
  });

  it('writes string defaults with quotes', () => {
    expect(yml).toContain("default: 'primary'");
  });
});

// ---------------------------------------------------------------------------
// generateTwig
// ---------------------------------------------------------------------------

describe('generateTwig', () => {
  let component: SdcComponent;
  let twig: string;

  beforeEach(() => {
    component = transformDeclaration(mockButtonDeclaration);
    twig = generateTwig(component);
  });

  it('includes file docblock', () => {
    expect(twig).toContain('{#');
    expect(twig).toContain('@file');
    expect(twig).toContain('HX Button');
  });

  it('opens the correct tag', () => {
    expect(twig).toContain('<hx-button');
  });

  it('closes the correct tag', () => {
    expect(twig).toContain('</hx-button>');
  });

  it('renders boolean attributes without value', () => {
    expect(twig).toContain('{% if disabled %}disabled{% endif %}');
  });

  it('renders string attributes with value binding', () => {
    expect(twig).toContain('variant="{{ variant }}"');
  });

  it('renders named slots with conditionals', () => {
    expect(twig).toContain('{% if slots.prefix is defined %}');
    expect(twig).toContain('<slot name="prefix">{{ slots.prefix }}</slot>');
  });

  it('renders default slot fallback', () => {
    expect(twig).toContain('{% if content is defined %}{{ content }}{% else %}<slot></slot>{% endif %}');
  });

  it('adds deprecation comment for deprecated components', () => {
    const legacy = transformDeclaration(mockDeprecatedDeclaration);
    const legacyTwig = generateTwig(legacy);
    expect(legacyTwig).toContain('{# DEPRECATED:');
  });

  it('generates valid twig for component with no props or slots', () => {
    const card = transformDeclaration(mockCardDeclaration);
    const cardTwig = generateTwig(card);
    expect(cardTwig).toContain('<hx-card>');
    expect(cardTwig).toContain('</hx-card>');
  });
});

// ---------------------------------------------------------------------------
// generateCss
// ---------------------------------------------------------------------------

describe('generateCss', () => {
  let component: SdcComponent;
  let css: string;

  beforeEach(() => {
    component = transformDeclaration(mockButtonDeclaration);
    css = generateCss(component);
  });

  it('includes component name in header', () => {
    expect(css).toContain('HX Button');
  });

  it('mentions adopted-stylesheets pattern', () => {
    expect(css).toContain('@helixui/adopted-stylesheets');
    expect(css).toContain('AdoptedStylesheetsController');
  });

  it('documents CSS custom properties', () => {
    expect(css).toContain('--hx-button-bg');
  });

  it('includes host selector block', () => {
    expect(css).toContain('hx-button {');
    expect(css).toContain('display: block;');
  });
});

// ---------------------------------------------------------------------------
// generateJs
// ---------------------------------------------------------------------------

describe('generateJs', () => {
  let component: SdcComponent;
  let js: string;

  beforeEach(() => {
    component = transformDeclaration(mockButtonDeclaration);
    js = generateJs(component);
  });

  it('imports the component from @helixui/library', () => {
    expect(js).toContain("import '@helixui/library/components/hx-button'");
  });

  it('checks for AdoptedStylesheetsController', () => {
    expect(js).toContain('window.AdoptedStylesheetsController');
  });

  it('instantiates controller with tag name', () => {
    expect(js).toContain("new window.AdoptedStylesheetsController('hx-button')");
  });

  it('guards against non-browser environments', () => {
    expect(js).toContain("typeof window !== 'undefined'");
  });
});

// ---------------------------------------------------------------------------
// generateReadme
// ---------------------------------------------------------------------------

describe('generateReadme', () => {
  let component: SdcComponent;
  let readme: string;

  beforeEach(() => {
    component = transformDeclaration(mockButtonDeclaration);
    readme = generateReadme(component);
  });

  it('has H1 heading with component name', () => {
    expect(readme).toContain('# HX Button');
  });

  it('includes description', () => {
    expect(readme).toContain('A versatile button component for user interactions.');
  });

  it('includes twig usage example', () => {
    expect(readme).toContain("{% include 'helix:hx-button'");
  });

  it('includes props table', () => {
    expect(readme).toContain('## Props');
    expect(readme).toContain('| variant |');
    expect(readme).toContain('| disabled |');
  });

  it('includes slots table', () => {
    expect(readme).toContain('## Slots');
    expect(readme).toContain('| (default) |');
    expect(readme).toContain('| prefix |');
  });

  it('includes events table', () => {
    expect(readme).toContain('## Events');
    expect(readme).toContain('| hx-click |');
  });

  it('includes CSS custom properties table', () => {
    expect(readme).toContain('## CSS Custom Properties');
    expect(readme).toContain('| --hx-button-bg |');
  });

  it('includes CSS parts table', () => {
    expect(readme).toContain('## CSS Parts');
    expect(readme).toContain('| button |');
  });

  it('adds deprecation notice for deprecated components', () => {
    const legacy = transformDeclaration(mockDeprecatedDeclaration);
    const legacyReadme = generateReadme(legacy);
    expect(legacyReadme).toContain('**Deprecated:**');
    expect(legacyReadme).toContain('Use hx-button instead.');
  });

  it('omits empty sections', () => {
    const card = transformDeclaration(mockCardDeclaration);
    const cardReadme = generateReadme(card);
    expect(cardReadme).not.toContain('## Props');
    expect(cardReadme).not.toContain('## Slots');
    expect(cardReadme).not.toContain('## Events');
  });
});

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

describe('toTitleCase', () => {
  it('converts camelCase', () => {
    expect(toTitleCase('backgroundColor')).toBe('Background Color');
  });

  it('converts kebab-case', () => {
    expect(toTitleCase('my-prop-name')).toBe('My Prop Name');
  });

  it('handles single word', () => {
    expect(toTitleCase('variant')).toBe('Variant');
  });

  it('handles snake_case', () => {
    expect(toTitleCase('my_prop')).toBe('My Prop');
  });
});

describe('toKebabCase', () => {
  it('converts camelCase to kebab-case', () => {
    expect(toKebabCase('backgroundColor')).toBe('background-color');
  });

  it('leaves already-kebab strings unchanged', () => {
    expect(toKebabCase('variant')).toBe('variant');
  });

  it('handles leading capitals', () => {
    expect(toKebabCase('MyProp')).toBe('my-prop');
  });
});

describe('toHumanName', () => {
  it('converts hx- tag to human name with HX prefix', () => {
    expect(toHumanName('hx-button')).toBe('HX Button');
    expect(toHumanName('hx-accordion-item')).toBe('HX Accordion Item');
    expect(toHumanName('hx-text-input')).toBe('HX Text Input');
  });
});

describe('escapeYamlString', () => {
  it('escapes single quotes by doubling them', () => {
    expect(escapeYamlString("it's a test")).toBe("it''s a test");
  });

  it('collapses newlines to spaces', () => {
    expect(escapeYamlString('line one\nline two')).toBe('line one line two');
  });

  it('handles strings with no special chars', () => {
    expect(escapeYamlString('normal string')).toBe('normal string');
  });
});
