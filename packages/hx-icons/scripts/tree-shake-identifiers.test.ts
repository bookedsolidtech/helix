import { describe, expect, it } from 'vitest';

import {
  assignIdentifiers,
  RESERVED_WORDS,
  toIdentifier,
  toUnderscoreId,
} from './tree-shake-identifiers.js';

describe('toIdentifier', () => {
  it('camelCases kebab-case', () => {
    expect(toIdentifier('arrow-up')).toBe('arrowUp');
    expect(toIdentifier('chevron-up')).toBe('chevronUp');
    expect(toIdentifier('activity')).toBe('activity');
  });

  it('prefixes digit-leading names with `_`', () => {
    expect(toIdentifier('0')).toBe('_0');
    expect(toIdentifier('360-degrees')).toBe('_360Degrees');
  });

  it('prefixes reserved words with `_` (Feather/Lucide ship `delete`/`import`/`package`)', () => {
    expect(toIdentifier('delete')).toBe('_delete');
    expect(toIdentifier('import')).toBe('_import');
    expect(toIdentifier('package')).toBe('_package');
    for (const word of RESERVED_WORDS) {
      expect(toIdentifier(word)).toBe(`_${word}`);
    }
  });
});

describe('toUnderscoreId', () => {
  it('replaces hyphens with underscores injectively', () => {
    expect(toUnderscoreId('arrow-up-10')).toBe('arrow_up_10');
    expect(toUnderscoreId('arrow-up-1-0')).toBe('arrow_up_1_0');
    expect(toUnderscoreId('delete')).toBe('_delete');
  });
});

describe('assignIdentifiers', () => {
  it('keeps camelCase for non-colliding ids', () => {
    const m = assignIdentifiers(['arrow-up', 'chevron-down', 'activity']);
    expect(m.get('arrow-up')).toBe('arrowUp');
    expect(m.get('chevron-down')).toBe('chevronDown');
    expect(m.get('activity')).toBe('activity');
  });

  it('disambiguates camelCase collisions to the underscore form', () => {
    // The real Lucide collision: both camelCase to `arrowUp10`.
    const m = assignIdentifiers(['arrow-up-10', 'arrow-up-1-0']);
    expect(m.get('arrow-up-10')).toBe('arrow_up_10');
    expect(m.get('arrow-up-1-0')).toBe('arrow_up_1_0');
    expect([...m.values()]).not.toContain('arrowUp10');
  });

  it('only remaps the colliding ids — unrelated names keep camelCase', () => {
    const m = assignIdentifiers(['arrow-up-10', 'arrow-up-1-0', 'battery-0']);
    expect(m.get('battery-0')).toBe('battery0');
  });

  it('produces a fully unique, valid identifier set', () => {
    const ids = ['delete', 'import', 'package', 'arrow-up-10', 'arrow-up-1-0', '0', '360-degrees'];
    const m = assignIdentifiers(ids);
    const values = [...m.values()];
    expect(new Set(values).size).toBe(values.length); // all unique
    for (const v of values) {
      expect(v).toMatch(/^[A-Za-z_$][\w$]*$/); // valid JS identifier
      expect(RESERVED_WORDS.has(v)).toBe(false); // not a bare reserved word
    }
  });
});
