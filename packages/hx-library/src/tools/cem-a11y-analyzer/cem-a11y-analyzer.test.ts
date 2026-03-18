import { describe, expect, it } from 'vitest';
import { analyzeAria } from './analyzers/aria-analyzer.js';
import { analyzeFocus } from './analyzers/focus-analyzer.js';
import { analyzeForm } from './analyzers/form-analyzer.js';
import { analyzeKeyboard } from './analyzers/keyboard-analyzer.js';
import { analyzeLabel } from './analyzers/label-analyzer.js';
import { analyzeMotion } from './analyzers/motion-analyzer.js';
import { analyzeCEM, scoreToGrade } from './index.js';
import {
  buildComponentProfile,
  computeDimensionAverages,
  computeGradeDistribution,
  computeLibraryScore,
} from './scorer.js';
import { generateReport } from './reporter.js';
import type {
  AnalysisOptions,
  AnalyzerResult,
  CemDeclaration,
  CustomElementsManifest,
} from './types.js';

// ─── Test Fixtures ────────────────────────────────────────────────────

const EMPTY_OPTIONS: AnalysisOptions = {};

/** Minimal custom element with no a11y features. */
function makeBareBones(): CemDeclaration {
  return {
    kind: 'class',
    name: 'BareElement',
    tagName: 'bare-element',
    members: [
      { kind: 'field', name: 'variant', type: { text: 'string' }, default: "'default'" },
    ],
  };
}

/** Form-associated custom element with ElementInternals. */
function makeFormElement(): CemDeclaration {
  return {
    kind: 'class',
    name: 'FormInput',
    tagName: 'form-input',
    members: [
      { kind: 'field', name: 'formAssociated', static: true, default: 'true' },
      { kind: 'field', name: '_internals', privacy: 'private' },
      { kind: 'field', name: 'label', type: { text: 'string' }, default: "''" },
      { kind: 'field', name: 'form' },
      { kind: 'field', name: 'validity' },
      { kind: 'field', name: 'validationMessage' },
      { kind: 'method', name: 'formResetCallback' },
      { kind: 'method', name: 'formDisabledCallback' },
      { kind: 'method', name: 'formStateRestoreCallback' },
    ],
    slots: [{ name: 'label', description: 'Custom label content' }],
  };
}

/** Fully accessible button-like element. */
function makeAccessibleButton(): CemDeclaration {
  return {
    kind: 'class',
    name: 'A11yButton',
    tagName: 'a11y-button',
    description: 'An accessible button supporting keyboard interaction.',
    members: [
      { kind: 'field', name: 'formAssociated', static: true, default: 'true' },
      { kind: 'field', name: '_internals', privacy: 'private' },
      { kind: 'field', name: 'role', default: "'button'" },
      {
        kind: 'field',
        name: 'ariaLabel',
        type: { text: 'string | null' },
        default: 'null',
        description: 'Accessible label forwarded to the inner button. Required for icon-only usage.',
        attribute: 'aria-label',
      },
      {
        kind: 'field',
        name: 'label',
        type: { text: 'string' },
        default: "''",
        description: 'Visible label text for the button.',
      },
      { kind: 'field', name: 'tabindex', attribute: 'tabindex' },
      {
        kind: 'method',
        name: '_handleKeyDown',
        privacy: 'private',
        description: 'Handles keydown events for Enter and Space key activation.',
      },
      { kind: 'method', name: 'formResetCallback' },
      { kind: 'method', name: 'formDisabledCallback' },
      { kind: 'field', name: 'form' },
    ],
    cssParts: [
      { name: 'button', description: 'The button element.' },
      { name: 'focus-ring', description: 'The focus indicator ring.' },
    ],
    cssProperties: [
      { name: '--a11y-button-focus-color', description: 'Focus ring color.' },
    ],
    slots: [{ name: '', description: 'Button content.' }],
  };
}

/** Element with animation CSS properties. */
function makeAnimatedElement(): CemDeclaration {
  return {
    kind: 'class',
    name: 'AnimatedCard',
    tagName: 'animated-card',
    members: [
      {
        kind: 'field',
        name: 'animate',
        type: { text: 'boolean' },
        description: 'Controls the entrance animation.',
      },
    ],
    cssProperties: [
      { name: '--card-transition-duration', description: 'Duration of card transitions.' },
      { name: '--card-animation-easing', description: 'Easing function for animations.' },
    ],
  };
}

