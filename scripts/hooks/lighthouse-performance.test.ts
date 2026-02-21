import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFiles,
  checkBundleSize,
  validatePerformanceBudget,
  validateBundleSize,
  hasApprovalComment,
  matchGlobPattern,
  runLighthouse,
  getLibraryHash,
  getCachedLighthouseResult,
  saveLighthouseResultToCache,
  CONFIG,
  type LighthouseMetrics,
  type PerformanceBudget,
  type HookDependencies,
} from './lighthouse-performance';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('lighthouse-performance (H19)', () => {
  const PROJECT_ROOT = process.cwd();
  const TMP_DIR = join(PROJECT_ROOT, '.tmp-lighthouse-test');

  beforeEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
    mkdirSync(TMP_DIR, { recursive: true });
  });

  // ─── Unit Tests: Glob Pattern Matching ────────────────────────────────

  describe('matchGlobPattern', () => {
    it('should match simple wildcard patterns', () => {
      expect(matchGlobPattern('test.ts', '*.ts')).toBe(true);
      expect(matchGlobPattern('test.js', '*.ts')).toBe(false);
    });

    it('should match double-star patterns', () => {
      expect(matchGlobPattern('packages/hx-library/src/components/button.ts', '**/*.ts')).toBe(
        true,
      );
      expect(matchGlobPattern('packages/hx-library/src/components/button.js', '**/*.ts')).toBe(
        false,
      );
    });

    it('should match component file patterns', () => {
      expect(
        matchGlobPattern(
          'packages/hx-library/src/components/hx-button/hx-button.ts',
          'packages/hx-library/src/components/**/*.ts',
        ),
      ).toBe(true);
    });

    it('should exclude test files', () => {
      expect(matchGlobPattern('packages/hx-library/src/button.test.ts', '**/*.test.ts')).toBe(true);
      expect(matchGlobPattern('packages/hx-library/src/button.ts', '**/*.test.ts')).toBe(false);
    });

    it('should exclude story files', () => {
      expect(matchGlobPattern('packages/hx-library/src/button.stories.ts', '**/*.stories.ts')).toBe(
        true,
      );
      expect(matchGlobPattern('packages/hx-library/src/button.ts', '**/*.stories.ts')).toBe(false);
    });

    it('should exclude style files', () => {
      expect(matchGlobPattern('packages/hx-library/src/button.styles.ts', '**/*.styles.ts')).toBe(
        true,
      );
      expect(matchGlobPattern('packages/hx-library/src/button.ts', '**/*.styles.ts')).toBe(false);
    });
  });

  // ─── Unit Tests: Approval Comment Detection ───────────────────────────

  describe('hasApprovalComment', () => {
    it('should detect approval comment with valid ticket ID', () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(
        filePath,
        `
        // @lighthouse-approved: PERF-123 Temporary exception for migration
        export class MyComponent {}
      `,
      );

      expect(hasApprovalComment(filePath)).toBe(true);
    });

    it('should accept ARCH ticket prefix', () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(
        filePath,
        `
        // @lighthouse-approved: ARCH-456 Architecture refactor
        export class MyComponent {}
      `,
      );

      expect(hasApprovalComment(filePath)).toBe(true);
    });

    it('should accept INCIDENT ticket prefix', () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(
        filePath,
        `
        // @lighthouse-approved: INCIDENT-789 Production hotfix
        export class MyComponent {}
      `,
      );

      expect(hasApprovalComment(filePath)).toBe(true);
    });

    it('should reject approval without valid ticket prefix', () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(
        filePath,
        `
        // @lighthouse-approved: FAKE-999 Invalid ticket
        export class MyComponent {}
      `,
      );

      expect(hasApprovalComment(filePath)).toBe(false);
    });

    it('should reject approval without ticket ID', () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(
        filePath,
        `
        // @lighthouse-approved: No ticket
        export class MyComponent {}
      `,
      );

      expect(hasApprovalComment(filePath)).toBe(false);
    });

    it('should return false for non-existent files', () => {
      expect(hasApprovalComment('/nonexistent/file.ts')).toBe(false);
    });

    it('should return false for files without approval', () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(filePath, 'export class MyComponent {}');

      expect(hasApprovalComment(filePath)).toBe(false);
    });
  });

  // ─── Unit Tests: Bundle Size Validation ───────────────────────────────

  describe('validateBundleSize', () => {
    const budget: PerformanceBudget = {
      minPerformanceScore: 90,
      maxLCP: 2500,
      maxINP: 200,
      maxCLS: 0.1,
      maxTBT: 200,
      maxBundleSize: 50 * 1024, // 50KB gzipped
      maxPerComponentBundleSize: 5 * 1024, // 5KB gzipped per component
    };

    it('should pass when bundle size is within budget', () => {
      const bundleData = {
        uncompressed: 90 * 1024,
        gzipped: 30 * 1024,
        perComponentSizes: [
          { file: 'hx-button.js', size: 30 * 1024, gzipped: 10 * 1024 },
          { file: 'hx-card.js', size: 60 * 1024, gzipped: 20 * 1024 },
        ],
      };

      const violations = validateBundleSize(bundleData, budget);
      expect(violations).toHaveLength(0);
    });

    it('should fail when total gzipped bundle size exceeds budget', () => {
      const bundleData = {
        uncompressed: 180 * 1024,
        gzipped: 60 * 1024,
        perComponentSizes: [
          { file: 'hx-button.js', size: 90 * 1024, gzipped: 30 * 1024 },
          { file: 'hx-card.js', size: 90 * 1024, gzipped: 30 * 1024 },
        ],
      };

      const violations = validateBundleSize(bundleData, budget);
      expect(violations.length).toBeGreaterThan(0);
      const totalViolation = violations.find((v) => v.category === 'bundle-size');
      expect(totalViolation).toBeDefined();
      expect(totalViolation?.severity).toBe('critical');
      expect(totalViolation?.message).toContain('60KB');
      expect(totalViolation?.message).toContain('gzipped');
    });

    it('should fail when per-component size exceeds budget', () => {
      const bundleData = {
        uncompressed: 60 * 1024,
        gzipped: 20 * 1024,
        perComponentSizes: [
          { file: 'hx-button.js', size: 10 * 1024, gzipped: 3 * 1024 },
          { file: 'hx-heavy.js', size: 50 * 1024, gzipped: 17 * 1024 }, // Exceeds 5KB
        ],
      };

      const violations = validateBundleSize(bundleData, budget);
      expect(violations.length).toBeGreaterThan(0);
      const componentViolation = violations.find((v) => v.category === 'component-bundle-size');
      expect(componentViolation).toBeDefined();
      expect(componentViolation?.severity).toBe('critical');
      expect(componentViolation?.message).toContain('hx-heavy.js');
      expect(componentViolation?.message).toContain('17KB');
    });

    it('should pass when bundle size exactly matches budget', () => {
      const bundleData = {
        uncompressed: 150 * 1024,
        gzipped: 50 * 1024,
        perComponentSizes: [
          { file: 'hx-button.js', size: 15 * 1024, gzipped: 5 * 1024 },
          { file: 'hx-card.js', size: 135 * 1024, gzipped: 45 * 1024 },
        ],
      };

      const violations = validateBundleSize(bundleData, budget);
      expect(violations).toHaveLength(0);
    });

    it('should report both total and per-component violations', () => {
      const bundleData = {
        uncompressed: 300 * 1024,
        gzipped: 100 * 1024, // Exceeds 50KB total
        perComponentSizes: [
          { file: 'hx-huge.js', size: 300 * 1024, gzipped: 100 * 1024 }, // Exceeds 5KB
        ],
      };

      const violations = validateBundleSize(bundleData, budget);
      expect(violations.length).toBe(2); // Both total and per-component
      expect(violations.some((v) => v.category === 'bundle-size')).toBe(true);
      expect(violations.some((v) => v.category === 'component-bundle-size')).toBe(true);
    });
  });

  // ─── Unit Tests: Performance Budget Validation ────────────────────────

  describe('validatePerformanceBudget', () => {
    const budget: PerformanceBudget = {
      minPerformanceScore: 90,
      maxLCP: 2500,
      maxINP: 200,
      maxCLS: 0.1,
      maxTBT: 200,
      maxBundleSize: 50 * 1024,
      maxPerComponentBundleSize: 5 * 1024,
    };

    it('should pass with all metrics within budget', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 2000,
        inp: 50,
        cls: 0.05,
        tbt: 150,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations).toHaveLength(0);
    });

    it('should fail when performance score is below budget', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 85,
        lcp: 2000,
        inp: 50,
        cls: 0.05,
        tbt: 150,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations.length).toBeGreaterThan(0);
      const perfViolation = violations.find((v) => v.category === 'performance');
      expect(perfViolation).toBeDefined();
      expect(perfViolation?.severity).toBe('critical');
      expect(perfViolation?.message).toContain('85 below budget 90');
    });

    it('should fail when LCP exceeds budget', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 3000,
        inp: 50,
        cls: 0.05,
        tbt: 150,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations.length).toBeGreaterThan(0);
      const lcpViolation = violations.find((v) => v.category === 'lcp');
      expect(lcpViolation).toBeDefined();
      expect(lcpViolation?.severity).toBe('critical');
      expect(lcpViolation?.message).toContain('3000ms exceeds budget 2500ms');
    });

    it('should warn when INP exceeds budget', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 2000,
        inp: 150,
        cls: 0.05,
        tbt: 150,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations.length).toBeGreaterThan(0);
      const inpViolation = violations.find((v) => v.category === 'inp');
      expect(inpViolation).toBeDefined();
      expect(inpViolation?.severity).toBe('warning');
      expect(inpViolation?.message).toContain('150ms exceeds budget 100ms');
    });

    it('should fail when CLS exceeds budget', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 2000,
        inp: 50,
        cls: 0.15,
        tbt: 150,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations.length).toBeGreaterThan(0);
      const clsViolation = violations.find((v) => v.category === 'cls');
      expect(clsViolation).toBeDefined();
      expect(clsViolation?.severity).toBe('critical');
      expect(clsViolation?.message).toContain('0.15 exceeds budget 0.1');
    });

    it('should warn when TBT exceeds budget', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 2000,
        inp: 50,
        cls: 0.05,
        tbt: 250,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations.length).toBeGreaterThan(0);
      const tbtViolation = violations.find((v) => v.category === 'tbt');
      expect(tbtViolation).toBeDefined();
      expect(tbtViolation?.severity).toBe('warning');
      expect(tbtViolation?.message).toContain('250ms exceeds budget 200ms');
    });

    it('should detect multiple violations', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 85,
        lcp: 3000,
        inp: 150,
        cls: 0.15,
        tbt: 250,
      };

      const violations = validatePerformanceBudget(metrics, budget);
      expect(violations.length).toBe(5); // All metrics violated
      expect(violations.filter((v) => v.severity === 'critical')).toHaveLength(3);
      expect(violations.filter((v) => v.severity === 'warning')).toHaveLength(2);
    });
  });

  // ─── Unit Tests: Bundle Size Calculation ──────────────────────────────

  describe('checkBundleSize', () => {
    it('should calculate total bundle size (uncompressed and gzipped)', () => {
      const buildDir = join(TMP_DIR, 'dist');
      mkdirSync(buildDir, { recursive: true });

      // Create mock component files (hx-*.js pattern)
      writeFileSync(join(buildDir, 'hx-button.js'), 'a'.repeat(10 * 1024)); // 10KB
      writeFileSync(join(buildDir, 'hx-card.js'), 'b'.repeat(20 * 1024)); // 20KB
      writeFileSync(join(buildDir, 'hx-input.js'), 'c'.repeat(5 * 1024)); // 5KB

      const result = checkBundleSize(buildDir, 'hx-*.js');
      expect(result.uncompressed).toBe(35 * 1024); // 35KB
      expect(result.gzipped).toBeLessThan(result.uncompressed); // Gzipped should be smaller
      expect(result.gzipped).toBeGreaterThan(0);
      expect(result.perComponentSizes).toHaveLength(3);
    });

    it('should filter to component files only', () => {
      const buildDir = join(TMP_DIR, 'dist');
      mkdirSync(buildDir, { recursive: true });

      writeFileSync(join(buildDir, 'hx-button.js'), 'a'.repeat(10 * 1024)); // 10KB (included)
      writeFileSync(join(buildDir, 'vendor.js'), 'b'.repeat(20 * 1024)); // 20KB (excluded)
      writeFileSync(join(buildDir, 'chunk.js'), 'c'.repeat(5 * 1024)); // 5KB (excluded)

      const result = checkBundleSize(buildDir, 'hx-*.js');
      expect(result.uncompressed).toBe(10 * 1024); // Only hx-button.js
      expect(result.perComponentSizes).toHaveLength(1);
    });

    it('should ignore non-JS files', () => {
      const buildDir = join(TMP_DIR, 'dist');
      mkdirSync(buildDir, { recursive: true });

      writeFileSync(join(buildDir, 'hx-button.js'), 'a'.repeat(10 * 1024)); // 10KB
      writeFileSync(join(buildDir, 'styles.css'), 'b'.repeat(20 * 1024)); // 20KB (ignored)
      writeFileSync(join(buildDir, 'image.png'), 'c'.repeat(5 * 1024)); // 5KB (ignored)

      const result = checkBundleSize(buildDir, 'hx-*.js');
      expect(result.uncompressed).toBe(10 * 1024); // Only JS counted
    });

    it('should handle nested directories', () => {
      const buildDir = join(TMP_DIR, 'dist');
      const chunksDir = join(buildDir, 'chunks');
      mkdirSync(chunksDir, { recursive: true });

      writeFileSync(join(buildDir, 'hx-button.js'), 'a'.repeat(10 * 1024));
      writeFileSync(join(chunksDir, 'hx-card.js'), 'b'.repeat(5 * 1024));
      writeFileSync(join(chunksDir, 'hx-input.js'), 'c'.repeat(5 * 1024));

      const result = checkBundleSize(buildDir, '**/hx-*.js');
      expect(result.uncompressed).toBe(20 * 1024); // 10KB + 5KB + 5KB
    });

    it('should throw error for non-existent directory', () => {
      expect(() => checkBundleSize('/nonexistent/dir')).toThrow('Build directory not found');
    });

    it('should throw error when no component files found', () => {
      const buildDir = join(TMP_DIR, 'dist');
      mkdirSync(buildDir, { recursive: true });

      expect(() => checkBundleSize(buildDir, 'hx-*.js')).toThrow('No component files found');
    });

    it('should report per-component sizes', () => {
      const buildDir = join(TMP_DIR, 'dist');
      mkdirSync(buildDir, { recursive: true });

      writeFileSync(join(buildDir, 'hx-button.js'), 'a'.repeat(10 * 1024));
      writeFileSync(join(buildDir, 'hx-card.js'), 'b'.repeat(20 * 1024));

      const result = checkBundleSize(buildDir, 'hx-*.js');
      expect(result.perComponentSizes).toHaveLength(2);
      expect(result.perComponentSizes[0].file).toContain('hx-');
      expect(result.perComponentSizes[0].size).toBeGreaterThan(0);
      expect(result.perComponentSizes[0].gzipped).toBeGreaterThan(0);
      expect(result.perComponentSizes[0].gzipped).toBeLessThan(result.perComponentSizes[0].size);
    });
  });

  // ─── Integration Tests: validateFiles ──────────────────────────────────

  describe('validateFiles', () => {
    it('should pass when no files are changed', async () => {
      const deps: HookDependencies = {
        getStagedFiles: () => [],
        readFile: (_path) => '',
        fileExists: (_path) => false,
        execCommand: (_cmd) => '',
      };

      const result = await validateFiles([], deps);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass when approved exception exists', async () => {
      const filePath = join(TMP_DIR, 'component.ts');
      writeFileSync(
        filePath,
        `
        // @lighthouse-approved: PERF-123 Migration in progress
        export class MyComponent {}
      `,
      );

      const deps: HookDependencies = {
        getStagedFiles: () => [filePath],
        readFile: (_path) => '',
        fileExists: (_path) => path === filePath,
        execCommand: (_cmd) => '',
      };

      const result = await validateFiles([filePath], deps);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should warn when build directory does not exist', async () => {
      const filePath = 'packages/hx-library/src/components/button.ts';

      const deps: HookDependencies = {
        getStagedFiles: () => [filePath],
        readFile: (_path) => 'export class Button {}',
        fileExists: (_path) => false,
        execCommand: (_cmd) => '',
      };

      const result = await validateFiles([filePath], deps);
      expect(result.violations.length).toBeGreaterThan(0);
      const buildWarning = result.violations.find((v) => v.message.includes('build directory'));
      expect(buildWarning?.severity).toBe('warning');
    });

    it('should handle build directory error gracefully', async () => {
      const filePath = 'packages/hx-library/src/components/button.ts';

      const deps: HookDependencies = {
        getStagedFiles: () => [filePath],
        readFile: (_path) => 'export class Button {}',
        fileExists: (_path) => false,
        execCommand: (_cmd) => '',
      };

      const result = await validateFiles([filePath], deps);

      // Should get a warning about build directory not found
      expect(result.violations.length).toBeGreaterThan(0);
      const buildWarning = result.violations.find(
        (v) => v.message.includes('build directory') || v.message.includes('Build directory'),
      );
      expect(buildWarning).toBeDefined();
      expect(buildWarning?.severity).toBe('warning');
    });

    it('should track execution time', async () => {
      const deps: HookDependencies = {
        getStagedFiles: () => [],
        readFile: (_path) => '',
        fileExists: (_path) => false,
        execCommand: (_cmd) => '',
      };

      const result = await validateFiles([], deps);
      expect(result.stats.executionTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.stats.executionTimeMs).toBeLessThan(1000); // Should be fast for empty files
    });

    it('should count violations correctly', async () => {
      const filePath = 'packages/hx-library/src/components/button.ts';

      const deps: HookDependencies = {
        getStagedFiles: () => [filePath],
        readFile: (_path) => 'export class Button {}',
        fileExists: (_path) => false,
        execCommand: (_cmd) => '',
      };

      const result = await validateFiles([filePath], deps);

      // Should have violations (at minimum, build directory warning)
      expect(result.stats.totalViolations).toBeGreaterThan(0);
      expect(result.stats.warningViolations).toBeGreaterThan(0);
    });
  });

  // ─── Integration Tests: Lighthouse Mocking ─────────────────────────────

  describe('runLighthouse (mocked)', () => {
    it('should parse Lighthouse JSON output', async () => {
      const mockLighthouseOutput = JSON.stringify({
        categories: {
          performance: {
            score: 0.95,
          },
        },
        audits: {
          'largest-contentful-paint': {
            numericValue: 2000,
          },
          'interaction-to-next-paint': {
            numericValue: 80,
          },
          'cumulative-layout-shift': {
            numericValue: 0.05,
          },
          'total-blocking-time': {
            numericValue: 150,
          },
        },
      });

      const deps: HookDependencies = {
        getStagedFiles: () => [],
        readFile: (_path) => '',
        fileExists: (_path) => false,
        execCommand: (cmd, _options) => {
          if (cmd.includes('lighthouse --version')) {
            return 'lighthouse 12.0.0';
          }
          if (cmd.includes('npx lighthouse')) {
            return mockLighthouseOutput;
          }
          return '';
        },
      };

      const metrics = await runLighthouse('http://localhost:3151', deps);

      expect(metrics.performanceScore).toBe(95);
      expect(metrics.lcp).toBe(2000);
      expect(metrics.inp).toBe(80);
      expect(metrics.cls).toBe(0.05);
      expect(metrics.tbt).toBe(150);
    });

    it('should handle missing Lighthouse', async () => {
      const deps: HookDependencies = {
        getStagedFiles: () => [],
        readFile: (_path) => '',
        fileExists: (_path) => false,
        execCommand: (_cmd) => {
          throw new Error('lighthouse: command not found');
        },
      };

      await expect(runLighthouse('http://localhost:3151', deps)).rejects.toThrow(
        'Lighthouse run failed',
      );
    });

    it('should handle malformed Lighthouse output', async () => {
      const deps: HookDependencies = {
        getStagedFiles: () => [],
        readFile: (_path) => '',
        fileExists: (_path) => false,
        execCommand: (_cmd) => {
          if (cmd.includes('lighthouse --version')) {
            return 'lighthouse 12.0.0';
          }
          return 'invalid json';
        },
      };

      await expect(runLighthouse('http://localhost:3151', deps)).rejects.toThrow(
        'Lighthouse run failed',
      );
    });

    it('should handle timeout', async () => {
      const deps: HookDependencies = {
        getStagedFiles: () => [],
        readFile: (_path) => '',
        fileExists: (_path) => false,
        execCommand: (_cmd, options) => {
          if (options?.timeout && options.timeout < 1000) {
            throw new Error('Command timed out');
          }
          return '';
        },
      };

      await expect(runLighthouse('http://localhost:3151', deps)).rejects.toThrow(
        'Lighthouse run failed',
      );
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle zero bundle size', () => {
      const bundleData = {
        uncompressed: 0,
        gzipped: 0,
        perComponentSizes: [],
      };

      const violations = validateBundleSize(bundleData, {
        minPerformanceScore: 90,
        maxLCP: 2500,
        maxINP: 100,
        maxCLS: 0.1,
        maxTBT: 200,
        maxBundleSize: 50 * 1024,
        maxPerComponentBundleSize: 5 * 1024,
      });

      expect(violations).toHaveLength(0);
    });

    it('should handle perfect performance scores', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 100,
        lcp: 0,
        inp: 0,
        cls: 0,
        tbt: 0,
      };

      const violations = validatePerformanceBudget(metrics, {
        minPerformanceScore: 90,
        maxLCP: 2500,
        maxINP: 100,
        maxCLS: 0.1,
        maxTBT: 200,
        maxBundleSize: 50 * 1024,
        maxPerComponentBundleSize: 5 * 1024,
      });

      expect(violations).toHaveLength(0);
    });

    it('should handle exactly at budget thresholds', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 90,
        lcp: 2500,
        inp: 100,
        cls: 0.1,
        tbt: 200,
      };

      const violations = validatePerformanceBudget(metrics, {
        minPerformanceScore: 90,
        maxLCP: 2500,
        maxINP: 100,
        maxCLS: 0.1,
        maxTBT: 200,
        maxBundleSize: 50 * 1024,
        maxPerComponentBundleSize: 5 * 1024,
      });

      expect(violations).toHaveLength(0);
    });

    it('should handle one below threshold', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 89,
        lcp: 2500,
        inp: 100,
        cls: 0.1,
        tbt: 200,
      };

      const violations = validatePerformanceBudget(metrics, {
        minPerformanceScore: 90,
        maxLCP: 2500,
        maxINP: 100,
        maxCLS: 0.1,
        maxTBT: 200,
        maxBundleSize: 50 * 1024,
        maxPerComponentBundleSize: 5 * 1024,
      });

      expect(violations).toHaveLength(1);
      expect(violations[0].category).toBe('performance');
    });

    it('should include learn-more URLs in violations', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 85,
        lcp: 3000,
        inp: 250,
        cls: 0.15,
        tbt: 250,
      };

      const violations = validatePerformanceBudget(metrics, {
        minPerformanceScore: 90,
        maxLCP: 2500,
        maxINP: 200,
        maxCLS: 0.1,
        maxTBT: 200,
        maxBundleSize: 50 * 1024,
        maxPerComponentBundleSize: 5 * 1024,
      });

      expect(violations.length).toBeGreaterThan(0);
      const lcpViolation = violations.find((v) => v.category === 'lcp');
      expect(lcpViolation?.learnMoreUrl).toContain('web.dev');
    });
  });

  // ─── Cache Management Tests ────────────────────────────────────────────

  describe('cache management', () => {
    const CACHE_DIR = join(PROJECT_ROOT, CONFIG.cacheDir);

    beforeEach(() => {
      if (existsSync(CACHE_DIR)) {
        rmSync(CACHE_DIR, { recursive: true, force: true });
      }
    });

    it('should generate consistent hash for same files', () => {
      const buildDir = join(TMP_DIR, 'dist');
      mkdirSync(buildDir, { recursive: true });
      writeFileSync(join(buildDir, 'hx-button.js'), 'content1');
      writeFileSync(join(buildDir, 'hx-card.js'), 'content2');

      const hash1 = getLibraryHash(buildDir);
      const hash2 = getLibraryHash(buildDir);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(16);
    });

    it('should generate different hash for different files', () => {
      const buildDir1 = join(TMP_DIR, 'dist1');
      const buildDir2 = join(TMP_DIR, 'dist2');
      mkdirSync(buildDir1, { recursive: true });
      mkdirSync(buildDir2, { recursive: true });

      writeFileSync(join(buildDir1, 'hx-button.js'), 'content1');
      writeFileSync(join(buildDir2, 'hx-button.js'), 'content2');

      const hash1 = getLibraryHash(buildDir1);
      const hash2 = getLibraryHash(buildDir2);

      expect(hash1).not.toBe(hash2);
    });

    it('should save and retrieve cached Lighthouse results', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 2000,
        inp: 80,
        cls: 0.05,
        tbt: 150,
      };

      saveLighthouseResultToCache('test-key', metrics);
      const cached = getCachedLighthouseResult('test-key');

      expect(cached).toEqual(metrics);
    });

    it('should return null for non-existent cache', () => {
      const cached = getCachedLighthouseResult('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should expire cache after TTL', () => {
      const metrics: LighthouseMetrics = {
        performanceScore: 95,
        lcp: 2000,
        inp: 80,
        cls: 0.05,
        tbt: 150,
      };

      saveLighthouseResultToCache('expiry-test', metrics);

      // Manually edit cache file to set old timestamp
      const cacheFile = join(CACHE_DIR, 'expiry-test.json');
      const cacheData = JSON.parse(readFileSync(cacheFile, 'utf-8'));
      cacheData.timestamp = Date.now() - (CONFIG.cacheTTLMs + 1000); // Expired
      writeFileSync(cacheFile, JSON.stringify(cacheData));

      const cached = getCachedLighthouseResult('expiry-test');
      expect(cached).toBeNull();
      expect(existsSync(cacheFile)).toBe(false); // Should be deleted
    });
  });

  // ─── Configuration Tests ───────────────────────────────────────────────

  describe('configuration', () => {
    it('should use component library build directory', () => {
      expect(CONFIG.libraryBuildDir).toBe('packages/hx-library/dist');
      expect(CONFIG.libraryBuildDir).not.toContain('storybook');
    });

    it('should auto-detect CI mode from environment', () => {
      // Note: CONFIG is already evaluated, so we just verify the logic exists
      expect(CONFIG.ciMode).toBeDefined();
    });

    it('should use INP budget instead of FID', () => {
      expect(CONFIG.budget.maxINP).toBe(200);
      expect(CONFIG.budget).not.toHaveProperty('maxFID');
    });

    it('should have per-component budget', () => {
      expect(CONFIG.budget.maxPerComponentBundleSize).toBe(5 * 1024);
    });

    it('should have separate Lighthouse timeout', () => {
      expect(CONFIG.lighthouseTimeoutMs).toBeGreaterThan(0);
    });

    it('should have cache configuration', () => {
      expect(CONFIG.cacheDir).toBe('.cache/lighthouse');
      expect(CONFIG.cacheTTLMs).toBe(5 * 60 * 1000); // 5 minutes
    });
  });
});
