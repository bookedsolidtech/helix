import { describe, expect, it } from 'vitest';

import {
  buildComponentEntry,
  classifyTier,
  excludedAttributeNames,
  extractHxTagsFromSource,
  extractSlots,
  extractTextProperties,
  extractVariantAxes,
  hipaaDetectors,
  inferLayerSelector,
  inferTarget,
  parseLiteralUnion,
  resolveBinding,
  tokenNameToPath,
  truncateDescription,
  type CemDeclaration,
  type CemModule,
} from '../lib/extractor.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BUTTON_DECL: CemDeclaration = {
  kind: 'class',
  tagName: 'hx-button',
  name: 'HelixButton',
  description:
    'A production-grade button component for user interaction. Supports multiple\nvisual variants, sizes, loading state, prefix/suffix slots, anchor rendering,\nand full ElementInternals form association.',
  attributes: [
    {
      name: 'variant',
      fieldName: 'variant',
      type: { text: "'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'" },
      default: "'primary'",
    },
    {
      name: 'hx-size',
      fieldName: 'size',
      type: { text: "'sm' | 'md' | 'lg'" },
      default: "'md'",
    },
    {
      name: 'disabled',
      fieldName: 'disabled',
      type: { text: 'boolean' },
      default: 'false',
    },
    {
      name: 'loading',
      fieldName: 'loading',
      type: { text: 'boolean' },
      default: 'false',
    },
    {
      name: 'href',
      fieldName: 'href',
      type: { text: 'string | undefined' },
    },
    {
      name: 'aria-label',
      type: { text: 'string | undefined' },
    },
  ],
  slots: [
    { name: '', description: 'Default slot for button label.' },
    { name: 'prefix', description: 'Prefix icon.' },
    { name: 'suffix', description: 'Suffix icon.' },
  ],
  cssParts: [
    { name: 'button', description: 'The root button element.' },
    { name: 'label', description: 'The button label.' },
  ],
  cssProperties: [
    {
      name: '--hx-button-bg',
      default: 'var(--hx-color-primary-500)',
      description: 'Button background color.',
    },
    {
      name: '--hx-button-color',
      default: 'var(--hx-color-neutral-0)',
      description: 'Button text color.',
    },
    {
      name: '--hx-button-border-color',
      default: 'transparent',
      description: 'Button border color.',
    },
    {
      name: '--hx-button-border-radius',
      default: 'var(--hx-border-radius-md)',
      description: 'Button border radius.',
    },
    {
      name: '--hx-button-hover-bg',
      description: 'Hover bg override (consumer-set).',
    },
    {
      name: '--hx-button-label-color',
      default: 'var(--hx-color-neutral-0, #fff)',
    },
  ],
  events: [{ name: 'hx-click' }],
};

const BUTTON_MODULE: CemModule = {
  path: 'src/components/hx-button/hx-button.ts',
  declarations: [BUTTON_DECL],
};

const PHI_DECL: CemDeclaration = {
  kind: 'class',
  tagName: 'hx-phi-field',
  name: 'HelixPhiField',
  description: 'PHI-aware masked field.',
  attributes: [
    {
      name: 'field-type',
      type: { text: "'ssn' | 'mrn' | 'dob' | 'insurance'" },
      default: "'ssn'",
      fieldName: 'fieldType',
    },
  ],
};

// ---------------------------------------------------------------------------
// §5 — HIPAA exclusion
// ---------------------------------------------------------------------------

