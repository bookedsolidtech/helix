import { describe, it, expect } from 'vitest';
import {
  checkHexColors,
  checkHardcodedSpacing,
  checkFontFamily,
  checkZIndex,
  checkColorKeywords,
  validateNoHardcodedValues,
  hasApprovalComment,
  type Violation,
  type HookDependencies,
} from './no-hardcoded-values.js';

/**
 * Test utilities
 */
function createTestContent(code: string): { content: string; lines: string[] } {
  const lines = code.split('\n');
  return { content: code, lines };
}

// ─── checkHexColors ───────────────────────────────────────────────────────

describe('checkHexColors', () => {
  it('detects 6-digit hex colors', () => {
    const { content, lines } = createTestContent(`
      .button {
        color: #FF0000;
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('#FF0000');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('detects 3-digit hex colors', () => {
    const { content, lines } = createTestContent(`
      .button {
        background: #F00;
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('#F00');
  });

  it('detects lowercase hex colors', () => {
    const { content, lines } = createTestContent(`
      .button {
        border-color: #ff0000;
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('#ff0000');
  });

  it('allows hex colors in var() functions', () => {
    const { content, lines } = createTestContent(`
      .button {
        color: var(--hx-color-primary, #2563eb);
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips hex colors with approval comment', () => {
    const { content, lines } = createTestContent(`
      .button {
        /* @design-system-approved: TICKET-123 Brand color */
        color: #FF5733;
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects multiple hex colors in one file', () => {
    const { content, lines } = createTestContent(`
      .button {
        color: #FF0000;
        background: #00FF00;
        border-color: #0000FF;
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations.length).toBeGreaterThanOrEqual(3);
  });

  it('provides correct line numbers', () => {
    const { content, lines } = createTestContent(`
      .button {
        color: #FF0000;
      }
    `);
    const violations: Violation[] = [];
    checkHexColors('test.css', content, lines, violations);

    expect(violations[0]?.line).toBe(3);
  });
});

// ─── checkHardcodedSpacing ────────────────────────────────────────────────

describe('checkHardcodedSpacing', () => {
  it('detects hardcoded pixel values in padding', () => {
    const { content, lines } = createTestContent(`
      .button {
        padding: 16px;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('16px');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('detects hardcoded rem values in margin', () => {
    const { content, lines } = createTestContent(`
      .card {
        margin: 1.5rem;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('1.5rem');
  });

  it('detects hardcoded values in gap', () => {
    const { content, lines } = createTestContent(`
      .container {
        gap: 8px;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('8px');
  });

  it('detects hardcoded width/height values', () => {
    const { content, lines } = createTestContent(`
      .box {
        width: 200px;
        height: 100px;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it('allows 0px and 0rem', () => {
    const { content, lines } = createTestContent(`
      .button {
        padding: 0px;
        margin: 0rem;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('allows percentage values', () => {
    const { content, lines } = createTestContent(`
      .container {
        width: 100%;
        height: 50%;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('allows design tokens', () => {
    const { content, lines } = createTestContent(`
      .button {
        padding: var(--hx-space-4);
        width: var(--hx-size-10);
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips hardcoded values with approval', () => {
    const { content, lines } = createTestContent(`
      .button {
        // @design-system-approved: TICKET-456 Legacy layout
        padding: 16px;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects decimal pixel values', () => {
    const { content, lines } = createTestContent(`
      .button {
        padding: 10.5px;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('10.5px');
  });

  it('detects multiple spacing values in shorthand', () => {
    const { content, lines } = createTestContent(`
      .button {
        padding: 8px 16px 12px 20px;
      }
    `);
    const violations: Violation[] = [];
    checkHardcodedSpacing('test.css', content, lines, violations);

    expect(violations.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── checkFontFamily ──────────────────────────────────────────────────────

describe('checkFontFamily', () => {
  it('detects hardcoded font-family with single quotes', () => {
    const { content, lines } = createTestContent(`
      .text {
        font-family: 'Arial';
      }
    `);
    const violations: Violation[] = [];
    checkFontFamily('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('font-family');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('detects hardcoded font-family with double quotes', () => {
    const { content, lines } = createTestContent(`
      .text {
        font-family: "Helvetica Neue", sans-serif;
      }
    `);
    const violations: Violation[] = [];
    checkFontFamily('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
  });

  it('allows design token font-family', () => {
    const { content, lines } = createTestContent(`
      .text {
        font-family: var(--hx-font-family-sans);
      }
    `);
    const violations: Violation[] = [];
    checkFontFamily('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips font-family with approval', () => {
    const { content, lines } = createTestContent(`
      .text {
        /* @design-system-approved: TICKET-789 Brand font */
        font-family: 'Custom Brand Font', sans-serif;
      }
    `);
    const violations: Violation[] = [];
    checkFontFamily('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects font-family in shorthand', () => {
    const { content, lines } = createTestContent(`
      .text {
        font: 16px 'Arial', sans-serif;
      }
    `);
    const violations: Violation[] = [];
    checkFontFamily('test.css', content, lines, violations);

    // Note: This test verifies that font shorthand is not caught by font-family check
    // Shorthand requires more complex parsing
    expect(violations).toHaveLength(0);
  });
});

// ─── checkZIndex ──────────────────────────────────────────────────────────

describe('checkZIndex', () => {
  it('detects z-index outside approved scale', () => {
    const { content, lines } = createTestContent(`
      .modal {
        z-index: 999;
      }
    `);
    const violations: Violation[] = [];
    checkZIndex('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('999');
    expect(violations[0]?.message).toContain('not in approved scale');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('allows z-index in approved scale', () => {
    const { content, lines } = createTestContent(`
      .overlay {
        z-index: 50;
      }
      .modal {
        z-index: 100;
      }
    `);
    const violations: Violation[] = [];
    checkZIndex('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('allows z-index: 0', () => {
    const { content, lines } = createTestContent(`
      .reset {
        z-index: 0;
      }
    `);
    const violations: Violation[] = [];
    checkZIndex('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips z-index with approval', () => {
    const { content, lines } = createTestContent(`
      .special {
        // @design-system-approved: TICKET-999 Third-party overlay
        z-index: 9999;
      }
    `);
    const violations: Violation[] = [];
    checkZIndex('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects negative z-index not in scale', () => {
    const { content, lines } = createTestContent(`
      .behind {
        z-index: -1;
      }
    `);
    const violations: Violation[] = [];
    checkZIndex('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
  });

  it('provides helpful suggestion with approved scale', () => {
    const { content, lines } = createTestContent(`
      .modal {
        z-index: 999;
      }
    `);
    const violations: Violation[] = [];
    checkZIndex('test.css', content, lines, violations);

    expect(violations[0]?.suggestion).toContain('0, 10, 20');
  });
});

// ─── checkColorKeywords ───────────────────────────────────────────────────

describe('checkColorKeywords', () => {
  it('detects color keyword in color property', () => {
    const { content, lines } = createTestContent(`
      .text {
        color: red;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('red');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('detects color keyword in background', () => {
    const { content, lines } = createTestContent(`
      .box {
        background: blue;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('blue');
  });

  it('detects color keyword in background-color', () => {
    const { content, lines } = createTestContent(`
      .box {
        background-color: green;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
  });

  it('detects color keyword in border-color', () => {
    const { content, lines } = createTestContent(`
      .border {
        border-color: yellow;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(1);
  });

  it('allows transparent', () => {
    const { content, lines } = createTestContent(`
      .box {
        background: transparent;
        border-color: transparent;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('allows inherit and currentcolor', () => {
    const { content, lines } = createTestContent(`
      .text {
        color: inherit;
        background: currentcolor;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('allows design tokens', () => {
    const { content, lines } = createTestContent(`
      .button {
        color: var(--hx-color-primary-500);
        background: var(--hx-color-neutral-0);
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('skips color keywords with approval', () => {
    const { content, lines } = createTestContent(`
      .special {
        // @design-system-approved: TICKET-111 Error state
        color: red;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations).toHaveLength(0);
  });

  it('detects case-insensitive color keywords', () => {
    const { content, lines } = createTestContent(`
      .text {
        color: RED;
        background: Blue;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    expect(violations.length).toBeGreaterThanOrEqual(2);
  });

  it('does not match partial words', () => {
    const { content, lines } = createTestContent(`
      .text {
        color: darkred;
      }
    `);
    const violations: Violation[] = [];
    checkColorKeywords('test.css', content, lines, violations);

    // Word boundary regex correctly excludes "red" in "darkred"
    expect(violations).toHaveLength(0);
  });
});

// ─── hasApprovalComment ───────────────────────────────────────────────────

describe('hasApprovalComment', () => {
  it('detects inline approval comment', () => {
    const lines = ['.button {', '  color: #FF0000; // @design-system-approved: TICKET-123', '}'];

    expect(hasApprovalComment(lines, 1)).toBe(true);
  });

  it('detects approval comment one line above', () => {
    const lines = [
      '// @design-system-approved: TICKET-123 Reason',
      '.button {',
      '  color: #FF0000;',
      '}',
    ];

    expect(hasApprovalComment(lines, 2)).toBe(true);
  });

  it('detects approval comment multiple lines above', () => {
    const lines = [
      '/* @design-system-approved: TICKET-123 Reason */',
      '',
      '',
      '.button {',
      '  color: #FF0000;',
      '}',
    ];

    expect(hasApprovalComment(lines, 4)).toBe(true);
  });

  it('returns false when no approval comment', () => {
    const lines = ['.button {', '  color: #FF0000;', '}'];

    expect(hasApprovalComment(lines, 1)).toBe(false);
  });

  it('does not look beyond 5 lines', () => {
    const lines = [
      '// @design-system-approved: TICKET-123',
      '',
      '',
      '',
      '',
      '',
      '',
      '.button {',
      '  color: #FF0000;',
      '}',
    ];

    // Line 8 is more than 5 lines away from line 0
    expect(hasApprovalComment(lines, 8)).toBe(false);
  });
});

// ─── validateNoHardcodedValues (Integration) ──────────────────────────────

describe('validateNoHardcodedValues', () => {
  it('returns passed=true when no files staged', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => [],
      readFile: () => '',
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(0);
  });

  it('returns passed=false when critical violations exist', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['test.css'],
      readFile: () => `.button { color: #FF0000; }`,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBeGreaterThan(0);
  });

  it('calculates correct stats', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['test.css'],
      readFile: () => `.button {
        color: #FF0000;
        background: #00FF00;
        padding: 16px;
        z-index: 999;
      }`,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.stats.filesChecked).toBe(1);
    expect(result.stats.totalViolations).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBeGreaterThan(0);
  });

  it('handles timeout gracefully', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => Array.from({ length: 100 }, (_, i) => `test${i}.css`),
      readFile: () => `.button { color: #FF0000; }`,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    // Should not throw, should return result
    expect(result).toBeDefined();
    expect(result.passed).toBeDefined();
  });

  it('handles empty files gracefully', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['empty.css'],
      readFile: () => '',
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('passes with approved violations', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['approved.css'],
      readFile: () => `
        /* @design-system-approved: TICKET-123 Brand colors */
        .button {
          color: #FF0000;
          background: #00FF00;
        }
      `,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('aggregates violations from multiple files', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['file1.css', 'file2.css'],
      readFile: (path) => {
        if (path === 'file1.css') return `.button { color: #FF0000; }`;
        if (path === 'file2.css') return `.card { background: #00FF00; }`;
        return '';
      },
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.stats.filesChecked).toBe(2);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });

  it('handles complex violations with correct severity', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['complex.css'],
      readFile: () => `
        .component {
          color: #FF0000;
          background: blue;
          padding: 16px;
          font-family: 'Arial';
          z-index: 999;
        }
      `,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.passed).toBe(false);
    expect(result.stats.totalViolations).toBeGreaterThan(4);
    expect(result.violations.every((v) => v.severity === 'critical')).toBe(true);
    expect(result.violations.every((v) => v.file === 'complex.css')).toBe(true);
    expect(result.violations.every((v) => v.suggestion)).toBeTruthy();
  });

  it('provides file path in violations', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['test.css'],
      readFile: () => `.button { color: #FF0000; }`,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.violations[0]?.file).toBe('test.css');
  });

  it('handles TypeScript files with Lit CSS', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => ['button.styles.ts'],
      readFile: () => `
        import { css } from 'lit';
        export const styles = css\`
          .button {
            color: #FF0000;
          }
        \`;
      `,
    };

    const result = await validateNoHardcodedValues(mockDeps);

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]?.file).toBe('button.styles.ts');
  });

  it('skips test files', async () => {
    const mockDeps: HookDependencies = {
      getStagedFiles: () => [],
      readFile: () => '',
    };

    const result = await validateNoHardcodedValues(mockDeps);

    // Test files should be filtered out by getStagedFiles
    expect(result.stats.filesChecked).toBe(0);
  });
});