/** Minimal manifest wrapper. */
function wrapInManifest(declarations: CemDeclaration[]): CustomElementsManifest {
  return {
    schemaVersion: '1.0.0',
    modules: declarations.map((decl) => ({
      kind: 'javascript-module' as const,
      path: `src/components/${decl.tagName}/${decl.tagName}.ts`,
      declarations: [decl],
    })),
  };
}

/** Mock Shoelace-style CEM for external library testing. */
function makeShoelaceStyleManifest(): CustomElementsManifest {
  return {
    schemaVersion: '1.0.0',
    modules: [
      {
        kind: 'javascript-module',
        path: 'src/components/sl-button.ts',
        declarations: [
          {
            kind: 'class',
            name: 'SlButton',
            tagName: 'sl-button',
            superclass: { name: 'LitElement', package: 'lit' },
            members: [
              { kind: 'field', name: 'formAssociated', static: true, default: 'true' },
              { kind: 'field', name: '_internals', privacy: 'private' },
              { kind: 'field', name: 'variant', type: { text: 'string' } },
              {
                kind: 'field',
                name: 'label',
                type: { text: 'string' },
                description: 'Accessible label for the button.',
              },
              { kind: 'method', name: 'formResetCallback' },
            ],
            cssParts: [{ name: 'base', description: 'The button wrapper.' }],
            slots: [{ name: '', description: 'Default slot for button content.' }],
          },
        ],
      },
      {
        kind: 'javascript-module',
        path: 'src/components/sl-input.ts',
        declarations: [
          {
            kind: 'class',
            name: 'SlInput',
            tagName: 'sl-input',
            members: [
              { kind: 'field', name: 'formAssociated', static: true, default: 'true' },
              { kind: 'field', name: '_internals', privacy: 'private' },
              { kind: 'field', name: 'label', type: { text: 'string' }, description: 'The input label.' },
              {
                kind: 'field',
                name: 'ariaLabel',
                type: { text: 'string' },
                attribute: 'aria-label',
                description: 'Accessible label for screen readers.',
              },
              { kind: 'field', name: 'validity' },
              { kind: 'method', name: 'formResetCallback' },
              { kind: 'method', name: 'formDisabledCallback' },
            ],
            slots: [
              { name: 'label', description: 'Custom label content.' },
              { name: 'help-text', description: 'Help text content.' },
            ],
          },
        ],
      },
    ],
  };
}

// ─── ARIA Analyzer Tests ──────────────────────────────────────────────

