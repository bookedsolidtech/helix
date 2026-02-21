/**
 * Tests for design-token-enforcement hook (H13)
 */

import { describe, it, expect } from 'vitest';
import type { HookDependencies } from './design-token-enforcement';
import {
  validateDesignTokens,
  extractCSSContent,
  extractTokenUsages,
  isSemanticToken,
  isPrimitiveToken,
  isComponentToken,
  isInternalToken,
  isKnownToken,
  checkTokenPrefix,
  checkPrimitiveUsage,
  checkComponentFallback,
  checkUnknownToken,
  checkRecursiveFallbacks,
  validateTokens,
  CONFIG,
  TOKEN_REGISTRY,
} from './design-token-enforcement';

// ─── Test Helpers ─────────────────────────────────────────────────────────

/**
 * Create mock dependencies for testing
 */
function createMockDeps(
  files: Record<string, string>,
  stagedFilesList: string[] = Object.keys(files),
): HookDependencies {
  return {
    getStagedFiles: () => stagedFilesList,
    readFile: (path: string) => {
      if (!(path in files)) {
        throw new Error(`File not found: ${path}`);
      }
      return files[path] ?? '';
    },
    fileExists: (path: string) => path in files,
  };
}

// ─── CSS Content Extraction Tests ────────────────────────────────────────

describe('extractCSSContent', () => {
  it('should extract CSS from Lit tagged template literal', () => {
    const content = `
      import { css } from 'lit';

      export const styles = css\`
        .button {
          color: var(--hx-color-primary);
        }
      \`;
    `;

    const result = extractCSSContent(content);
    expect(result).toContain('.button');
    expect(result).toContain('var(--hx-color-primary)');
  });

  it('should extract multiple css`` blocks', () => {
    const content = `
      const styles1 = css\`.foo { color: red; }\`;
      const styles2 = css\`.bar { color: blue; }\`;
    `;

    const result = extractCSSContent(content);
    expect(result).toContain('.foo');
    expect(result).toContain('.bar');
  });

  it('should return raw content for .css files', () => {
    const content = `.button { color: var(--hx-color-primary); }`;
    const result = extractCSSContent(content);
    expect(result).toBe(content);
  });

  it('should handle empty content', () => {
    const result = extractCSSContent('');
    expect(result).toBe('');
  });
});

// ─── Token Usage Extraction Tests ─────────────────────────────────────────

describe('extractTokenUsages', () => {
  it('should extract token without fallback', () => {
    const css = `color: var(--hx-color-primary);`;
    const usages = extractTokenUsages(css);

    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatchObject({
      token: '--hx-color-primary',
      fallback: null,
      line: 1,
    });
  });

  it('should extract token with fallback', () => {
    const css = `color: var(--hx-button-bg, var(--hx-color-primary));`;
    const usages = extractTokenUsages(css);

    // Note: extractTokenUsages only extracts top-level var() calls
    // Nested var() in fallbacks are not extracted as separate tokens
    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatchObject({
      token: '--hx-button-bg',
      fallback: 'var(--hx-color-primary)',
    });
  });

  it('should extract multiple tokens from same line', () => {
    const css = `background: var(--hx-bg) var(--hx-fg);`;
    const usages = extractTokenUsages(css);

    expect(usages).toHaveLength(2);
    expect(usages[0]?.token).toBe('--hx-bg');
    expect(usages[1]?.token).toBe('--hx-fg');
  });

  it('should track line numbers correctly', () => {
    const css = `
      .foo { color: var(--hx-color-1); }
      .bar { color: var(--hx-color-2); }
    `;
    const usages = extractTokenUsages(css);

    expect(usages[0]?.line).toBe(2);
    expect(usages[1]?.line).toBe(3);
  });

  it('should handle tokens with hyphens', () => {
    const css = `color: var(--hx-color-text-primary);`;
    const usages = extractTokenUsages(css);

    expect(usages[0]?.token).toBe('--hx-color-text-primary');
  });
});

// ─── Token Classification Tests ───────────────────────────────────────────

