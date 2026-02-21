#!/usr/bin/env tsx
/**
 * Commit-msg Hook: commit-msg-convention (H11)
 *
 * Enforces conventional commit message format:
 * <type>(<scope>): <subject>
 *
 * Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
 * Scope: optional, e.g., button, card, hooks
 * Subject: lowercase, no period at end, imperative mood
 *
 * Examples:
 * ✅ feat(button): add loading state
 * ✅ fix: resolve memory leak in shadow DOM
 * ✅ docs(storybook): update button stories
 * ❌ Add feature (missing type)
 * ❌ feat: Added feature (past tense, capitalized)
 *
 * @owner VP Engineering
 * @priority P1
 * @phase 2
 * @executionBudget <0.5s
 */

import { readFileSync } from 'node:fs';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

interface HookConfig {
  readonly types: readonly string[];
  readonly maxSubjectLength: number;
  readonly maxBodyLineLength: number;
  readonly allowedPatterns: readonly RegExp[];
  readonly bypassPatterns: readonly RegExp[];
}

const CONFIG: HookConfig = {
  // Valid commit types
  types: [
    'feat', // New feature
    'fix', // Bug fix
    'docs', // Documentation changes
    'style', // Code style changes (formatting, etc.)
    'refactor', // Code refactoring
    'test', // Adding or updating tests
    'chore', // Maintenance tasks
    'perf', // Performance improvements
    'ci', // CI/CD changes
    'build', // Build system changes
    'revert', // Revert previous commit
  ],

  maxSubjectLength: 100,
  maxBodyLineLength: 100,

  // Main conventional commit pattern
  allowedPatterns: [
    // type(scope): subject
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\([a-z0-9-]+\))?: .+$/,
    // Merge commits
    /^Merge (branch|pull request|remote-tracking branch)/,
    // Revert commits
    /^Revert ".+"/,
    // Initial commit
    /^Initial commit$/i,
  ],

  // Bypass patterns (auto-generated commits)
  bypassPatterns: [
    /^Merge branch/,
    /^Merge pull request/,
    /^Revert/,
    /^v\d+\.\d+\.\d+/, // Version tags
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Violation {
  message: string;
  suggestion: string;
  severity: 'critical' | 'warning';
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  commitMessage: string;
  bypassed: boolean;
  bypassReason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateCommitMessage(message: string): ValidationResult {
  const lines = message.split('\n');
  const subject = lines[0];
  const violations: Violation[] = [];

  // Check bypass patterns
  for (const pattern of CONFIG.bypassPatterns) {
    if (pattern.test(subject)) {
      return {
        passed: true,
        violations: [],
        commitMessage: message,
        bypassed: true,
        bypassReason: `Auto-generated commit (${pattern})`,
      };
    }
  }

  // Validate format
  const matchesFormat = CONFIG.allowedPatterns.some((pattern) => pattern.test(subject));

  if (!matchesFormat) {
    violations.push({
      message: 'Commit message does not follow conventional commit format',
      suggestion: `Use format: <type>(<scope>): <subject>\nValid types: ${CONFIG.types.join(', ')}\nExample: feat(button): add loading state`,
      severity: 'critical',
    });
  }

  // Check subject length
  if (subject.length > CONFIG.maxSubjectLength) {
    violations.push({
      message: `Subject line too long (${subject.length} > ${CONFIG.maxSubjectLength})`,
      suggestion: 'Keep subject line under 100 characters. Move details to body.',
      severity: 'warning',
    });
  }

  // Check subject starts with lowercase (after type and scope)
  const subjectMatch = subject.match(/^[a-z]+(?:\([a-z0-9-]+\))?: (.+)$/);
  if (subjectMatch) {
    const subjectText = subjectMatch[1];
    if (subjectText && /^[A-Z]/.test(subjectText)) {
      violations.push({
        message: 'Subject should start with lowercase letter',
        suggestion: `Change "${subjectText}" to "${subjectText[0].toLowerCase()}${subjectText.slice(1)}"`,
        severity: 'warning',
      });
    }

    // Check subject doesn't end with period
    if (subjectText && subjectText.endsWith('.')) {
      violations.push({
        message: 'Subject should not end with a period',
        suggestion: `Remove period from "${subjectText}"`,
        severity: 'warning',
      });
    }

    // Check for past tense (common mistake)
    const pastTenseWords = ['added', 'fixed', 'updated', 'changed', 'removed', 'deleted'];
    const words = subjectText.toLowerCase().split(' ');
    const hasPastTense = words.some((word) => pastTenseWords.includes(word));
    if (hasPastTense) {
      violations.push({
        message: 'Subject should use imperative mood (present tense)',
        suggestion: 'Use "add" not "added", "fix" not "fixed", etc.',
        severity: 'warning',
      });
    }
  }

  // Check body line length (if body exists)
  if (lines.length > 2) {
    const body = lines.slice(2);
    for (let i = 0; i < body.length; i++) {
      const line = body[i];
      if (line.length > CONFIG.maxBodyLineLength && !line.startsWith('http')) {
        violations.push({
          message: `Body line ${i + 3} too long (${line.length} > ${CONFIG.maxBodyLineLength})`,
          suggestion: 'Wrap body lines at 100 characters',
          severity: 'warning',
        });
      }
    }
  }

  return {
    passed: violations.filter((v) => v.severity === 'critical').length === 0,
    violations,
    commitMessage: message,
    bypassed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatOutput(result: ValidationResult): void {
  console.log('\n[HOOK] commit-msg-convention (H11)');
  console.log('━'.repeat(60));

  if (result.bypassed) {
    console.log(`\n[INFO] ${result.bypassReason}`);
    console.log('[PASS] Commit message validation bypassed\n');
    return;
  }

  if (result.passed && result.violations.length === 0) {
    console.log('\n[PASS] Commit message follows conventional format\n');
    return;
  }

  const critical = result.violations.filter((v) => v.severity === 'critical');
  const warnings = result.violations.filter((v) => v.severity === 'warning');

  if (critical.length > 0) {
    console.log(`\n[FAIL] ${critical.length} critical violation(s)\n`);
    for (const v of critical) {
      console.log(`❌ ${v.message}`);
      console.log(`💡 ${v.suggestion}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log(`[WARN] ${warnings.length} warning(s)\n`);
    for (const v of warnings) {
      console.log(`⚠️  ${v.message}`);
      console.log(`💡 ${v.suggestion}\n`);
    }
  }

  console.log('─'.repeat(60));
  console.log('Your commit message:');
  console.log('─'.repeat(60));
  console.log(result.commitMessage);
  console.log('─'.repeat(60));

  if (critical.length > 0) {
    console.log('\nConventional Commit Format:');
    console.log('  <type>(<scope>): <subject>');
    console.log('\nExamples:');
    console.log('  feat(button): add loading state');
    console.log('  fix: resolve memory leak in shadow DOM');
    console.log('  docs(storybook): update button stories');
    console.log('─'.repeat(60) + '\n');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    // Get commit message file path from command line args
    const commitMsgFile = process.argv[2];

    if (!commitMsgFile) {
      console.error('\n[ERROR] No commit message file provided');
      console.error('Usage: tsx commit-msg-convention.ts <commit-msg-file>');
      process.exit(1);
    }

    // Read commit message
    const message = readFileSync(commitMsgFile, 'utf-8').trim();

    if (!message) {
      console.error('\n[ERROR] Commit message is empty');
      process.exit(1);
    }

    // Validate
    const result = validateCommitMessage(message);
    formatOutput(result);

    // Exit with appropriate code
    // Allow warnings to pass, only fail on critical violations
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('\n[ERROR] Hook execution failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