describe('aria-analyzer', () => {
  it('detects role property', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeAria(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.dimension).toBe('ariaSupport');
    expect(result.score).toBeGreaterThan(0);
    expect(result.findings.some((f) => /role/i.test(f))).toBe(true);
  });

  it('detects aria-* properties', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeAria(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /ariaLabel/i.test(f))).toBe(true);
  });

  it('returns recommendations for bare element', async () => {
    const decl = makeBareBones();
    const result = await analyzeAria(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.score).toBe(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('scores within 0-100 range', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeAria(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ─── Form Analyzer Tests ─────────────────────────────────────────────

describe('form-analyzer', () => {
  it('detects full form association', async () => {
    const decl = makeFormElement();
    const result = await analyzeForm(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.dimension).toBe('formAssociation');
    expect(result.score).toBeGreaterThan(50);
    expect(result.findings.some((f) => /formAssociated/i.test(f))).toBe(true);
    expect(result.findings.some((f) => /ElementInternals/i.test(f))).toBe(true);
  });

  it('returns 0 for non-form element', async () => {
    const decl = makeBareBones();
    const result = await analyzeForm(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.score).toBe(0);
    expect(result.recommendations).toHaveLength(0);
  });

  it('recommends missing callbacks', async () => {
    const decl: CemDeclaration = {
      kind: 'class',
      name: 'PartialForm',
      tagName: 'partial-form',
      members: [
        { kind: 'field', name: 'formAssociated', static: true, default: 'true' },
        { kind: 'field', name: '_internals', privacy: 'private' },
      ],
    };
    const result = await analyzeForm(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.recommendations.some((r) => /callback/i.test(r.message))).toBe(true);
  });
});

// ─── Keyboard Analyzer Tests ─────────────────────────────────────────

describe('keyboard-analyzer', () => {
  it('detects keyboard handler methods', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeKeyboard(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.dimension).toBe('keyboardAccess');
    expect(result.score).toBeGreaterThan(0);
    expect(result.findings.some((f) => /_handleKeyDown/i.test(f))).toBe(true);
  });

  it('detects keyboard docs in description', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeKeyboard(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /keyboard/i.test(f))).toBe(true);
  });

  it('analyzes source code when readFile provided', async () => {
    const decl = makeBareBones();
    const options: AnalysisOptions = {
      readFile: async () =>
        `this.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.click(); });`,
    };
    const result = await analyzeKeyboard(decl, 'test.ts', options);
    expect(result.score).toBeGreaterThan(0);
    expect(result.findings.some((f) => /source/i.test(f))).toBe(true);
  });

  it('handles readFile returning null', async () => {
    const decl = makeBareBones();
    const options: AnalysisOptions = { readFile: async () => null };
    const result = await analyzeKeyboard(decl, 'test.ts', options);
    expect(result.score).toBe(0);
  });

  it('recommends keyboard support for bare element', async () => {
    const decl = makeBareBones();
    const result = await analyzeKeyboard(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

// ─── Focus Analyzer Tests ────────────────────────────────────────────

describe('focus-analyzer', () => {
  it('detects tabindex property', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeFocus(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.dimension).toBe('focusManagement');
    expect(result.score).toBeGreaterThan(0);
    expect(result.findings.some((f) => /tabindex/i.test(f))).toBe(true);
  });

  it('detects focus-related CSS parts', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeFocus(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /focus.*CSS part/i.test(f))).toBe(true);
  });

  it('detects focus CSS custom properties', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeFocus(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /focus.*CSS custom/i.test(f))).toBe(true);
  });

  it('returns 0 for bare element', async () => {
    const decl = makeBareBones();
    const result = await analyzeFocus(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.score).toBe(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('analyzes source code when readFile provided', async () => {
    const decl = makeBareBones();
    const options: AnalysisOptions = {
      readFile: async () => `this.shadowRoot.querySelector('button').focus(); document.activeElement;`,
    };
    const result = await analyzeFocus(decl, 'test.ts', options);
    expect(result.score).toBeGreaterThan(0);
  });
});

// ─── Label Analyzer Tests ────────────────────────────────────────────

describe('label-analyzer', () => {
  it('detects label property', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeLabel(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.dimension).toBe('labelSupport');
    expect(result.score).toBeGreaterThan(0);
    expect(result.findings.some((f) => /label property/i.test(f))).toBe(true);
  });

  it('detects aria-label support', async () => {
    const decl = makeAccessibleButton();
    const result = await analyzeLabel(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /aria-label/i.test(f))).toBe(true);
  });

  it('detects label slot', async () => {
    const decl = makeFormElement();
    const result = await analyzeLabel(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /label slot/i.test(f))).toBe(true);
  });

  it('recommends label for bare element', async () => {
    const decl = makeBareBones();
    const result = await analyzeLabel(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0].severity).toBe('major');
  });
});

// ─── Motion Analyzer Tests ───────────────────────────────────────────

describe('motion-analyzer', () => {
  it('scores high for non-animated elements', async () => {
    const decl = makeBareBones();
    const result = await analyzeMotion(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.dimension).toBe('motionSafety');
    expect(result.score).toBeGreaterThan(50);
    expect(result.findings.some((f) => /motion-safe/i.test(f))).toBe(true);
  });

  it('detects animation CSS properties', async () => {
    const decl = makeAnimatedElement();
    const result = await analyzeMotion(decl, 'test.ts', EMPTY_OPTIONS);
    expect(result.findings.some((f) => /animation/i.test(f))).toBe(true);
  });

  it('rewards prefers-reduced-motion in source', async () => {
    const decl = makeAnimatedElement();
    const options: AnalysisOptions = {
      readFile: async () =>
        `@media (prefers-reduced-motion: reduce) { .card { animation: none; } }`,
    };
    const result = await analyzeMotion(decl, 'test.ts', options);
    expect(result.score).toBeGreaterThan(40);
    expect(result.findings.some((f) => /prefers-reduced-motion/i.test(f))).toBe(true);
  });

  it('recommends reduced motion when animations lack media query', async () => {
    const decl = makeAnimatedElement();
    const options: AnalysisOptions = {
      readFile: async () => `const styles = css\`.card { transition: all 0.3s; }\`;`,
    };
    const result = await analyzeMotion(decl, 'test.ts', options);
    expect(result.recommendations.some((r) => /prefers-reduced-motion/i.test(r.message))).toBe(true);
  });
});

// ─── Scorer Tests ────────────────────────────────────────────────────

describe('scorer', () => {
  it('scoreToGrade maps correctly', () => {
    expect(scoreToGrade(95)).toBe('A');
    expect(scoreToGrade(90)).toBe('A');
    expect(scoreToGrade(85)).toBe('B');
    expect(scoreToGrade(80)).toBe('B');
    expect(scoreToGrade(75)).toBe('C');
    expect(scoreToGrade(65)).toBe('D');
    expect(scoreToGrade(50)).toBe('F');
    expect(scoreToGrade(0)).toBe('F');
  });

  it('buildComponentProfile produces valid structure', () => {
    const results: AnalyzerResult[] = [
      {
        dimension: 'ariaSupport',
        score: 80,
        maxScore: 100,
        findings: ['Has role'],
        recommendations: [],
      },
      {
        dimension: 'formAssociation',
        score: 60,
        maxScore: 100,
        findings: ['Has form'],
        recommendations: [],
      },
    ];

    const profile = buildComponentProfile('test-el', 'TestEl', results);
    expect(profile.tagName).toBe('test-el');
    expect(profile.className).toBe('TestEl');
    expect(profile.dimensions.ariaSupport.score).toBe(80);
    expect(profile.dimensions.formAssociation.score).toBe(60);
    // Missing dimensions default to 0
    expect(profile.dimensions.keyboardAccess.score).toBe(0);
    expect(profile.overallScore).toBeGreaterThanOrEqual(0);
    expect(profile.overallScore).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(profile.grade);
  });

  it('clamps scores to 0-100', () => {
    const results: AnalyzerResult[] = [
      { dimension: 'ariaSupport', score: 150, maxScore: 100, findings: [], recommendations: [] },
      { dimension: 'formAssociation', score: -10, maxScore: 100, findings: [], recommendations: [] },
    ];
    const profile = buildComponentProfile('test-el', 'TestEl', results);
    expect(profile.dimensions.ariaSupport.score).toBe(100);
    expect(profile.dimensions.formAssociation.score).toBe(0);
  });

  it('computeLibraryScore averages component scores', () => {
    const profiles = [
      buildComponentProfile('a', 'A', [
        { dimension: 'ariaSupport', score: 100, maxScore: 100, findings: [], recommendations: [] },
      ]),
      buildComponentProfile('b', 'B', [
        { dimension: 'ariaSupport', score: 50, maxScore: 100, findings: [], recommendations: [] },
      ]),
    ];
    const libScore = computeLibraryScore(profiles);
    expect(libScore).toBeGreaterThanOrEqual(0);
    expect(libScore).toBeLessThanOrEqual(100);
  });

  it('computeLibraryScore returns 0 for empty array', () => {
    expect(computeLibraryScore([])).toBe(0);
  });

  it('computeGradeDistribution counts correctly', () => {
    const profiles = [
      buildComponentProfile('a', 'A', [
        { dimension: 'ariaSupport', score: 95, maxScore: 100, findings: [], recommendations: [] },
        { dimension: 'formAssociation', score: 95, maxScore: 100, findings: [], recommendations: [] },
        { dimension: 'keyboardAccess', score: 95, maxScore: 100, findings: [], recommendations: [] },
        { dimension: 'focusManagement', score: 95, maxScore: 100, findings: [], recommendations: [] },
        { dimension: 'labelSupport', score: 95, maxScore: 100, findings: [], recommendations: [] },
        { dimension: 'motionSafety', score: 95, maxScore: 100, findings: [], recommendations: [] },
      ]),
    ];
    const dist = computeGradeDistribution(profiles);
    expect(dist.A).toBe(1);
    expect(dist.F).toBe(0);
  });

  it('computeDimensionAverages handles empty components', () => {
    const avgs = computeDimensionAverages([]);
    expect(avgs.ariaSupport).toBe(0);
    expect(avgs.motionSafety).toBe(0);
  });
});

// ─── Reporter Tests ──────────────────────────────────────────────────

describe('reporter', () => {
  it('generates valid report structure', () => {
    const profiles = [
      buildComponentProfile('test-el', 'TestEl', [
        {
          dimension: 'ariaSupport',
          score: 70,
          maxScore: 100,
          findings: ['Has role'],
          recommendations: [
            {
              component: 'test-el',
              dimension: 'ariaSupport',
              severity: 'minor',
              message: 'Add more ARIA attributes.',
            },
          ],
        },
      ]),
    ];

    const report = generateReport(profiles);
    expect(report.libraryScore).toBeGreaterThanOrEqual(0);
    expect(report.libraryScore).toBeLessThanOrEqual(100);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.libraryGrade);
    expect(report.componentCount).toBe(1);
    expect(report.components).toHaveLength(1);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.summary.totalComponents).toBe(1);
    expect(report.summary.gradeDistribution).toBeDefined();
    expect(report.summary.dimensionAverages).toBeDefined();
  });

  it('sorts recommendations by severity', () => {
    const profiles = [
      buildComponentProfile('a', 'A', [
        {
          dimension: 'ariaSupport',
          score: 50,
          maxScore: 100,
          findings: [],
          recommendations: [
            { component: 'a', dimension: 'ariaSupport', severity: 'info', message: 'Info' },
            { component: 'a', dimension: 'ariaSupport', severity: 'critical', message: 'Critical' },
            { component: 'a', dimension: 'ariaSupport', severity: 'major', message: 'Major' },
          ],
        },
      ]),
    ];

    const report = generateReport(profiles);
    expect(report.recommendations[0].severity).toBe('critical');
    expect(report.recommendations[1].severity).toBe('major');
    expect(report.recommendations[2].severity).toBe('info');
  });
});