describe('isSemanticToken', () => {
  it('should identify semantic color tokens', () => {
    expect(isSemanticToken('--hx-color-primary')).toBe(true);
    expect(isSemanticToken('--hx-color-error')).toBe(true);
    expect(isSemanticToken('--hx-color-text-primary')).toBe(true);
  });

  it('should identify semantic spacing tokens', () => {
    expect(isSemanticToken('--hx-spacing-md')).toBe(true);
    expect(isSemanticToken('--hx-spacing-xl')).toBe(true);
  });

  it('should identify semantic typography tokens', () => {
    expect(isSemanticToken('--hx-font-family-sans')).toBe(true);
    expect(isSemanticToken('--hx-font-size-lg')).toBe(true);
  });

  it('should reject non-semantic tokens', () => {
    expect(isSemanticToken('--hx-color-neutral-900')).toBe(false);
    expect(isSemanticToken('--hx-space-4')).toBe(false);
    expect(isSemanticToken('--hx-button-bg')).toBe(false);
  });
});

describe('isPrimitiveToken', () => {
  it('should identify primitive color scale tokens', () => {
    expect(isPrimitiveToken('--hx-color-neutral-900')).toBe(true);
    expect(isPrimitiveToken('--hx-color-blue-500')).toBe(true);
    expect(isPrimitiveToken('--hx-color-red-100')).toBe(true);
  });

  it('should identify primitive spacing tokens', () => {
    expect(isPrimitiveToken('--hx-space-4')).toBe(true);
    expect(isPrimitiveToken('--hx-space-16')).toBe(true);
  });

  it('should reject non-primitive tokens', () => {
    expect(isPrimitiveToken('--hx-color-primary')).toBe(false);
    expect(isPrimitiveToken('--hx-spacing-md')).toBe(false);
  });
});

describe('isComponentToken', () => {
  it('should identify component tokens', () => {
    expect(isComponentToken('--hx-button-bg')).toBe(true);
    expect(isComponentToken('--hx-card-padding')).toBe(true);
    expect(isComponentToken('--hx-input-border-color')).toBe(true);
  });

  it('should reject semantic tokens', () => {
    expect(isComponentToken('--hx-color-primary')).toBe(false);
    expect(isComponentToken('--hx-spacing-md')).toBe(false);
  });

  it('should reject primitive tokens', () => {
    expect(isComponentToken('--hx-color-neutral-900')).toBe(false);
  });

  it('should reject internal tokens', () => {
    expect(isComponentToken('--_internal')).toBe(false);
  });
});

describe('isInternalToken', () => {
  it('should identify internal tokens', () => {
    expect(isInternalToken('--_bg')).toBe(true);
    expect(isInternalToken('--_hover-state')).toBe(true);
  });

  it('should reject public tokens', () => {
    expect(isInternalToken('--hx-color-primary')).toBe(false);
    expect(isInternalToken('--hx-button-bg')).toBe(false);
  });
});

// ─── Validator Function Tests ─────────────────────────────────────────────

describe('checkTokenPrefix', () => {
  it('should flag tokens without --hx- prefix', () => {
    const violations: Array<{ message: string }> = [];
    const usage = {
      token: '--custom-color',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--custom-color);',
      allTokens: ['--custom-color'],
    };

    checkTokenPrefix(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing required prefix');
  });

  it('should allow tokens with --hx- prefix', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-color-primary',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--hx-color-primary);',
      allTokens: ['--hx-color-primary'],
    };

    checkTokenPrefix(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });

  it('should skip internal tokens', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--_internal',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--_internal);',
      allTokens: ['--_internal'],
    };

    checkTokenPrefix(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });
});

describe('checkPrimitiveUsage', () => {
  it('should flag primitive tokens used directly', () => {
    const violations: Array<{ message: string }> = [];
    const usage = {
      token: '--hx-color-neutral-900',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--hx-color-neutral-900);',
    };

    checkPrimitiveUsage(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('Primitive token');
    expect(violations[0]?.message).toContain('used directly');
  });

  it('should allow semantic tokens', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-color-primary',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--hx-color-primary);',
    };

    checkPrimitiveUsage(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });

  it('should skip internal tokens', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--_bg',
      fallback: null,
      line: 1,
      column: 1,
      code: 'background: var(--_bg);',
    };

    checkPrimitiveUsage(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });
});