describe('hipaaDetectors', () => {
  it('detects hx-phi-field via tag regex, attribute enum signal, and directory', () => {
    const hits = hipaaDetectors(PHI_DECL, 'src/components/hx-phi-field/hx-phi-field.ts');
    expect(hits).toContain('tag-regex');
    expect(hits).toContain('attribute-enum-signal');
    expect(hits).toContain('directory-location');
  });

  it('returns empty list for a clean component', () => {
    const hits = hipaaDetectors(BUTTON_DECL, BUTTON_MODULE.path);
    expect(hits).toEqual([]);
  });

  it('hits attribute-name-signal when an attribute name contains phi/ssn/etc.', () => {
    const decl: CemDeclaration = {
      kind: 'class',
      tagName: 'hx-patient-banner',
      name: 'HelixPatientBanner',
      description: 'Patient banner.',
      attributes: [
        { name: 'ssn', type: { text: 'string' } },
      ],
    };
    const hits = hipaaDetectors(decl, 'src/components/hx-patient-banner/hx-patient-banner.ts');
    expect(hits).toContain('attribute-name-signal');
  });

  it('does not falsely flag a component with a benign name like hx-profile', () => {
    const decl: CemDeclaration = {
      kind: 'class',
      tagName: 'hx-profile',
      name: 'HelixProfile',
      description: 'Profile card.',
      attributes: [{ name: 'name', type: { text: 'string' } }],
    };
    const hits = hipaaDetectors(decl, 'src/components/hx-profile/hx-profile.ts');
    expect(hits).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// §6 — Variant axis derivation
// ---------------------------------------------------------------------------

describe('parseLiteralUnion', () => {
  it('parses a simple 3-value union', () => {
    expect(parseLiteralUnion("'sm' | 'md' | 'lg'")).toEqual(['sm', 'md', 'lg']);
  });

  it('parses a 6-value union with extra whitespace', () => {
    expect(
      parseLiteralUnion("  'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost' | 'outline'  "),
    ).toEqual(['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'outline']);
  });

  it('returns null when there is a single literal (not a union)', () => {
    expect(parseLiteralUnion("'only-value'")).toBeNull();
  });

  it('returns null for plain string type', () => {
    expect(parseLiteralUnion('string')).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseLiteralUnion(undefined)).toBeNull();
  });
});

describe('extractVariantAxes', () => {
  it('emits enum + boolean axes for hx-button', () => {
    const axes = extractVariantAxes(BUTTON_DECL);
    const names = axes.map((a) => a.figmaAxisName);
    expect(names).toContain('variant');
    expect(names).toContain('size');
    expect(names).toContain('disabled');
    expect(names).toContain('loading');
    // aria-label is infrastructure — excluded
    expect(names).not.toContain('aria-label');
    // href is string content — not a variant
    expect(names).not.toContain('href');
  });

  it('emits default from stripped quotes', () => {
    const axes = extractVariantAxes(BUTTON_DECL);
    const variant = axes.find((a) => a.figmaAxisName === 'variant');
    expect(variant?.default).toBe('primary');
  });

  it('emits boolean axes with ["false", "true"] values regardless of default', () => {
    const axes = extractVariantAxes(BUTTON_DECL);
    const disabled = axes.find((a) => a.figmaAxisName === 'disabled');
    expect(disabled).toMatchObject({ type: 'boolean', values: ['false', 'true'], default: 'false' });
  });
});

describe('extractTextProperties', () => {
  it('treats href as a text property with href hint', () => {
    const props = extractTextProperties(BUTTON_DECL);
    const href = props.find((p) => p.cemAttribute === 'href');
    expect(href).toBeDefined();
    expect(href?.hint).toBe('href');
  });

  it('does not emit aria-* as text properties', () => {
    const props = extractTextProperties(BUTTON_DECL);
    expect(props.find((p) => p.cemAttribute === 'aria-label')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Regression — nameless CEM attributes (malformed input must not crash)
// ---------------------------------------------------------------------------

describe('nameless attribute handling', () => {
  const NAMELESS_DECL = {
    kind: 'class',
    tagName: 'hx-weird',
    name: 'HelixWeird',
    attributes: [
      { type: { text: "'a' | 'b'" }, default: "'a'" },
      { name: '', type: { text: 'boolean' } },
      { name: 'variant', fieldName: 'variant', type: { text: "'primary' | 'secondary'" }, default: "'primary'" },
      { name: 'label', fieldName: 'label', type: { text: 'string' } },
      { name: 'aria-label', type: { text: 'string' } },
      { name: 'id', type: { text: 'string' } },
    ],
  } as unknown as CemDeclaration;

  it('extractVariantAxes skips attributes missing a name', () => {
    const axes = extractVariantAxes(NAMELESS_DECL);
    expect(axes.map((a) => a.figmaAxisName)).toEqual(['variant']);
  });

  it('extractTextProperties skips attributes missing a name', () => {
    const props = extractTextProperties(NAMELESS_DECL);
    expect(props.map((p) => p.figmaPropertyName)).toEqual(['label']);
  });

  it('excludedAttributeNames emits named infra attrs and never undefined or empty strings', () => {
    const excluded = excludedAttributeNames(NAMELESS_DECL);
    expect(excluded).toEqual(expect.arrayContaining(['aria-label', 'id']));
    expect(excluded).not.toContain(undefined);
    expect(excluded).not.toContain('');
    for (const name of excluded) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// §7 — Tier classification
// ---------------------------------------------------------------------------

describe('classifyTier', () => {
  it('atom when no embedded hx-* tags', () => {
    expect(classifyTier(BUTTON_DECL, [])).toBe('atom');
  });

  it('molecule when 1–3 embedded hx-* tags', () => {
    expect(classifyTier(BUTTON_DECL, ['hx-icon'])).toBe('molecule');
    expect(classifyTier(BUTTON_DECL, ['hx-icon', 'hx-spinner', 'hx-badge'])).toBe('molecule');
  });

  it('organism when 4+ embedded hx-* tags', () => {
    expect(
      classifyTier(BUTTON_DECL, ['hx-icon', 'hx-spinner', 'hx-badge', 'hx-tag']),
    ).toBe('organism');
  });

  it('override wins over heuristic', () => {
    expect(classifyTier(BUTTON_DECL, [], 'organism')).toBe('organism');
  });
});

// ---------------------------------------------------------------------------
// §8 — Slots
// ---------------------------------------------------------------------------

describe('extractSlots', () => {
  it('maps default slot to figmaPropertyName=content with fallback default text', () => {
    const slots = extractSlots(BUTTON_DECL);
    const def = slots.find((s) => s.cemSlot === null);
    expect(def).toBeDefined();
    expect(def?.figmaPropertyName).toBe('content');
    expect(def?.default).toBe('Label');
  });

  it('maps named slots preserving the kebab-case name', () => {
    const slots = extractSlots(BUTTON_DECL);
    expect(slots.find((s) => s.cemSlot === 'prefix')).toBeDefined();
    expect(slots.find((s) => s.cemSlot === 'suffix')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// §9 — Token binding resolution
// ---------------------------------------------------------------------------

describe('tokenNameToPath', () => {
  it('recognizes primitive tokens ending in a numeric scale', () => {
    expect(tokenNameToPath('color-primary-500')).toEqual({
      path: 'color/primary/500',
      kind: 'primitive',
    });
  });

  it('recognizes semantic tokens with no numeric scale', () => {
    expect(tokenNameToPath('color-primary')).toEqual({
      path: 'color/primary',
      kind: 'semantic',
    });
  });

  it('recognizes border-radius primitives (t-shirt scale)', () => {
    expect(tokenNameToPath('border-radius-md')).toEqual({
      path: 'border-radius/md',
      kind: 'primitive',
    });
  });
});

describe('inferTarget', () => {
  it.each([
    ['--hx-button-bg', 'Fill'],
    ['--hx-button-color', 'Fill'],
    ['--hx-button-border-color', 'Stroke'],
    ['--hx-button-border-radius', 'CornerRadius'],
    ['--hx-card-padding', 'Padding'],
    ['--hx-stack-gap', 'Gap'],
    ['--hx-button-font-size', 'FontSize'],
    ['--hx-button-font-weight', 'FontWeight'],
    ['--hx-card-shadow', 'Effect'],
  ])('%s → %s', (name, expected) => {
    expect(inferTarget(name)).toBe(expected);
  });

  it('returns null for unknown suffix', () => {
    expect(inferTarget('--hx-button-wiggle')).toBeNull();
  });
});

describe('inferLayerSelector', () => {
  const parts = [{ name: 'button' }, { name: 'label' }];

  it('returns root when the css property lives on the component root', () => {
    expect(inferLayerSelector('--hx-button-bg', 'hx-button', parts)).toBe('root');
  });

  it('returns ::part(label) when the css property names a known part', () => {
    expect(inferLayerSelector('--hx-button-label-color', 'hx-button', parts)).toBe(
      '::part(label)',
    );
  });
});

describe('resolveBinding', () => {
  const parts = [{ name: 'button' }, { name: 'label' }];

  it('returns null when default is missing', () => {
    const out = resolveBinding(
      { name: '--hx-button-hover-bg' },
      'hx-button',
      parts,
    );
    expect(out).toBeNull();
  });

  it('resolves a primitive var() default to a primitive binding with implied semantic family', () => {
    const out = resolveBinding(
      { name: '--hx-button-bg', default: 'var(--hx-color-primary-500)' },
      'hx-button',
      parts,
    );
    expect(out?.target).toBe('Fill');
    expect(out?.fallbackPrimitive).toBe('color/primary/500');
    expect(out?.semanticToken).toBe('color/primary');
  });

  it('resolves a var() with a literal fallback and records the fallback', () => {
    const out = resolveBinding(
      { name: '--hx-button-label-color', default: 'var(--hx-color-neutral-0, #fff)' },
      'hx-button',
      parts,
    );
    expect(out?.fallbackPrimitive).toBe('color/neutral/0');
    expect(out?.literalFallback).toBe('#fff');
    expect(out?.layerSelector).toBe('::part(label)');
  });

  it('resolves a literal value to a literal-only binding', () => {
    const out = resolveBinding(
      { name: '--hx-button-border-color', default: 'transparent' },
      'hx-button',
      parts,
    );
    expect(out?.semanticToken).toBeNull();
    expect(out?.fallbackPrimitive).toBeNull();
    expect(out?.literalFallback).toBe('transparent');
  });
});

// ---------------------------------------------------------------------------
// §11 — Dependency extraction
// ---------------------------------------------------------------------------

describe('extractHxTagsFromSource', () => {
  it('finds hx-* tags in html`` template blocks', () => {
    const source = `
      import { html } from 'lit';
      // not a template: <hx-nope>
      render() {
        return html\`<hx-icon name="x"></hx-icon><div><hx-spinner></hx-spinner></div>\`;
      }
    `;
    expect(extractHxTagsFromSource(source)).toEqual(['hx-icon', 'hx-spinner']);
  });

  it('excludes the component own tag', () => {
    const source = 'const x = html`<hx-button></hx-button><hx-icon></hx-icon>`;';
    expect(extractHxTagsFromSource(source, 'hx-button')).toEqual(['hx-icon']);
  });

  it('ignores non-template occurrences', () => {
    const source = '// <hx-fake> in a comment';
    expect(extractHxTagsFromSource(source)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Description truncation
// ---------------------------------------------------------------------------

describe('truncateDescription', () => {
  it('takes the first paragraph and collapses whitespace', () => {
    expect(truncateDescription('First para.\n\nSecond para.')).toBe('First para.');
  });

  it('truncates long text at a word boundary with an ellipsis', () => {
    const long =
      'This is a very long first paragraph that will definitely exceed the 200-character limit we impose on the Figma description field because Figma has strict truncation rules when syncing descriptions from external sources like CEM.';
    const out = truncateDescription(long, 60);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith('…')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// End-to-end builder
// ---------------------------------------------------------------------------

describe('buildComponentEntry', () => {
  it('produces a complete entry for hx-button', () => {
    const entry = buildComponentEntry({
      decl: BUTTON_DECL,
      module: BUTTON_MODULE,
      templateDependencies: [],
    });
    expect(entry.tag).toBe('hx-button');
    expect(entry.className).toBe('HelixButton');
    expect(entry.modulePath).toBe('src/components/hx-button/hx-button.ts');
    expect(entry.figmaEligible).toBe(true);
    expect(entry.figmaPagePlacement).toBe('4a');
    expect(entry.tier).toBe('atom');
    expect(entry.variantAxes.length).toBeGreaterThan(0);
    expect(entry.slots.length).toBe(3);
    expect(entry.cssProperties.length).toBe(BUTTON_DECL.cssProperties!.length);
    expect(entry.excludedAttributes).toContain('aria-label');
  });

  it('emits neutral helix-metadata defaults when the declaration has no helixMeta', () => {
    const entry = buildComponentEntry({
      decl: BUTTON_DECL,
      module: BUTTON_MODULE,
      templateDependencies: [],
    });
    expect(entry.aaa).toEqual({
      certified: false,
      certifiedDate: null,
      criteria: [],
      auditUrl: null,
    });
    expect(entry.keyboardContract).toBeNull();
    expect(entry.ariaPattern).toBeNull();
    expect(entry.themeAware).toBeNull();
    expect(entry.brandAware).toBeNull();
    expect(entry.formAssociated).toBeNull();
    expect(entry.priorityTier).toBeNull();
  });

  it('mirrors the full helixMeta subset when the declaration carries one', () => {
    const declWithMeta: CemDeclaration = {
      ...BUTTON_DECL,
      aaaCertified: true,
      aaaCertifiedDate: '2026-05-15',
      helixMeta: {
        aaa: {
          certified: true,
          certifiedDate: '2026-05-15',
          criteria: ['1.4.6', '2.1.3'],
          auditUrl: 'src/components/hx-button/AAA-AUDIT.md',
        },
        keyboardContract: {
          activate: ['Enter', 'Space'],
          navigate: [],
          dismiss: [],
          disabledSuppresses: true,
        },
        ariaPattern: 'button',
        themeAware: true,
        brandAware: true,
        formAssociated: true,
        priorityTier: 'P0',
      },
    };
    const entry = buildComponentEntry({
      decl: declWithMeta,
      module: BUTTON_MODULE,
      templateDependencies: [],
    });
    expect(entry.aaa.certified).toBe(true);
    expect(entry.aaa.certifiedDate).toBe('2026-05-15');
    expect(entry.aaa.criteria).toEqual(['1.4.6', '2.1.3']);
    expect(entry.aaa.auditUrl).toBe('src/components/hx-button/AAA-AUDIT.md');
    expect(entry.keyboardContract).toEqual({
      activate: ['Enter', 'Space'],
      navigate: [],
      dismiss: [],
      disabledSuppresses: true,
    });
    expect(entry.ariaPattern).toBe('button');
    expect(entry.themeAware).toBe(true);
    expect(entry.brandAware).toBe(true);
    expect(entry.formAssociated).toBe(true);
    expect(entry.priorityTier).toBe('P0');
  });

  it('falls back to top-level aaaCertified when helixMeta.aaa.certified is missing', () => {
    const declWithBackCompatOnly: CemDeclaration = {
      ...BUTTON_DECL,
      aaaCertified: true,
      aaaCertifiedDate: '2026-05-15',
    };
    const entry = buildComponentEntry({
      decl: declWithBackCompatOnly,
      module: BUTTON_MODULE,
      templateDependencies: [],
    });
    expect(entry.aaa.certified).toBe(true);
    expect(entry.aaa.certifiedDate).toBe('2026-05-15');
  });
});
