/**
 * Plugin-level smoke test for cem-plugins/helix-metadata.mjs.
 *
 * Pure-Node suite: exercises the parser helpers + the assembleMetadata
 * pipeline with a synthetic tag list. Avoids spinning up the full
 * @custom-elements-manifest/analyzer to keep the test cheap and deterministic;
 * the analyzer integration is exercised end-to-end by the `pnpm cem` step
 * during the cert-toolkit dry-run (Phase B.2).
 *
 * Runner: vitest.scripts.config.ts (Node environment) — paired with the
 * existing scripts/__tests__ suite.
 */

import { describe, expect, it } from 'vitest';

// @ts-expect-error — plain .mjs module without .d.ts; runtime export shape is
// stable and validated below via the __test__ surface.
import plugin, { helixMetadataPlugin, __test__ } from '../helix-metadata.mjs';

const {
  parseList,
  parseBoolean,
  parseEnum,
  parseKeyboardContract,
  assembleMetadata,
  HANDLED_TAGS,
  PRIORITY_TIER_VALUES,
  STABILITY_VALUES,
  REACT_WRAPPER_STATUS_VALUES,
  CLINICAL_CONTEXT_VALUES,
} = __test__;

const PRIORITY_INDEX = new Map<string, string>([
  ['hx-button', 'P0'],
  ['hx-table', 'P1'],
  ['hx-badge', 'P2'],
  ['hx-theme', 'exempt'],
]);

describe('helix-metadata plugin — exports', () => {
  it('default export and named export agree', () => {
    expect(plugin).toBe(helixMetadataPlugin);
  });

  it('plugin factory returns the analyzer-shaped object', () => {
    const instance = helixMetadataPlugin({ priorityTierIndex: PRIORITY_INDEX });
    expect(instance.name).toBe('HELIX-METADATA');
    expect(typeof instance.analyzePhase).toBe('function');
  });

  it('handled-tag set covers the full Phase B.1 schema', () => {
    // Sanity guard against accidental tag-handling drift.
    const expected = [
      'aaa-certified',
      'aaa-criteria',
      'aaa-audit',
      'keyboard-contract',
      'aria-pattern',
      'aria-pattern-source',
      'forced-colors-supported',
      'screen-reader-tested',
      'stability',
      'since',
      'form-associated',
      'theme-aware',
      'brand-aware',
      'composes-with',
      'drupal-sdc-eligible',
      'react-wrapper-status',
      'figma-component-name',
      'figma-page',
      'priority-tier',
      'phi-handles',
      'clinical-context',
    ];
    for (const tag of expected) expect(HANDLED_TAGS.has(tag)).toBe(true);
    expect(HANDLED_TAGS.size).toBe(expected.length);
  });

  it('enum allow-lists match the documented schema', () => {
    expect([...PRIORITY_TIER_VALUES].sort()).toEqual(['P0', 'P1', 'P2', 'exempt']);
    expect([...STABILITY_VALUES].sort()).toEqual(['beta', 'experimental', 'stable']);
    expect([...REACT_WRAPPER_STATUS_VALUES].sort()).toEqual(['complete', 'none', 'partial']);
    expect([...CLINICAL_CONTEXT_VALUES].sort()).toEqual(['high', 'low', 'medium', 'none']);
  });
});

describe('helix-metadata plugin — value parsers', () => {
  it('parseList trims, drops empties, splits on comma', () => {
    expect(parseList('1.4.6, 2.1.3,2.4.13 , ,')).toEqual(['1.4.6', '2.1.3', '2.4.13']);
    expect(parseList('')).toEqual([]);
    expect(parseList(undefined)).toEqual([]);
  });

  it('parseBoolean handles canonical strings and rejects garbage', () => {
    expect(parseBoolean('true')).toBe(true);
    expect(parseBoolean('FALSE')).toBe(false);
    expect(parseBoolean(' True ')).toBe(true);
    expect(parseBoolean('maybe')).toBeUndefined();
    expect(parseBoolean('')).toBeUndefined();
    expect(parseBoolean(undefined)).toBeUndefined();
  });

  it('parseEnum returns the value when allowed, undefined otherwise', () => {
    expect(parseEnum('stable', STABILITY_VALUES)).toBe('stable');
    expect(parseEnum('hyper-stable', STABILITY_VALUES)).toBeUndefined();
    expect(parseEnum(' beta ', STABILITY_VALUES)).toBe('beta');
  });

  it('parseKeyboardContract splits semicolons + comma-lists known keys', () => {
    const out = parseKeyboardContract(
      'activate=Enter,Space; navigate=Arrow; dismiss=Escape; disabled-suppresses=true',
    );
    expect(out).toEqual({
      activate: ['Enter', 'Space'],
      navigate: ['Arrow'],
      dismiss: ['Escape'],
      disabledSuppresses: true,
    });
  });

  it('parseKeyboardContract camelCases unknown kebab keys', () => {
    const out = parseKeyboardContract('activate=Enter; type-ahead-window=500');
    expect(out).toEqual({ activate: ['Enter'], typeAheadWindow: '500' });
  });

  it('parseKeyboardContract returns undefined for empty / no-op input', () => {
    expect(parseKeyboardContract('')).toBeUndefined();
    expect(parseKeyboardContract('   ')).toBeUndefined();
    expect(parseKeyboardContract(';;')).toBeUndefined();
  });
});

