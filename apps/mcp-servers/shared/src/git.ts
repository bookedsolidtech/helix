import { execa } from 'execa';
import { MCPError, ErrorCategory } from './error-handling.js';
import { BranchNameSchema } from './validation.js';

export class GitOperations {
  constructor(private projectRoot: string) {}

  private validateBranchName(branch: string): void {
    try {
      BranchNameSchema.parse(branch);
    } catch {
      throw new MCPError(`Invalid branch name: ${branch}`, ErrorCategory.Security);
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: this.projectRoot,
      });
      return stdout.trim();
    } catch (error) {
      throw new MCPError(
        'Failed to get current branch',
        ErrorCategory.System,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async checkout(branch: string): Promise<void> {
    this.validateBranchName(branch);

    try {
      await execa('git', ['checkout', branch], {
        cwd: this.projectRoot,
      });
    } catch (error) {
      throw new MCPError(
        `Failed to checkout branch: ${branch}`,
        ErrorCategory.System,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async getStashCount(): Promise<number> {
    try {
      const { stdout } = await execa('git', ['stash', 'list'], {
        cwd: this.projectRoot,
      });
      return stdout ? stdout.split('\n').length : 0;
    } catch {
      return 0;
    }
  }

  async stashChanges(message: string): Promise<boolean> {
    const beforeCount = await this.getStashCount();

    try {
      await execa('git', ['stash', 'push', '-u', '-m', message], {
        cwd: this.projectRoot,
      });

      const afterCount = await this.getStashCount();
      return afterCount > beforeCount;
    } catch (error) {
      throw new MCPError(
        'Failed to stash changes',
        ErrorCategory.System,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async popStash(): Promise<void> {
    try {
      await execa('git', ['stash', 'pop'], {
        cwd: this.projectRoot,
      });
    } catch (error) {
      throw new MCPError(
        'Failed to restore stashed changes - check git stash list',
        ErrorCategory.System,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async withBranch<T>(branchName: string, operation: () => Promise<T>): Promise<T> {
    this.validateBranchName(branchName);

    const currentBranch = await this.getCurrentBranch();
    const hasStash = await this.stashChanges(`MCP temp stash for ${branchName}`);

    try {
      await this.checkout(branchName);
      return await operation();
    } finally {
      await this.checkout(currentBranch);
      if (hasStash) {
        await this.popStash();
      }
    }
  }
}