describe('checkComponentFallback', () => {
  it('should warn when component token has no fallback', () => {
    const violations: Array<{ message: string; severity: string }> = [];
    const usage = {
      token: '--hx-button-bg',
      fallback: null,
      line: 1,
      column: 1,
      code: 'background: var(--hx-button-bg);',
    };

    checkComponentFallback(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing semantic fallback');
    expect(violations[0]?.severity).toBe('warning');
  });

  it('should allow component token with semantic fallback', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-button-bg',
      fallback: 'var(--hx-color-primary)',
      line: 1,
      column: 1,
      code: 'background: var(--hx-button-bg, var(--hx-color-primary));',
    };

    checkComponentFallback(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });

  it('should warn when fallback is not a semantic token', () => {
    const violations: Array<{ message: string }> = [];
    const usage = {
      token: '--hx-button-bg',
      fallback: 'var(--hx-color-neutral-900)',
      line: 1,
      column: 1,
      code: 'background: var(--hx-button-bg, var(--hx-color-neutral-900));',
    };

    checkComponentFallback(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('not a semantic token');
  });

  it('should skip semantic tokens', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-color-primary',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--hx-color-primary);',
    };

    checkComponentFallback(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });

  it('should skip internal tokens', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--_bg',
      fallback: null,
      line: 1,
      column: 1,
      code: 'background: var(--_bg);',
    };

    checkComponentFallback(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });
});

// ─── Integration Tests ────────────────────────────────────────────────────