describe('helix-metadata plugin — assembleMetadata', () => {
  it('emits nothing when no tags and no priority fallback', () => {
    const result = assembleMetadata([], {
      tagName: 'hx-unknown',
      priorityTierIndex: PRIORITY_INDEX,
    });
    expect(result.helixMeta).toBeUndefined();
    expect(result.aaaCertified).toBeUndefined();
    expect(result.aaaCertifiedDate).toBeUndefined();
  });

  it('auto-populates priorityTier from the index when tag is absent', () => {
    const result = assembleMetadata([], {
      tagName: 'hx-button',
      priorityTierIndex: PRIORITY_INDEX,
    });
    expect(result.helixMeta).toEqual({ priorityTier: 'P0' });
  });

  it('explicit @priority-tier wins over the index fallback', () => {
    const result = assembleMetadata(
      [{ tag: 'priority-tier', value: 'P1' }],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.priorityTier).toBe('P1');
  });

  it('rejects unknown @priority-tier values and falls back to the index', () => {
    const result = assembleMetadata(
      [{ tag: 'priority-tier', value: 'P9' }],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.priorityTier).toBe('P0');
  });

  it('exempt tier round-trips through the index', () => {
    const result = assembleMetadata([], {
      tagName: 'hx-theme',
      priorityTierIndex: PRIORITY_INDEX,
    });
    expect(result.helixMeta?.priorityTier).toBe('exempt');
  });

  it('aaa-certified populates BOTH back-compat fields and helixMeta.aaa', () => {
    const result = assembleMetadata(
      [
        { tag: 'aaa-certified', value: '2026-05-15' },
        { tag: 'aaa-criteria', value: '1.4.6, 2.1.3, 2.4.13' },
        { tag: 'aaa-audit', value: 'src/components/hx-button/AAA-AUDIT.md' },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.aaaCertified).toBe(true);
    expect(result.aaaCertifiedDate).toBe('2026-05-15');
    expect(result.helixMeta?.aaa).toEqual({
      certified: true,
      certifiedDate: '2026-05-15',
      criteria: ['1.4.6', '2.1.3', '2.4.13'],
      auditUrl: 'src/components/hx-button/AAA-AUDIT.md',
    });
  });

  it('bare @aaa-certified (no date) still flips the certified flag', () => {
    const result = assembleMetadata(
      [{ tag: 'aaa-certified', value: '' }],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.aaaCertified).toBe(true);
    expect(result.aaaCertifiedDate).toBeUndefined();
    expect(result.helixMeta?.aaa).toEqual({ certified: true });
  });

  it('keyboard-contract and aria-pattern land at the top of helixMeta', () => {
    const result = assembleMetadata(
      [
        { tag: 'keyboard-contract', value: 'activate=Enter,Space; disabled-suppresses=true' },
        { tag: 'aria-pattern', value: 'button' },
        {
          tag: 'aria-pattern-source',
          value: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
        },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.keyboardContract).toEqual({
      activate: ['Enter', 'Space'],
      disabledSuppresses: true,
    });
    expect(result.helixMeta?.ariaPattern).toBe('button');
    expect(result.helixMeta?.ariaPatternSource).toBe(
      'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
    );
  });

  it('boolean tags reject non-boolean values silently', () => {
    const result = assembleMetadata(
      [
        { tag: 'forced-colors-supported', value: 'sometimes' },
        { tag: 'theme-aware', value: 'true' },
        { tag: 'brand-aware', value: 'false' },
        { tag: 'form-associated', value: 'true' },
        { tag: 'drupal-sdc-eligible', value: 'true' },
        { tag: 'phi-handles', value: 'false' },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.forcedColorsSupported).toBeUndefined();
    expect(result.helixMeta?.themeAware).toBe(true);
    expect(result.helixMeta?.brandAware).toBe(false);
    expect(result.helixMeta?.formAssociated).toBe(true);
    expect(result.helixMeta?.drupalSdcEligible).toBe(true);
    expect(result.helixMeta?.phiHandles).toBe(false);
  });

  it('enum tags validate against the documented allow-list', () => {
    const result = assembleMetadata(
      [
        { tag: 'stability', value: 'stable' },
        { tag: 'react-wrapper-status', value: 'partial' },
        { tag: 'clinical-context', value: 'medium' },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.stability).toBe('stable');
    expect(result.helixMeta?.reactWrapperStatus).toBe('partial');
    expect(result.helixMeta?.clinicalContext).toBe('medium');
  });

  it('list-valued tags split on commas and trim members', () => {
    const result = assembleMetadata(
      [
        { tag: 'composes-with', value: 'hx-form, hx-field' },
        { tag: 'screen-reader-tested', value: 'NVDA, JAWS, VoiceOver' },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.composesWith).toEqual(['hx-form', 'hx-field']);
    expect(result.helixMeta?.screenReaderTested).toEqual(['NVDA', 'JAWS', 'VoiceOver']);
  });

  it('figma-* tags collapse into a figma sub-object', () => {
    const result = assembleMetadata(
      [
        { tag: 'figma-component-name', value: 'hx-button' },
        { tag: 'figma-page', value: '4a' },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.helixMeta?.figma).toEqual({ componentName: 'hx-button', page: '4a' });
  });

  it('full Phase B.1 tag schema round-trips end-to-end', () => {
    const result = assembleMetadata(
      [
        { tag: 'aaa-certified', value: '2026-05-15' },
        { tag: 'aaa-criteria', value: '1.4.6, 2.1.3, 2.4.13, 2.5.5' },
        { tag: 'aaa-audit', value: 'src/components/hx-button/AAA-AUDIT.md' },
        {
          tag: 'keyboard-contract',
          value: 'activate=Enter,Space; disabled-suppresses=true',
        },
        { tag: 'aria-pattern', value: 'button' },
        {
          tag: 'aria-pattern-source',
          value: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
        },
        { tag: 'forced-colors-supported', value: 'true' },
        { tag: 'screen-reader-tested', value: 'NVDA, JAWS, VoiceOver' },
        { tag: 'stability', value: 'stable' },
        { tag: 'since', value: '3.5.0' },
        { tag: 'form-associated', value: 'true' },
        { tag: 'theme-aware', value: 'true' },
        { tag: 'brand-aware', value: 'true' },
        { tag: 'composes-with', value: 'hx-form, hx-field' },
        { tag: 'drupal-sdc-eligible', value: 'true' },
        { tag: 'react-wrapper-status', value: 'complete' },
        { tag: 'figma-component-name', value: 'hx-button' },
        { tag: 'figma-page', value: '4a' },
        { tag: 'priority-tier', value: 'P0' },
        { tag: 'phi-handles', value: 'false' },
        { tag: 'clinical-context', value: 'none' },
      ],
      { tagName: 'hx-button', priorityTierIndex: PRIORITY_INDEX },
    );
    expect(result.aaaCertified).toBe(true);
    expect(result.aaaCertifiedDate).toBe('2026-05-15');
    expect(result.helixMeta).toEqual({
      aaa: {
        certified: true,
        certifiedDate: '2026-05-15',
        criteria: ['1.4.6', '2.1.3', '2.4.13', '2.5.5'],
        auditUrl: 'src/components/hx-button/AAA-AUDIT.md',
      },
      keyboardContract: {
        activate: ['Enter', 'Space'],
        disabledSuppresses: true,
      },
      ariaPattern: 'button',
      ariaPatternSource: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/',
      forcedColorsSupported: true,
      screenReaderTested: ['NVDA', 'JAWS', 'VoiceOver'],
      stability: 'stable',
      since: '3.5.0',
      formAssociated: true,
      themeAware: true,
      brandAware: true,
      composesWith: ['hx-form', 'hx-field'],
      drupalSdcEligible: true,
      reactWrapperStatus: 'complete',
      figma: { componentName: 'hx-button', page: '4a' },
      priorityTier: 'P0',
      phiHandles: false,
      clinicalContext: 'none',
    });
  });
});
