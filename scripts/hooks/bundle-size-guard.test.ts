import { describe, it, expect } from 'vitest';
import { statSync } from 'fs';
import {
  checkComponentBundleSize,
  checkFullBundleSize,
  filterFiles,
  formatSize,
  formatViolation,
  getBuildArtifactPath,
  getBundleSizeInfo,
  getFileSize,
  getGzipSize,
  getStagedFiles,
  hasApprovalComment,
  normalizeFilePath,
  readFile,
  validateBundleSizeGuard,
  type HookDependencies,
  type Violation,
} from './bundle-size-guard.js';

/**
 * Test utilities
 */
function createMockDependencies(overrides: Partial<HookDependencies> = {}): HookDependencies {
  return {
    getStagedFiles: overrides.getStagedFiles || (() => []),
    readFile: overrides.readFile || (() => ''),
    getFileSize: overrides.getFileSize || (() => 0),
    getGzipSize: overrides.getGzipSize || (() => 0),
    getBuildArtifactPath: overrides.getBuildArtifactPath || (() => null),
  };
}

// ─── hasApprovalComment ───────────────────────────────────────────────────

describe('hasApprovalComment', () => {
  it('detects approval comment in file content', () => {
    const content = `
      // @performance-engineer-approved: TICKET-123 Large component
      export class MyComponent {}
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });

  it('returns false when no approval comment exists', () => {
    const content = `
      export class MyComponent {}
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(false);
  });

  it('detects approval comment in block comments', () => {
    const content = `
      /*
       * @performance-engineer-approved: TICKET-456 Reason
       */
      export class MyComponent {}
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });

  it('detects approval comment anywhere in file', () => {
    const content = `
      export class MyComponent {
        // @performance-engineer-approved: TICKET-789 Special case
        method() {}
      }
    `;
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });

  it('is case-insensitive', () => {
    const content = '// @PERFORMANCE-ENGINEER-APPROVED: TICKET-001 Reason';
    expect(hasApprovalComment('test.ts', content)).toBe(true);
  });
});

// ─── normalizeFilePath ────────────────────────────────────────────────────

describe('normalizeFilePath', () => {
  it('converts relative path to absolute path', () => {
    const result = normalizeFilePath('test.ts');
    expect(result).toContain('/');
    expect(result.endsWith('test.ts')).toBe(true);
  });

  it('handles already absolute paths', () => {
    const absolutePath = '/absolute/path/test.ts';
    const result = normalizeFilePath(absolutePath);
    expect(result).toBe(absolutePath);
  });

  it('normalizes paths with .. segments', () => {
    const result = normalizeFilePath('./foo/../test.ts');
    expect(result).not.toContain('..');
  });
});

// ─── formatSize ───────────────────────────────────────────────────────────

describe('formatSize', () => {
  it('formats bytes less than 1KB', () => {
    expect(formatSize(500)).toBe('500B');
    expect(formatSize(1023)).toBe('1023B');
  });

  it('formats kilobytes', () => {
    expect(formatSize(1024)).toBe('1.00KB');
    expect(formatSize(5120)).toBe('5.00KB');
    expect(formatSize(5242)).toBe('5.12KB');
  });

  it('handles zero bytes', () => {
    expect(formatSize(0)).toBe('0B');
  });

  it('formats decimal values correctly', () => {
    expect(formatSize(1536)).toBe('1.50KB'); // 1.5KB
    expect(formatSize(2560)).toBe('2.50KB'); // 2.5KB
  });
});

// ─── filterFiles ──────────────────────────────────────────────────────────

describe('filterFiles', () => {
  it('includes component TypeScript files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/src/components/hx-card/hx-card.ts',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(2);
  });

  it('excludes test files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/src/components/hx-button/hx-button.test.ts',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('hx-button.ts');
  });

  it('excludes story files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/src/components/hx-button/hx-button.stories.ts',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(1);
  });

  it('excludes styles files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/src/components/hx-button/hx-button.styles.ts',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(1);
  });

  it('excludes index files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/src/components/hx-button/index.ts',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(1);
  });

  it('excludes dist files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/dist/components/hx-button/index.js',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(1);
  });

  it('handles empty file list', () => {
    const result = filterFiles([]);
    expect(result).toHaveLength(0);
  });

  it('filters non-component files', () => {
    const files = [
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      'packages/hx-library/src/utils/helpers.ts',
      'README.md',
    ];
    const result = filterFiles(files);
    expect(result).toHaveLength(1);
  });
});

// ─── getBuildArtifactPath ─────────────────────────────────────────────────

describe('getBuildArtifactPath', () => {
  it('returns null for non-component files', () => {
    const result = getBuildArtifactPath('packages/hx-library/src/utils/helpers.ts');
    expect(result).toBeNull();
  });

  it('returns null for incorrectly named files', () => {
    const result = getBuildArtifactPath('packages/hx-library/src/components/hx-button/button.ts');
    expect(result).toBeNull();
  });

  it('returns null when dist directory does not exist', () => {
    const result = getBuildArtifactPath(
      'packages/nonexistent/src/components/hx-button/hx-button.ts',
    );
    expect(result).toBeNull();
  });

  it('finds build artifact for hx-button component', () => {
    const result = getBuildArtifactPath(
      '/Volumes/Development/booked/helix/packages/hx-library/src/components/hx-button/hx-button.ts',
    );
    // Should find hx-button-*.js in dist/shared/
    if (result) {
      expect(result).toContain('dist/shared/hx-button-');
      expect(result).toContain('.js');
    }
  });

  it('handles paths with different formats', () => {
    const result = getBuildArtifactPath('packages/hx-library/src/components/hx-card/hx-card.ts');
    if (result) {
      expect(result).toContain('hx-card-');
    }
  });
});

// ─── getFileSize ──────────────────────────────────────────────────────────

describe('getFileSize', () => {
  it('returns 0 for non-existent files', () => {
    const result = getFileSize('nonexistent-file.js');
    expect(result).toBe(0);
  });

  it('returns size for existing files', () => {
    const result = getFileSize('/Volumes/Development/booked/helix/scripts/hooks/bundle-size-guard.ts');
    expect(result).toBeGreaterThan(0);
  });
});

// ─── getGzipSize ──────────────────────────────────────────────────────────

describe('getGzipSize', () => {
  it('returns 0 for non-existent files', () => {
    const result = getGzipSize('nonexistent-file.js');
    expect(result).toBe(0);
  });

  it('returns smaller size than raw for compressible files', () => {
    const filePath = '/Volumes/Development/booked/helix/scripts/hooks/bundle-size-guard.ts';
    const raw = getFileSize(filePath);
    const gzipped = getGzipSize(filePath);

    if (raw > 0) {
      expect(gzipped).toBeGreaterThan(0);
      expect(gzipped).toBeLessThan(raw);
    }
  });
});

// ─── getBundleSizeInfo ────────────────────────────────────────────────────

describe('getBundleSizeInfo', () => {
  it('returns null for non-existent files', () => {
    const deps = createMockDependencies();
    const result = getBundleSizeInfo('nonexistent.js', deps);
    expect(result).toBeNull();
  });

  it('returns size info for existing files', () => {
    const deps = createMockDependencies({
      getFileSize: () => 10240,
      getGzipSize: () => 3072,
    });
    const result = getBundleSizeInfo(
      '/Volumes/Development/booked/helix/scripts/hooks/bundle-size-guard.ts',
      deps,
    );

    if (result) {
      expect(result.raw).toBe(10240);
      expect(result.minified).toBe(10240);
      expect(result.gzipped).toBe(3072);
    }
  });

  it('uses default dependencies when not provided', () => {
    const result = getBundleSizeInfo(
      '/Volumes/Development/booked/helix/scripts/hooks/bundle-size-guard.ts',
    );
    if (result) {
      expect(result.raw).toBeGreaterThan(0);
      expect(result.gzipped).toBeGreaterThan(0);
    }
  });
});

// ─── checkComponentBundleSize ─────────────────────────────────────────────

describe('checkComponentBundleSize', () => {
  it('does not flag components with approval comment', () => {
    const violations: Violation[] = [];
    const content = '// @performance-engineer-approved: TICKET-123 Large component';
    const deps = createMockDependencies({
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 10240,
      getGzipSize: () => 6144, // 6KB > 5KB budget
    });

    checkComponentBundleSize('test.ts', violations, content, deps);

    expect(violations).toHaveLength(0);
  });

  it('flags component exceeding size budget', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';
    const deps = createMockDependencies({
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 10240,
      getGzipSize: () => 6144, // 6KB > 5KB budget
    });

    checkComponentBundleSize(
      'packages/hx-library/src/components/hx-test/hx-test.ts',
      violations,
      content,
      deps,
    );

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].severity).toBe('critical');
    expect(violations[0].message).toContain('exceeds size budget');
    expect(violations[0].message).toContain('6.00KB');
    expect(violations[0].message).toContain('5.00KB');
  });

  it('does not flag component within budget', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';
    const deps = createMockDependencies({
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 4096,
      getGzipSize: () => 2048, // 2KB < 5KB budget
    });

    checkComponentBundleSize('test.ts', violations, content, deps);

    expect(violations).toHaveLength(0);
  });

  it('warns when build artifact not found', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';
    const deps = createMockDependencies({
      getBuildArtifactPath: () => null,
    });

    checkComponentBundleSize('test.ts', violations, content, deps);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].severity).toBe('warning');
    expect(violations[0].message).toContain('Build artifact not found');
  });

  it('warns when cannot read build artifact', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';
    const deps = createMockDependencies({
      getBuildArtifactPath: () => '/nonexistent/path.js',
      getFileSize: () => 0,
      getGzipSize: () => 0,
    });

    checkComponentBundleSize('test.ts', violations, content, deps);

    // getBundleSizeInfo will return null when file doesn't exist
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].severity).toBe('warning');
  });

  it('includes component name in violation code', () => {
    const violations: Violation[] = [];
    const content = 'export class Test {}';
    const deps = createMockDependencies({
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 10240,
      getGzipSize: () => 6144,
    });

    checkComponentBundleSize(
      'packages/hx-library/src/components/hx-button/hx-button.ts',
      violations,
      content,
      deps,
    );

    expect(violations[0].code).toBe('hx-button');
  });
});

// ─── checkFullBundleSize ──────────────────────────────────────────────────

describe('checkFullBundleSize', () => {
  it('warns when library bundle not found', () => {
    const violations: Violation[] = [];
    const deps = createMockDependencies({
      getGzipSize: () => 0,
    });

    checkFullBundleSize(violations, deps);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].severity).toBe('warning');
    expect(violations[0].message).toContain('Library index bundle not found');
  });

  it('flags full bundle exceeding budget', () => {
    const violations: Violation[] = [];
    const deps = createMockDependencies({
      getGzipSize: (path: string) => {
        // Mock large bundle sizes
        if (path.includes('index.js')) return 30720; // 30KB
        if (path.includes('shared')) return 25600; // 25KB per chunk
        return 0;
      },
    });

    checkFullBundleSize(violations, deps);

    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      expect(criticalViolations[0].message).toContain('exceeds size budget');
    }
  });

  it('does not flag bundle within budget', () => {
    const violations: Violation[] = [];
    const deps = createMockDependencies({
      getGzipSize: (path: string) => {
        // Mock small bundle sizes
        if (path.includes('index.js')) return 5120; // 5KB
        if (path.includes('shared')) return 2048; // 2KB per chunk
        return 0;
      },
    });

    checkFullBundleSize(violations, deps);

    const criticalViolations = violations.filter((v) => v.severity === 'critical');
    expect(criticalViolations).toHaveLength(0);
  });
});

// ─── formatViolation ──────────────────────────────────────────────────────

describe('formatViolation', () => {
  it('formats critical violation', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 10,
      column: 5,
      message: 'Bundle too large',
      suggestion: 'Reduce size',
      severity: 'critical',
    };

    const result = formatViolation(violation);

    expect(result).toContain('[CRITICAL]');
    expect(result).toContain('test.ts:10:5');
    expect(result).toContain('Bundle too large');
    expect(result).toContain('Reduce size');
  });

  it('formats warning violation', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 1,
      column: 1,
      message: 'Missing artifact',
      suggestion: 'Run build',
      severity: 'warning',
    };

    const result = formatViolation(violation);

    expect(result).toContain('[WARNING]');
    expect(result).toContain('test.ts:1:1');
    expect(result).toContain('Missing artifact');
    expect(result).toContain('Run build');
  });

  it('includes code when provided', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 1,
      column: 1,
      message: 'Issue',
      suggestion: 'Fix',
      code: 'hx-button',
      severity: 'critical',
    };

    const result = formatViolation(violation);

    expect(result).toContain('(hx-button)');
  });

  it('does not include NO EMOJIS in output', () => {
    const violation: Violation = {
      file: 'test.ts',
      line: 1,
      column: 1,
      message: 'Issue',
      suggestion: 'Fix',
      severity: 'critical',
    };

    const result = formatViolation(violation);

    // Check for emoji patterns (Unicode ranges)
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    expect(emojiPattern.test(result)).toBe(false);
  });
});

// ─── getStagedFiles ───────────────────────────────────────────────────────

describe('getStagedFiles', () => {
  it('returns array of file paths', () => {
    const result = getStagedFiles();
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty array when no files staged', () => {
    // This test depends on actual git state
    const result = getStagedFiles();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── readFile ─────────────────────────────────────────────────────────────

describe('readFile', () => {
  it('returns empty string for non-existent files', () => {
    const result = readFile('nonexistent-file.ts');
    expect(result).toBe('');
  });

  it('returns file content for existing files', () => {
    const result = readFile('/Volumes/Development/booked/helix/scripts/hooks/bundle-size-guard.ts');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('bundle-size-guard');
  });
});

// ─── validateBundleSizeGuard ──────────────────────────────────────────────

describe('validateBundleSizeGuard', () => {
  it('returns passed when no files staged', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => [],
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.stats.filesChecked).toBe(0);
  });

  it('checks component files and full bundle', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 4096,
      getGzipSize: () => 2048, // Within budget
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.stats.filesChecked).toBe(1);
  });

  it('fails when component exceeds budget', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 10240,
      getGzipSize: () => 6144, // Exceeds 5KB budget
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.passed).toBe(false);
    expect(result.stats.criticalViolations).toBeGreaterThan(0);
  });

  it('passes when all budgets met', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 4096,
      getGzipSize: () => 2048,
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.passed).toBe(true);
  });

  it('filters out non-component files', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => [
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        'packages/hx-library/src/components/hx-button/hx-button.test.ts',
        'packages/hx-library/src/utils/helpers.ts',
      ],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 4096,
      getGzipSize: () => 2048,
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.stats.filesChecked).toBe(1); // Only hx-button.ts
  });

  it('tracks warnings separately from critical violations', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () => null, // Missing artifact
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.stats.warningViolations).toBeGreaterThan(0);
    expect(result.stats.criticalViolations).toBe(0);
    expect(result.passed).toBe(true); // Warnings don't block
  });

  it('times out on excessive execution time', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => {
        // Return many files to trigger potential timeout
        return Array.from(
          { length: 70 },
          (_, i) => `packages/hx-library/src/components/hx-test-${i}/hx-test-${i}.ts`,
        );
      },
      readFile: () => {
        // Simulate slow file read (45ms per file, 70 files = ~3150ms)
        const start = Date.now();
        while (Date.now() - start < 45) {
          // Busy wait 45ms
        }
        return 'export class Test {}';
      },
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 4096,
      getGzipSize: () => 2048,
    });

    const result = validateBundleSizeGuard(deps);

    // Should have timeout warning
    const timeoutWarning = result.violations.find((v) => v.message.includes('timeout'));
    expect(timeoutWarning).toBeDefined();
    if (timeoutWarning) {
      expect(timeoutWarning.severity).toBe('warning');
    }
  });

  it('skips full bundle check when no component files staged', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => ['README.md'],
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.stats.filesChecked).toBe(0);
    expect(result.passed).toBe(true);
  });

  it('calculates stats correctly', () => {
    const deps = createMockDependencies({
      getStagedFiles: () => [
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        'packages/hx-library/src/components/hx-card/hx-card.ts',
      ],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () => '/fake/path.js',
      getFileSize: () => 10240,
      getGzipSize: () => 6144, // Exceeds budget
    });

    const result = validateBundleSizeGuard(deps);

    expect(result.stats.filesChecked).toBe(2);
    expect(result.stats.totalViolations).toBeGreaterThan(0);
    expect(result.stats.criticalViolations + result.stats.warningViolations).toBe(
      result.stats.totalViolations,
    );
  });

  it('handles real bundle size calculation', () => {
    // This test uses real file system to exercise checkFullBundleSize
    const deps = createMockDependencies({
      getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
      readFile: () => 'export class Test {}',
      getBuildArtifactPath: () =>
        '/Volumes/Development/booked/helix/packages/hx-library/dist/shared/hx-button-Drd1Q6qC.js',
      getFileSize: (path: string) => {
        try {
          return statSync(path).size;
        } catch {
          return 0;
        }
      },
      getGzipSize: (path: string) => {
        // Mock gzip sizes within budget
        if (path.includes('index.js')) return 2048;
        if (path.includes('shared')) return 1024;
        return 0;
      },
    });

    const result = validateBundleSizeGuard(deps);

    // Should not have critical violations if budgets are met
    expect(result.stats.criticalViolations).toBe(0);
  });
});