describe('validateTokens', () => {
  it('should detect primitive token usage', () => {
    const content = `
      export const styles = css\`
        .button {
          color: var(--hx-color-neutral-900);
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('Primitive token');
  });

  it('should detect missing component fallback', () => {
    const content = `
      export const styles = css\`
        .button {
          background: var(--hx-button-bg);
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('missing semantic fallback');
    expect(violations[0]?.severity).toBe('warning');
  });

  it('should pass valid semantic token usage', () => {
    const content = `
      export const styles = css\`
        .button {
          color: var(--hx-color-primary);
          padding: var(--hx-spacing-md);
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations).toHaveLength(0);
  });

  it('should pass valid component token with semantic fallback', () => {
    const content = `
      export const styles = css\`
        .button {
          background: var(--hx-button-bg, var(--hx-color-primary));
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations).toHaveLength(0);
  });

  it('should allow internal tokens', () => {
    const content = `
      export const styles = css\`
        :host {
          --_bg: var(--hx-button-bg, var(--hx-color-primary));
        }
        .button {
          background: var(--_bg);
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations).toHaveLength(0);
  });

  it('should respect approval comments', () => {
    const content = `
      export const styles = css\`
        .button {
          // @design-token-approved: TICKET-123 Legacy color required
          color: var(--hx-color-neutral-900);
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations).toHaveLength(0);
  });

  it('should detect multiple violations in same file', () => {
    const content = `
      export const styles = css\`
        .button {
          color: var(--hx-color-neutral-900);
          background: var(--hx-button-bg);
        }
      \`;
    `;

    const violations = validateTokens('test.styles.ts', content, content.split('\n'));

    expect(violations.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── End-to-End Tests ─────────────────────────────────────────────────────

describe('validateDesignTokens', () => {
  it('should pass when no files are staged', async () => {
    const deps = createMockDeps({}, []);
    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should pass with valid semantic tokens', async () => {
    const files = {
      'packages/hx-library/src/components/hx-button/hx-button.styles.ts': `
        export const styles = css\`
          .button {
            color: var(--hx-color-primary);
            padding: var(--hx-spacing-md);
          }
        \`;
      `,
    };

    const deps = createMockDeps(files);
    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(1);
    expect(result.stats.tokensChecked).toBe(2);
  });

  it('should fail with primitive token usage', async () => {
    const files = {
      'packages/hx-library/src/components/hx-button/hx-button.styles.ts': `
        export const styles = css\`
          .button {
            color: var(--hx-color-neutral-900);
          }
        \`;
      `,
    };

    const deps = createMockDeps(files);
    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(false);
    expect(result.stats.criticalViolations).toBe(1);
  });

  it('should warn about missing component fallback', async () => {
    const files = {
      'packages/hx-library/src/components/hx-button/hx-button.styles.ts': `
        export const styles = css\`
          .button {
            background: var(--hx-button-bg);
          }
        \`;
      `,
    };

    const deps = createMockDeps(files);
    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(true); // Warnings don't block
    expect(result.stats.warningViolations).toBe(1);
  });

  it('should skip excluded files', async () => {
    const files = {
      'packages/hx-library/src/components/hx-button/hx-button.test.ts': `
        const css = 'color: var(--hx-color-neutral-900);';
      `,
    };

    // The mock returns all files as "staged", but getStagedFiles filters them
    const deps: HookDependencies = {
      getStagedFiles: () => {
        // Simulate Git returning the file, but it should be filtered by includePatterns
        const allFiles = Object.keys(files);
        return allFiles
          .filter((file) => CONFIG.includePatterns.some((pattern) => pattern.test(file)))
          .filter((file) => !CONFIG.excludePatterns.some((pattern) => pattern.test(file)));
      },
      readFile: (path: string) => files[path] ?? '',
      fileExists: (path: string) => path in files,
    };

    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(true);
    expect(result.stats.filesChecked).toBe(0);
  });

  it('should support bail-fast mode', async () => {
    const files = {
      'packages/hx-library/src/components/hx-button/hx-button.styles.ts': `
        export const styles = css\`
          .button { color: var(--hx-color-neutral-900); }
        \`;
      `,
      'packages/hx-library/src/components/hx-card/hx-card.styles.ts': `
        export const styles = css\`
          .card { color: var(--hx-color-neutral-800); }
        \`;
      `,
    };

    const deps = createMockDeps(files);
    const result = await validateDesignTokens(deps, true, true);

    expect(result.passed).toBe(false);
    expect(result.stats.filesChecked).toBe(1); // Stopped after first file
  });

  it('should handle file read errors gracefully', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => ['test.styles.ts'],
      readFile: () => {
        throw new Error('Read error');
      },
      fileExists: () => true,
    };

    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(false);
    expect(result.violations[0]?.message).toContain('Failed to analyze file');
  });

  it('should handle Git errors gracefully', async () => {
    const deps: HookDependencies = {
      getStagedFiles: () => {
        throw new Error('Git error');
      },
      readFile: () => '',
      fileExists: () => false,
    };

    const result = await validateDesignTokens(deps, false, true);

    expect(result.passed).toBe(false);
    expect(result.violations[0]?.message).toContain('Failed to get staged files');
  });
});

// ─── Configuration Tests ──────────────────────────────────────────────────

describe('CONFIG', () => {
  it('should have required patterns', () => {
    expect(CONFIG.includePatterns).toBeDefined();
    expect(CONFIG.excludePatterns).toBeDefined();
    expect(CONFIG.semanticTokens).toBeDefined();
    expect(CONFIG.primitiveTokens).toBeDefined();
  });

  it('should have performance budgets', () => {
    expect(CONFIG.timeoutMs).toBeGreaterThan(0);
    expect(CONFIG.performanceBudgetMs).toBeGreaterThan(0);
    expect(CONFIG.performanceBudgetMs).toBeLessThanOrEqual(CONFIG.timeoutMs);
  });

  it('should have correct token prefix', () => {
    expect(CONFIG.tokenPrefix).toBe('--hx-');
  });

  it('should validate approval comment format with ticket ID', () => {
    const validComment = '// @design-token-approved: HELIX-123 Legacy compatibility';
    const match = CONFIG.approvalCommentPattern.exec(validComment);
    expect(match).toBeTruthy();
    expect(match?.[1]).toBe('HELIX-123');

    const invalidComment = '// @design-token-approved No ticket';
    expect(CONFIG.approvalCommentPattern.exec(invalidComment)).toBeNull();
  });
});

// ─── Token Registry Tests ─────────────────────────────────────────────────

describe('TOKEN_REGISTRY', () => {
  it('should load token registry from source of truth', () => {
    expect(TOKEN_REGISTRY).toBeDefined();
    expect(TOKEN_REGISTRY.all).toBeDefined();
    expect(TOKEN_REGISTRY.primitive).toBeDefined();
    expect(TOKEN_REGISTRY.semantic).toBeDefined();
    expect(TOKEN_REGISTRY.component).toBeDefined();
  });

  it('should have all 274 tokens from tokens.css', () => {
    expect(TOKEN_REGISTRY.all.length).toBeGreaterThanOrEqual(270);
  });

  it('should categorize tokens correctly', () => {
    expect(TOKEN_REGISTRY.primitive.tokens).toContain('--hx-color-primary-500');
    expect(TOKEN_REGISTRY.primitive.tokens).toContain('--hx-space-4');
    expect(TOKEN_REGISTRY.semantic.tokens).toContain('--hx-color-text-primary');
    expect(TOKEN_REGISTRY.semantic.tokens).toContain('--hx-font-family-sans');
  });
});

// ─── New Validator Tests ──────────────────────────────────────────────────

describe('isKnownToken', () => {
  it('should identify tokens from registry', () => {
    expect(isKnownToken('--hx-color-primary-500')).toBe(true);
    expect(isKnownToken('--hx-color-text-primary')).toBe(true);
    expect(isKnownToken('--hx-space-4')).toBe(true);
  });

  it('should reject unknown tokens', () => {
    expect(isKnownToken('--hx-typo-mistake')).toBe(false);
    expect(isKnownToken('--hx-undefined-token')).toBe(false);
  });

  it('should reject internal tokens (not in registry)', () => {
    expect(isKnownToken('--_internal')).toBe(false);
  });
});

describe('checkUnknownToken', () => {
  it('should flag unknown tokens', () => {
    const violations: Array<{ message: string; severity: string }> = [];
    const usage = {
      token: '--hx-typo-mistake',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--hx-typo-mistake);',
      allTokens: ['--hx-typo-mistake'],
    };

    checkUnknownToken(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('Unknown token');
    expect(violations[0]?.severity).toBe('critical');
  });

  it('should allow known tokens', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-color-text-primary',
      fallback: null,
      line: 1,
      column: 1,
      code: 'color: var(--hx-color-text-primary);',
      allTokens: ['--hx-color-text-primary'],
    };

    checkUnknownToken(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });
});

describe('checkRecursiveFallbacks', () => {
  it('should flag primitives in middle of fallback chain', () => {
    const violations: Array<{ message: string }> = [];
    const usage = {
      token: '--hx-button-bg',
      fallback: 'var(--hx-color-neutral-900, var(--hx-color-primary))',
      line: 1,
      column: 1,
      code: 'background: var(--hx-button-bg, var(--hx-color-neutral-900, var(--hx-color-primary)));',
      allTokens: ['--hx-button-bg', '--hx-color-neutral-900', '--hx-color-primary'],
    };

    checkRecursiveFallbacks(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('Primitive tokens in middle');
  });

  it('should allow primitive as final fallback with value', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-button-bg',
      fallback: 'var(--hx-color-primary-500, #2563eb)',
      line: 1,
      column: 1,
      code: 'background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));',
      allTokens: ['--hx-button-bg', '--hx-color-primary-500'],
    };

    checkRecursiveFallbacks(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });

  it('should allow semantic-only chains', () => {
    const violations: Array<unknown> = [];
    const usage = {
      token: '--hx-button-bg',
      fallback: 'var(--hx-color-primary)',
      line: 1,
      column: 1,
      code: 'background: var(--hx-button-bg, var(--hx-color-primary));',
      allTokens: ['--hx-button-bg', '--hx-color-primary'],
    };

    checkRecursiveFallbacks(usage, 'test.ts', violations as any);

    expect(violations).toHaveLength(0);
  });
});

// ─── Integration Tests with Real Components ──────────────────────────────

describe('Integration: Real Component Validation', () => {
  it('should validate actual hx-button.styles.ts patterns', () => {
    const buttonCSS = `
      .button {
        background-color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
        color: var(--hx-button-color, var(--hx-color-neutral-0, #ffffff));
        border-radius: var(--hx-button-border-radius, var(--hx-border-radius-md, 0.375rem));
      }
    `;

    const usages = extractTokenUsages(buttonCSS);

    expect(usages.length).toBeGreaterThan(0);

    // All tokens should be known
    for (const usage of usages) {
      for (const token of usage.allTokens) {
        if (!token.startsWith('--_')) {
          expect(isKnownToken(token)).toBe(true);
        }
      }
    }
  });

  it('should detect violations in invalid component patterns', () => {
    const invalidCSS = `
      .button {
        /* Using primitive directly - VIOLATION */
        color: var(--hx-color-neutral-900);

        /* Unknown token - VIOLATION */
        background: var(--hx-unknown-token);

        /* Primitive in middle of chain - VIOLATION */
        border: var(--hx-button-border, var(--hx-color-neutral-200, var(--hx-color-primary)));
      }
    `;

    const violations = validateTokens('test.styles.ts', invalidCSS, invalidCSS.split('\n'));

    expect(violations.length).toBeGreaterThan(0);

    // Should have primitive usage violation
    expect(violations.some((v) => v.message.includes('Primitive token'))).toBe(true);

    // Should have unknown token violation
    expect(violations.some((v) => v.message.includes('Unknown token'))).toBe(true);
  });
});

// ─── Recursive Token Extraction Tests ────────────────────────────────────

describe('extractTokenUsages - Recursive Fallbacks', () => {
  it('should extract all tokens from nested var() calls', () => {
    const css = `color: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));`;
    const usages = extractTokenUsages(css);

    expect(usages).toHaveLength(1);
    expect(usages[0]?.allTokens).toContain('--hx-button-bg');
    expect(usages[0]?.allTokens).toContain('--hx-color-primary-500');
    expect(usages[0]?.allTokens.length).toBe(2);
  });

  it('should handle deeply nested fallbacks', () => {
    const css = `color: var(--a, var(--b, var(--c, var(--d))));`;
    const usages = extractTokenUsages(css);

    expect(usages[0]?.allTokens).toContain('--a');
    expect(usages[0]?.allTokens).toContain('--b');
    expect(usages[0]?.allTokens).toContain('--c');
    expect(usages[0]?.allTokens).toContain('--d');
    expect(usages[0]?.allTokens.length).toBe(4);
  });
});

// ─── Performance Tests ────────────────────────────────────────────────────

describe('Performance', () => {
  it('should complete validation within 2s budget for 100 files', async () => {
    // Create 100 mock files with realistic component CSS
    const files: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      files[`src/components/test-${i}.styles.ts`] = `
        import { css } from 'lit';
        export const styles = css\`
          .component {
            color: var(--hx-color-text-primary);
            background: var(--hx-button-bg, var(--hx-color-primary-500, #2563eb));
            padding: var(--hx-space-4);
            border-radius: var(--hx-border-radius-md);
          }
          .component:hover {
            filter: brightness(var(--hx-filter-brightness-hover, 0.9));
          }
        \`;
      `;
    }

    const deps = createMockDeps(files);
    const startTime = Date.now();

    await validateDesignTokens(deps, false, true);

    const elapsedTime = Date.now() - startTime;

    // Should complete within 2s performance budget
    expect(elapsedTime).toBeLessThan(CONFIG.performanceBudgetMs);
  });

  it('should handle large CSS files efficiently', () => {
    // Generate CSS with 1000 token usages
    const lines: string[] = [];
    for (let i = 0; i < 1000; i++) {
      lines.push(`.class-${i} { color: var(--hx-color-text-primary); }`);
    }
    const css = lines.join('\n');

    const startTime = Date.now();
    const usages = extractTokenUsages(css);
    const elapsedTime = Date.now() - startTime;

    expect(usages.length).toBe(1000);
    // Token extraction should be very fast (< 100ms for 1000 usages)
    expect(elapsedTime).toBeLessThan(100);
  });
});