// ─── Integration: analyzeCEM ──────────────────────────────────────────

describe('analyzeCEM', () => {
  it('analyzes a manifest with multiple components', async () => {
    const manifest = wrapInManifest([makeAccessibleButton(), makeBareBones(), makeFormElement()]);
    const report = await analyzeCEM(manifest);

    expect(report.componentCount).toBe(3);
    expect(report.libraryScore).toBeGreaterThanOrEqual(0);
    expect(report.libraryScore).toBeLessThanOrEqual(100);
    expect(report.components).toHaveLength(3);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('throws on malformed manifest', async () => {
    const bad = { schemaVersion: '1.0.0' } as unknown as CustomElementsManifest;
    await expect(analyzeCEM(bad)).rejects.toThrow(/missing modules/i);
  });

  it('handles empty modules array', async () => {
    const manifest: CustomElementsManifest = { schemaVersion: '1.0.0', modules: [] };
    const report = await analyzeCEM(manifest);
    expect(report.componentCount).toBe(0);
    expect(report.libraryScore).toBe(0);
  });

  it('skips declarations without tagName', async () => {
    const manifest: CustomElementsManifest = {
      schemaVersion: '1.0.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/mixin.ts',
          declarations: [{ kind: 'mixin' as const, name: 'SomeMixin' } as CemDeclaration],
        },
      ],
    };
    const report = await analyzeCEM(manifest);
    expect(report.componentCount).toBe(0);
  });

  it('respects skipDimensions option', async () => {
    const manifest = wrapInManifest([makeAccessibleButton()]);
    const report = await analyzeCEM(manifest, { skipDimensions: ['motionSafety', 'formAssociation'] });

    const component = report.components[0];
    // Skipped dimensions should have 0 score (default)
    expect(component.dimensions.motionSafety.score).toBe(0);
    expect(component.dimensions.formAssociation.score).toBe(0);
    // Non-skipped dimensions should be analyzed
    expect(component.dimensions.ariaSupport.score).toBeGreaterThan(0);
  });

  it('passes readFile to analyzers', async () => {
    const manifest = wrapInManifest([makeBareBones()]);
    let readFileCalled = false;
    const options: AnalysisOptions = {
      readFile: async () => {
        readFileCalled = true;
        return `addEventListener('keydown', (e) => { if (e.key === 'Enter') {} });`;
      },
    };
    await analyzeCEM(manifest, options);
    expect(readFileCalled).toBe(true);
  });
});

