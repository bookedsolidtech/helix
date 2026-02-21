import { describe, it, expect } from 'vitest';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

describe('commit-msg-convention (H11)', () => {
  const hookPath = './scripts/hooks/commit-msg-convention.ts';

  function runHook(message: string): { exitCode: number; output: string } {
    const tmpDir = mkdtempSync(join(tmpdir(), 'commit-msg-test-'));
    const msgFile = join(tmpDir, 'COMMIT_EDITMSG');

    try {
      writeFileSync(msgFile, message, 'utf-8');

      const output = execSync(`tsx ${hookPath} ${msgFile}`, {
        encoding: 'utf-8',
        timeout: 5000,
      });

      return { exitCode: 0, output };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error && 'stdout' in error) {
        return {
          exitCode: (error as { status: number }).status,
          output: String((error as { stdout: Buffer | string }).stdout),
        };
      }
      throw error;
    } finally {
      try {
        unlinkSync(msgFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  describe('Valid Formats', () => {
    it('passes valid feat commit', () => {
      const result = runHook('feat(button): add loading state');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('[PASS]');
    });

    it('passes valid fix commit', () => {
      const result = runHook('fix: resolve memory leak in shadow DOM');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('[PASS]');
    });

    it('passes valid docs commit with scope', () => {
      const result = runHook('docs(storybook): update button stories');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('[PASS]');
    });

    it('passes all valid types', () => {
      const types = [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
        'revert',
      ];

      for (const type of types) {
        const result = runHook(`${type}: valid commit message`);
        expect(result.exitCode).toBe(0);
      }
    });

    it('passes commit with scope', () => {
      const result = runHook('feat(button): add variant');
      expect(result.exitCode).toBe(0);
    });

    it('passes commit without scope', () => {
      const result = runHook('fix: resolve issue');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Invalid Formats', () => {
    it('fails commit without type', () => {
      const result = runHook('Add new feature');
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('[FAIL]');
    });

    it('fails commit with invalid type', () => {
      const result = runHook('feature: add button');
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('[FAIL]');
    });

    it('fails commit without colon', () => {
      const result = runHook('feat add button');
      expect(result.exitCode).toBe(1);
    });

    it('fails commit without subject', () => {
      const result = runHook('feat:');
      expect(result.exitCode).toBe(1);
    });
  });

  describe('Warnings', () => {
    it('warns on capitalized subject', () => {
      const result = runHook('feat: Add button');
      expect(result.output).toContain('lowercase');
    });

    it('warns on subject ending with period', () => {
      const result = runHook('feat: add button.');
      expect(result.output).toContain('period');
    });

    it('warns on past tense', () => {
      const result = runHook('feat: added button');
      expect(result.output).toContain('imperative mood');
    });

    it('warns on long subject', () => {
      const longSubject = 'a'.repeat(101);
      const result = runHook(`feat: ${longSubject}`);
      expect(result.output).toContain('too long');
    });
  });

  describe('Bypass Patterns', () => {
    it('bypasses merge commits', () => {
      const result = runHook('Merge branch "main" into feature');
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('bypassed');
    });

    it('bypasses pull request merges', () => {
      const result = runHook('Merge pull request #123 from user/branch');
      expect(result.exitCode).toBe(0);
    });

    it('bypasses revert commits', () => {
      const result = runHook('Revert "feat: add button"');
      expect(result.exitCode).toBe(0);
    });

    it('bypasses version tags', () => {
      const result = runHook('v1.2.3');
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Multiline Messages', () => {
    it('validates multiline commit with body', () => {
      const message = `feat(button): add loading state

This commit adds a loading state to the button component.
It includes animations and accessibility improvements.`;
      const result = runHook(message);
      expect(result.exitCode).toBe(0);
    });

    it('warns on long body lines', () => {
      const longLine = 'a'.repeat(101);
      const message = `feat: add feature\n\n${longLine}`;
      const result = runHook(message);
      expect(result.output).toContain('Body line');
    });

    it('allows long URLs in body', () => {
      const message = `feat: add feature\n\nhttps://very-long-url.com/${'a'.repeat(150)}`;
      const result = runHook(message);
      // Should not warn about URL length
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Performance', () => {
    it('completes within 0.5s budget', () => {
      const start = Date.now();
      runHook('feat: add feature');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('handles empty commit message', () => {
      const result = runHook('');
      expect(result.exitCode).toBe(1);
    });

    it('handles whitespace-only message', () => {
      const result = runHook('   \n\n   ');
      expect(result.exitCode).toBe(1);
    });
  });
});
