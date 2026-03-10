import { describe, it, expect } from 'vitest';
import {
  extractLitCss,
  checkAnimationDurations,
  checkGpuProperties,
  checkReducedMotion,
  validateFile,
  validateAnimationBudget,
  matchesPattern,
  type Violation,
} from './animation-budget-check';

describe('animation-budget-check (H20)', () => {
  describe('Pattern matching', () => {
    const includePatterns = ['packages/**/src/**/*.ts', 'packages/**/src/**/*.css'];
    const excludePatterns = ['**/*.test.ts', '**/*.spec.ts', '**/*.stories.ts'];

    it('should match files in packages/.../src/.../  with .ts extension', () => {
      expect(matchesPattern('packages/lib/src/button.styles.ts', includePatterns)).toBe(true);
      expect(
        matchesPattern(
          'packages/hx-library/src/components/hx-button/hx-button.styles.ts',
          includePatterns,
        ),
      ).toBe(true);
    });

    it('should NOT match files outside packages directory', () => {
      expect(matchesPattern('src/button.styles.ts', includePatterns)).toBe(false);
      expect(matchesPattern('app/src/button.styles.ts', includePatterns)).toBe(false);
    });

    it('should match files excluded by patterns', () => {
      expect(matchesPattern('packages/lib/src/button.test.ts', excludePatterns)).toBe(true);
      expect(matchesPattern('packages/lib/src/button.stories.ts', excludePatterns)).toBe(true);
      expect(matchesPattern('packages/lib/src/button.spec.ts', excludePatterns)).toBe(true);
    });

    it('should NOT match files not in exclude list', () => {
      expect(matchesPattern('packages/lib/src/button.styles.ts', excludePatterns)).toBe(false);
    });
  });

  describe('extractLitCss', () => {
    it('should extract CSS from Lit css`...` tagged templates', () => {
      const content = `
        import { css } from 'lit';

        export const styles = css\`
          :host {
            transition: opacity 300ms ease;
          }
        \`;
      `;

      const results = extractLitCss(content);
      expect(results).toHaveLength(1);
      expect(results[0].css).toContain('transition: opacity 300ms ease');
    });

    it('should extract multiple CSS blocks', () => {
      const content = `
        import { css } from 'lit';

        const base = css\`
          :host { display: block; }
        \`;

        const animations = css\`
          .button { transition: all 200ms; }
        \`;
      `;

      const results = extractLitCss(content);
      expect(results).toHaveLength(2);
    });

    it('should handle nested backticks', () => {
      const content = `
        const styles = css\`
          :host {
            /* comment with \\\` backtick */
            transition: opacity 300ms;
          }
        \`;
      `;

      const results = extractLitCss(content);
      expect(results).toHaveLength(1);
    });
  });

  describe('checkAnimationDurations', () => {
    it('should flag animations faster than 200ms', () => {
      const cssContent = `
        :host {
          transition: opacity 100ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].message).toContain('too fast');
      expect(violations[0].message).toContain('100ms');
    });

    it('should flag animations slower than 500ms', () => {
      const cssContent = `
        :host {
          animation: fadeIn 800ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('warning');
      expect(violations[0].message).toContain('too slow');
      expect(violations[0].message).toContain('800ms');
    });

    it('should allow animations within 200-500ms range', () => {
      const cssContent = `
        :host {
          transition: transform 300ms ease-out;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should skip animations using design tokens', () => {
      const cssContent = `
        :host {
          transition: all var(--hx-transition-fast) ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should skip infinite animations', () => {
      const cssContent = `
        :host {
          animation: spin 1s infinite linear;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should handle shorthand transition syntax', () => {
      const cssContent = `
        .button {
          transition: background-color 150ms ease, color 150ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('150ms');
    });

    it('should handle transition-duration property', () => {
      const cssContent = `
        .button {
          transition-duration: 100ms;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('100ms');
    });

    it('should respect @animation-approved comments with valid ticket format', () => {
      const cssContent = `
        /* @animation-approved: HX-123 Loading spinner needs fast animation */
        :host {
          transition: opacity 50ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should respect @animation-approved with TICKET-123 format', () => {
      const cssContent = `
        /* @animation-approved: TICKET-456 Critical animation timing */
        :host {
          transition: opacity 100ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should NOT respect @animation-approved without ticket number', () => {
      const cssContent = `
        /* @animation-approved: Loading spinner needs fast animation */
        :host {
          transition: opacity 50ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
    });

    it('should NOT respect @animation-approved with invalid ticket format', () => {
      const cssContent = `
        /* @animation-approved: ABC-123 Wrong ticket prefix */
        :host {
          transition: opacity 50ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkAnimationDurations('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
    });
  });

  describe('checkGpuProperties', () => {
    it('should warn when animating layout properties', () => {
      const cssContent = `
        .button {
          transition: width 300ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkGpuProperties('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('warning');
      expect(violations[0].message).toContain('Non-GPU property');
      expect(violations[0].message).toContain('width');
    });

    it('should allow GPU-accelerated properties', () => {
      const cssContent = `
        .button {
          transition: transform 300ms ease, opacity 300ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkGpuProperties('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should allow transition: all (common pattern)', () => {
      const cssContent = `
        .button {
          transition: all 300ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkGpuProperties('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should warn on multiple non-GPU properties', () => {
      const cssContent = `
        .card {
          transition: width 300ms, height 300ms, top 300ms;
        }
      `;

      const violations: Violation[] = [];
      checkGpuProperties('test.ts', cssContent, 0, cssContent, violations);

      expect(violations.length).toBeGreaterThan(0);
    });
  });

  describe('checkReducedMotion', () => {
    it('should flag missing prefers-reduced-motion', () => {
      const cssContent = `
        :host {
          transition: opacity 300ms ease;
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].message).toContain('prefers-reduced-motion');
    });

    it('should pass when prefers-reduced-motion properly disables animations', () => {
      const cssContent = `
        :host {
          transition: opacity 300ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            transition: none !important;
            animation: none !important;
          }
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should flag incomplete prefers-reduced-motion (just mentions it but does not disable)', () => {
      const cssContent = `
        :host {
          transition: opacity 300ms ease;
        }

        /* Note: prefers-reduced-motion should be supported */
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
    });

    it('should flag prefers-reduced-motion media query with only comments', () => {
      const cssContent = `
        :host {
          transition: opacity 300ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          /* Empty block - no animation disable */
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].message).toContain('does not disable animations');
      expect(violations[0].message).toContain('WCAG 2.1 AA');
    });

    it('should flag media query that exists but does not disable animations', () => {
      const cssContent = `
        :host {
          transition: opacity 300ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          :host {
            /* Has block content but doesn't disable animations */
            color: red;
          }
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].message).toContain('does not disable animations');
      expect(violations[0].message).toContain('WCAG 2.1 AA');
    });

    it('should pass when media query uses animation-duration: 0s', () => {
      const cssContent = `
        :host {
          transition: opacity 300ms ease;
        }

        @media (prefers-reduced-motion: reduce) {
          :host {
            animation-duration: 0s;
          }
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should not flag files without animations', () => {
      const cssContent = `
        :host {
          display: block;
          color: red;
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });

    it('should accept transition-duration: 0s as valid reduced motion', () => {
      const cssContent = `
        .button {
          transition: all 300ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .button {
            transition-duration: 0s;
          }
        }
      `;

      const violations: Violation[] = [];
      checkReducedMotion('test.ts', cssContent, 0, cssContent, violations);

      expect(violations).toHaveLength(0);
    });
  });

  describe('validateFile', () => {
    it('should validate Lit component files', () => {
      const content = `
        import { css } from 'lit';

        export const styles = css\`
          .button {
            transition: opacity 100ms ease;
          }
        \`;
      `;

      const violations = validateFile('test.styles.ts', content);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.message.includes('too fast'))).toBe(true);
    });

    it('should validate plain CSS files', () => {
      const content = `
        .button {
          transition: opacity 100ms ease;
        }
      `;

      const violations = validateFile('test.css', content);

      expect(violations.length).toBeGreaterThan(0);
    });

    it('should combine all validation checks', () => {
      const content = `
        import { css } from 'lit';

        export const styles = css\`
          .card {
            transition: width 100ms ease;
          }
        \`;
      `;

      const violations = validateFile('test.ts', content);

      // Should have violations for: too fast (critical), non-GPU (warning), missing reduced motion (critical)
      expect(violations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validateAnimationBudget', () => {
    it('should return passed=true when no violations', async () => {
      const mockDeps = {
        getStagedFiles: () => ['test.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            :host {
              transition: opacity var(--hx-transition-fast);
            }
            @media (prefers-reduced-motion: reduce) {
              * { transition: none !important; }
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should return passed=false when critical violations exist', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/button.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            .button { transition: opacity 50ms; }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
    });

    it('should return passed=true when only warnings exist', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/card.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            .button {
              transition: width 300ms;
            }
            @media (prefers-reduced-motion: reduce) {
              * { transition: none !important; }
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true); // Warnings don't block
      expect(result.stats.warningViolations).toBeGreaterThan(0);
    });

    it('should handle empty staged files', async () => {
      const mockDeps = {
        getStagedFiles: () => [],
        readFile: () => '',
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true);
      expect(result.stats.filesChecked).toBe(0);
    });
  });

  describe('End-to-end validation with mocked git', () => {
    it('should pass when animations use design tokens and include reduced motion', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/button.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            :host {
              transition: all var(--hx-transition-normal) ease;
            }
            @media (prefers-reduced-motion: reduce) {
              :host {
                transition: none !important;
              }
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail when animation is too fast', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/card.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            :host {
              transition: opacity 100ms ease;
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
    });

    it('should warn when animation is too slow but still pass', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/dialog.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            :host {
              animation: fadeIn 800ms ease;
            }
            @media (prefers-reduced-motion: reduce) {
              :host {
                animation: none !important;
              }
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true); // Warnings don't block
      expect(result.stats.warningViolations).toBe(1);
    });

    it('should skip infinite animations', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/spinner.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            :host {
              animation: spin 1s infinite linear;
            }
            @media (prefers-reduced-motion: reduce) {
              :host {
                animation: none !important;
              }
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect missing prefers-reduced-motion', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/alert.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            :host {
              transition: opacity 300ms ease;
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBe(1);
    });

    it('should warn about non-GPU properties', async () => {
      const mockDeps = {
        getStagedFiles: () => ['packages/lib/src/panel.styles.ts'],
        readFile: () => `
          import { css } from 'lit';
          export const styles = css\`
            .panel {
              transition: width 300ms ease;
            }
            @media (prefers-reduced-motion: reduce) {
              .panel {
                transition: none !important;
              }
            }
          \`;
        `,
      };

      const result = await validateAnimationBudget(mockDeps);
      expect(result.passed).toBe(true); // Warnings don't block
      expect(result.stats.warningViolations).toBe(1);
    });
  });
});