// ─── External Library CEM Tests ──────────────────────────────────────

describe('external library CEM', () => {
  it('analyzes Shoelace-style CEM fixture', async () => {
    const manifest = makeShoelaceStyleManifest();
    const report = await analyzeCEM(manifest);

    expect(report.componentCount).toBe(2);
    expect(report.libraryScore).toBeGreaterThanOrEqual(0);
    expect(report.libraryScore).toBeLessThanOrEqual(100);

    // sl-button should have some form and label scores
    const slButton = report.components.find((c) => c.tagName === 'sl-button');
    expect(slButton).toBeDefined();
    expect(slButton?.dimensions.formAssociation.score).toBeGreaterThan(0);
    expect(slButton?.dimensions.labelSupport.score).toBeGreaterThan(0);

    // sl-input should score higher on form + label
    const slInput = report.components.find((c) => c.tagName === 'sl-input');
    expect(slInput).toBeDefined();
    expect(slInput?.dimensions.formAssociation.score).toBeGreaterThan(0);
    expect(slInput?.dimensions.labelSupport.score).toBeGreaterThan(0);
  });
});

// ─── Self-Validation: HELiX CEM ──────────────────────────────────────

describe('self-validation', () => {
  it('produces valid scores against HELiX CEM', async () => {
    // Read HELiX's own CEM
    const fs = await import('fs');
    const path = await import('path');
    const cemPath = path.resolve(__dirname, '../../../custom-elements.json');

    let manifest: CustomElementsManifest;
    try {
      const raw = fs.readFileSync(cemPath, 'utf8');
      manifest = JSON.parse(raw) as CustomElementsManifest;
    } catch {
      // If CEM not available, skip gracefully per deviation rules
      console.warn('HELiX CEM not found — skipping self-validation');
      return;
    }

    const report = await analyzeCEM(manifest);

    // Library score in valid range
    expect(report.libraryScore).toBeGreaterThanOrEqual(0);
    expect(report.libraryScore).toBeLessThanOrEqual(100);

    // Grade is valid
    expect(['A', 'B', 'C', 'D', 'F']).toContain(report.libraryGrade);

    // Should find multiple components
    expect(report.componentCount).toBeGreaterThan(10);

    // Every component has all 6 dimensions
    for (const component of report.components) {
      expect(component.dimensions.ariaSupport).toBeDefined();
      expect(component.dimensions.formAssociation).toBeDefined();
      expect(component.dimensions.keyboardAccess).toBeDefined();
      expect(component.dimensions.focusManagement).toBeDefined();
      expect(component.dimensions.labelSupport).toBeDefined();
      expect(component.dimensions.motionSafety).toBeDefined();

      // All scores in valid range
      for (const dim of Object.values(component.dimensions)) {
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.score).toBeLessThanOrEqual(100);
      }

      // Grade is valid
      expect(['A', 'B', 'C', 'D', 'F']).toContain(component.grade);
    }

    // Recommendations are present and actionable
    expect(report.recommendations.length).toBeGreaterThan(0);
    for (const rec of report.recommendations) {
      expect(rec.component).toBeTruthy();
      expect(rec.dimension).toBeTruthy();
      expect(rec.message).toBeTruthy();
      expect(['critical', 'major', 'minor', 'info']).toContain(rec.severity);
    }

    // Summary statistics are valid
    expect(report.summary.totalComponents).toBe(report.componentCount);
    expect(report.summary.averageScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.averageScore).toBeLessThanOrEqual(100);

    // Consistent across runs
    const report2 = await analyzeCEM(manifest);
    expect(report2.libraryScore).toBe(report.libraryScore);
    expect(report2.componentCount).toBe(report.componentCount);
  });
});
