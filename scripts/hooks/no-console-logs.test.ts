import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('no-console-logs (H12)', () => {
  const hookPath = './scripts/hooks/no-console-logs.ts';

  function runHook(): {
    exitCode: number;
    output: string;
  } {
    try {
      const output = execSync(`tsx ${hookPath}`, {
        encoding: 'utf-8',
        timeout: 10000,
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
    }
  }

  describe('Detection', () => {
    it('passes when no files are staged', () => {
      const result = runHook();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('[PASS]');
    });
  });

  describe('Performance', () => {
    it('completes within 1s budget for typical commit', () => {
      const start = Date.now();
      runHook();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });
});
