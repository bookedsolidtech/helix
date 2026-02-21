#!/usr/bin/env tsx
/**
 * Hook: lighthouse-performance (H19)
 *
 * Enforces Lighthouse performance budgets before allowing commits that modify component bundles.
 * Execution budget: <60 seconds (includes Lighthouse run)
 *
 * Validates:
 * - Performance Score >=90 (CRITICAL if <90)
 * - LCP (Largest Contentful Paint) <=2.5s (CRITICAL if >2.5s)
 * - INP (Interaction to Next Paint) <=200ms (WARNING if >200ms) - Replaced FID as of March 2024
 * - CLS (Cumulative Layout Shift) <=0.1 (CRITICAL if >0.1)
 * - TBT (Total Blocking Time) <=200ms (WARNING if >200ms)
 * - Bundle Size <50KB total gzipped (CRITICAL if >50KB)
 * - Per-component bundle size <5KB gzipped (CRITICAL if >5KB)
 *
 * Triggers on:
 * - Changes to component source files (packages/hx-library/src/components/**.ts)
 * - Excludes test files, stories, and style files
 *
 * Allows:
 * - Approved exceptions with valid ticket ID (PERF-*, ARCH-*, INCIDENT-*)
 * - --skip-lighthouse flag for emergency commits (discouraged)
 *
 * Architecture:
 * - Measures packages/hx-library/dist (component library), NOT apps/storybook/dist
 * - Auto-detects CI environment (CI=true or GITHUB_ACTIONS)
 * - Caches Lighthouse results (5-minute TTL, keyed by library hash)
 * - Uses gzipped bundle sizes (matches production CDN delivery)
 * - Pins Lighthouse 12.x (prevents breaking changes)
 *
 * Usage:
 *   tsx scripts/hooks/lighthouse-performance.ts
 *   tsx scripts/hooks/lighthouse-performance.ts --json
 *   tsx scripts/hooks/lighthouse-performance.ts --bail-fast
 *   tsx scripts/hooks/lighthouse-performance.ts --ci
 *
 * Integration:
 *   Add to .husky/pre-commit or scripts/pre-commit-check.sh
 *   npm run hooks:lighthouse-performance
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { glob } from 'glob';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  column: number;
  message: string;
  suggestion: string;
  code?: string;
  severity: 'critical' | 'warning';
  category?:
    | 'performance'
    | 'lcp'
    | 'inp'
    | 'cls'
    | 'tbt'
    | 'bundle-size'
    | 'component-bundle-size';
  learnMoreUrl?: string; // Educational resource link
}

interface ValidationResult {
  passed: boolean;
  violations: Violation[];
  stats: {
    filesChecked: number;
    totalViolations: number;
    criticalViolations: number;
    warningViolations: number;
    performanceScore: number;
    lcp: number;
    inp: number;
    cls: number;
    tbt: number;
    bundleSize: number;
    bundleSizeGzipped: number;
    executionTimeMs: number;
  };
}

interface LighthouseMetrics {
  performanceScore: number;
  lcp: number; // milliseconds
  inp: number; // milliseconds (replaces FID as of March 2024)
  cls: number; // score
  tbt: number; // milliseconds
}

interface LighthouseAudit {
  numericValue?: number;
  score?: number;
}

interface LighthouseResult {
  categories?: {
    performance?: {
      score?: number;
    };
  };
  audits?: {
    'largest-contentful-paint'?: LighthouseAudit;
    'interaction-to-next-paint'?: LighthouseAudit;
    'first-input-delay'?: LighthouseAudit;
    'cumulative-layout-shift'?: LighthouseAudit;
    'total-blocking-time'?: LighthouseAudit;
  };
}

interface PerformanceBudget {
  minPerformanceScore: number;
  maxLCP: number; // milliseconds
  maxINP: number; // milliseconds (replaces FID as of March 2024)
  maxCLS: number; // score
  maxTBT: number; // milliseconds
  maxBundleSize: number; // bytes (gzipped)
  maxPerComponentBundleSize: number; // bytes (gzipped)
}

interface HookDependencies {
  getStagedFiles: () => string[];
  readFile: (path: string) => string;
  fileExists: (path: string) => boolean;
  execCommand: (cmd: string, options?: { cwd?: string; timeout?: number }) => string;
}

// ─── Configuration ────────────────────────────────────────────────────────

interface HookConfig {
  readonly componentPatterns: readonly string[];
  readonly excludePatterns: readonly string[];
  readonly approvalComment: string;
  readonly libraryBuildDir: string; // Changed from storybookBuildDir
  readonly componentFilePattern: string; // Pattern to match component files
  readonly storybookUrl: string;
  readonly performanceBudgetMs: number;
  readonly lighthouseTimeoutMs: number; // Separate timeout for Lighthouse
  readonly timeoutMs: number;
  readonly bailFast: boolean;
  readonly ciMode: boolean;
  readonly skipLighthouse: boolean;
  readonly budget: PerformanceBudget;
  readonly cacheDir: string;
  readonly cacheTTLMs: number;
}

const CONFIG: HookConfig = {
  // Component file patterns to watch
  componentPatterns: [
    'packages/hx-library/src/components/**/*.ts',
    'packages/hx-library/src/**/*.ts',
  ],

  excludePatterns: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.stories.ts',
    '**/*.styles.ts',
    '**/dist/**',
    '**/node_modules/**',
    '**/.cache/**',
  ],

  // Approval mechanism
  approvalComment: '@lighthouse-approved',

  // Build configuration - CRITICAL: Use component library, not Storybook
  libraryBuildDir: 'packages/hx-library/dist', // Component library build
  componentFilePattern: '**/hx-*.js', // Pattern to match component files

  // Storybook configuration
  storybookUrl: 'http://localhost:3151',

  // Performance budgets
  performanceBudgetMs: 60000, // 60 seconds for overall hook execution
  lighthouseTimeoutMs: process.env.CI === 'true' ? 180000 : 60000, // 180s CI (3 min), 60s local
  timeoutMs: 120000, // 2 minutes total timeout

  // CLI flags - Auto-detect CI environment
  bailFast: process.argv.includes('--bail-fast'),
  ciMode:
    process.argv.includes('--ci') || process.env.CI === 'true' || !!process.env.GITHUB_ACTIONS,
  skipLighthouse: process.argv.includes('--skip-lighthouse'),

  // Cache configuration (matches H21 dependency-audit pattern)
  cacheDir: '.cache/lighthouse',
  cacheTTLMs: 5 * 60 * 1000, // 5 minutes

  // Performance budget thresholds
  budget: {
    minPerformanceScore: 90,
    maxLCP: 2500, // 2.5 seconds
    maxINP: 200, // 200 milliseconds (replaces FID as of March 2024)
    maxCLS: 0.1, // 0.1 score
    maxTBT: 200, // 200 milliseconds
    maxBundleSize: 50 * 1024, // 50 KB (gzipped)
    maxPerComponentBundleSize: 5 * 1024, // 5 KB per component (gzipped)
  },
};

// ─── Utilities ────────────────────────────────────────────────────────────

/**
 * Get list of staged files
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      timeout: CONFIG.timeoutMs,
      maxBuffer: 1024 * 1024,
    });

    return output
      .split('\n')
      .filter(Boolean)
      .filter((file) => {
        // Check include patterns
        const included = CONFIG.componentPatterns.some((pattern) =>
          matchGlobPattern(file, pattern),
        );
        if (!included) return false;

        // Check exclude patterns
        const excluded = CONFIG.excludePatterns.some((pattern) => matchGlobPattern(file, pattern));
        return !excluded;
      });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get staged files from Git: ${errorMessage}`);
  }
}

/**
 * Simple glob pattern matcher
 */
function matchGlobPattern(filePath: string, pattern: string): boolean {
  // Escape dots first
  let regexPattern = pattern.replace(/\./g, '\\.');

  // Replace ** with placeholder
  regexPattern = regexPattern.replace(/\*\*/g, '§GLOBSTAR§');

  // Replace single * with [^/]* (matches anything except slash)
  regexPattern = regexPattern.replace(/\*/g, '[^/]*');

  // Replace globstar placeholder with .* (matches anything including slashes)
  regexPattern = regexPattern.replace(/§GLOBSTAR§/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Check if file has approval comment with valid ticket ID
 * Valid formats: PERF-123, ARCH-456, INCIDENT-789
 * Rejects: FAKE-999, TODO-123, etc.
 */
function hasApprovalComment(filePath: string): boolean {
  if (!existsSync(filePath)) return false;

  try {
    const content = readFileSync(filePath, 'utf-8');
    // Match: @lighthouse-approved: PERF-123 Reason
    // Valid prefixes: PERF, ARCH, INCIDENT (enterprise ticketing systems)
    const validTicketPattern = /@lighthouse-approved:\s*(PERF|ARCH|INCIDENT)-\d+/;
    return validTicketPattern.test(content);
  } catch {
    return false;
  }
}

/**
 * Calculate bundle size (gzipped) for component library
 * Measures packages/hx-library/dist, NOT apps/storybook/dist
 * Returns both uncompressed and gzipped sizes
 */
function checkBundleSize(
  buildDir: string,
  filePattern?: string,
): {
  uncompressed: number;
  gzipped: number;
  perComponentSizes: Array<{ file: string; size: number; gzipped: number }>;
} {
  const projectRoot = process.cwd();
  const fullBuildPath = resolve(projectRoot, buildDir);

  if (!existsSync(fullBuildPath)) {
    // In local dev, missing build is a warning. In CI, it's critical.
    if (CONFIG.ciMode) {
      throw new Error(
        `CRITICAL: Build directory not found in CI: ${fullBuildPath}. Run 'npm run build:library' before commit.`,
      );
    } else {
      throw new Error(`Build directory not found: ${fullBuildPath}`);
    }
  }

  try {
    // Find component files - filter to hx-*.js pattern by default
    const pattern = filePattern || CONFIG.componentFilePattern;
    const jsFiles = glob.sync(`${fullBuildPath}/${pattern}`, {
      ignore: ['**/node_modules/**', '**/*.map'],
    });

    if (jsFiles.length === 0) {
      throw new Error(`No component files found matching pattern: ${pattern} in ${fullBuildPath}`);
    }

    let totalUncompressed = 0;
    let totalGzipped = 0;
    const perComponentSizes: Array<{ file: string; size: number; gzipped: number }> = [];

    for (const file of jsFiles) {
      const content = readFileSync(file);
      const uncompressedSize = content.length;
      const gzippedSize = gzipSync(content).length;

      totalUncompressed += uncompressedSize;
      totalGzipped += gzippedSize;

      perComponentSizes.push({
        file: file.replace(fullBuildPath + '/', ''),
        size: uncompressedSize,
        gzipped: gzippedSize,
      });
    }

    return {
      uncompressed: totalUncompressed,
      gzipped: totalGzipped,
      perComponentSizes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to calculate bundle size: ${errorMessage}`);
  }
}

/**
 * Generate hash of library build files for cache key
 */
function getLibraryHash(buildDir: string): string {
  try {
    const fullBuildPath = resolve(process.cwd(), buildDir);
    const jsFiles = glob
      .sync(`${fullBuildPath}/${CONFIG.componentFilePattern}`, {
        ignore: ['**/node_modules/**', '**/*.map'],
      })
      .sort(); // Sort for consistent hashing

    const hash = createHash('sha256');
    for (const file of jsFiles) {
      const content = readFileSync(file);
      hash.update(content);
    }
    return hash.digest('hex').substring(0, 16);
  } catch {
    return 'no-hash';
  }
}

/**
 * Get cached Lighthouse result if valid
 */
function getCachedLighthouseResult(cacheKey: string): LighthouseMetrics | null {
  try {
    const cacheFile = join(process.cwd(), CONFIG.cacheDir, `${cacheKey}.json`);
    if (!existsSync(cacheFile)) return null;

    const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
    const age = Date.now() - cached.timestamp;

    if (age > CONFIG.cacheTTLMs) {
      // Cache expired
      rmSync(cacheFile, { force: true });
      return null;
    }

    return cached.metrics;
  } catch {
    return null;
  }
}

/**
 * Save Lighthouse result to cache
 */
function saveLighthouseResultToCache(cacheKey: string, metrics: LighthouseMetrics): void {
  try {
    const cacheDir = join(process.cwd(), CONFIG.cacheDir);
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }

    const cacheFile = join(cacheDir, `${cacheKey}.json`);
    writeFileSync(
      cacheFile,
      JSON.stringify(
        {
          timestamp: Date.now(),
          metrics,
        },
        null,
        2,
      ),
    );
  } catch {
    // Cache write failure is non-critical
  }
}

/**
 * Check if Chrome/Chromium is available
 */
function checkChromeAvailability(): void {
  try {
    // Try common Chrome binary locations
    const chromePaths = [
      'google-chrome',
      'chrome',
      'chromium',
      'chromium-browser',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ];

    let chromeFound = false;

    for (const chromePath of chromePaths) {
      try {
        execSync(`${chromePath} --version 2>/dev/null`, {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: 'pipe',
        });
        chromeFound = true;
        break;
      } catch {
        // Continue to next path
      }
    }

    if (!chromeFound) {
      throw new Error(
        'Chrome/Chromium binary not found. Lighthouse requires Chrome to run performance audits.',
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Chrome pre-check failed: ${errorMessage}. Install Chrome from https://www.google.com/chrome/`,
    );
  }
}

/**
 * Check if Lighthouse is available
 */
function checkLighthouseAvailability(): void {
  try {
    const version = execSync('lighthouse --version', {
      encoding: 'utf-8',
      timeout: 5000,
    }).trim();

    if (!version.includes('lighthouse')) {
      throw new Error('Lighthouse CLI not available');
    }

    // Verify version is 12.x (pinned)
    const versionMatch = version.match(/(\d+)\./);
    if (versionMatch && parseInt(versionMatch[1]) < 12) {
      console.warn(
        `WARNING: Lighthouse version ${version} is outdated. Expected v12.x. Run: npm install lighthouse@~12.8.0`,
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Lighthouse pre-check failed: ${errorMessage}. Install with: npm install lighthouse@~12.8.0`,
    );
  }
}

/**
 * Check if Storybook is available at the configured URL
 */
async function checkStorybookAvailability(url: string): Promise<void> {
  try {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';

    // Import correct module based on protocol
    const httpModule = isHttps ? await import('node:https') : await import('node:http');

    await new Promise<void>((resolve, reject) => {
      const req = httpModule.get(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname,
          timeout: 10000,
        },
        (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Storybook returned status ${res.statusCode}`));
          }
        },
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Storybook connection timeout'));
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Storybook not available at ${url}: ${errorMessage}. Start with: npm run dev:storybook`,
    );
  }
}

/**
 * Run Lighthouse and extract performance metrics
 * Note: In tests, this is mocked. In production, this uses real Lighthouse.
 */
async function runLighthouse(url: string, deps?: HookDependencies): Promise<LighthouseMetrics> {
  // Check cache first
  const cacheKey = getLibraryHash(CONFIG.libraryBuildDir);
  const cached = getCachedLighthouseResult(cacheKey);
  if (cached) {
    console.log('Using cached Lighthouse result (5-minute TTL)');
    return cached;
  }

  // Pre-flight checks (skip in test mode)
  if (!deps) {
    checkChromeAvailability();
    checkLighthouseAvailability();
    await checkStorybookAvailability(url);
  }

  const chromeProcess: unknown = null;

  try {
    let output: string;

    // Use dependency injection for testing
    if (deps?.execCommand) {
      // Test mode
      const lighthouseCmd = `npx lighthouse ${url} --only-categories=performance --output=json --quiet --chrome-flags="--headless --no-sandbox"`;
      output = deps.execCommand(lighthouseCmd, {
        timeout: CONFIG.lighthouseTimeoutMs,
      });
    } else {
      // Production: use real execSync with exponential backoff retry
      const lighthouseCmd = `npx lighthouse ${url} --only-categories=performance --output=json --quiet --chrome-flags="--headless --no-sandbox"`;

      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Exponential backoff: 0ms, 2s, 4s
          if (attempt > 0) {
            const backoffMs = attempt * 2000;
            console.warn(
              `Retry attempt ${attempt}/${maxRetries - 1} after ${backoffMs}ms backoff...`,
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }

          output = execSync(lighthouseCmd, {
            encoding: 'utf-8',
            timeout: CONFIG.lighthouseTimeoutMs,
            maxBuffer: 10 * 1024 * 1024, // 10MB for JSON output
          });

          // Success - break retry loop
          lastError = null;
          break;
        } catch (execError) {
          lastError = execError instanceof Error ? execError : new Error(String(execError));

          if (attempt < maxRetries - 1) {
            console.warn(`Lighthouse attempt ${attempt + 1} failed: ${lastError.message}`);
          }
        }
      }

      if (lastError) {
        throw new Error(`Lighthouse failed after ${maxRetries} attempts: ${lastError.message}`);
      }
    }

    // Robust JSON parsing
    if (!output || output.trim().length === 0) {
      throw new Error('Lighthouse returned empty output');
    }

    let result: LighthouseResult;
    try {
      result = JSON.parse(output) as LighthouseResult;
    } catch (parseError) {
      throw new Error(
        `Failed to parse Lighthouse JSON output: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
    }

    // Validate JSON structure
    if (!result.categories?.performance) {
      throw new Error(
        'Lighthouse result missing performance category. Output may be corrupted or Lighthouse version incompatible.',
      );
    }

    if (!result.audits) {
      throw new Error('Lighthouse result missing audits. Output may be corrupted.');
    }

    // Extract metrics from Lighthouse result
    const performanceScore = Math.round((result.categories?.performance?.score ?? 0) * 100);
    const lcp = result.audits?.['largest-contentful-paint']?.numericValue ?? 0;

    // INP replaces FID as of March 2024
    // Note: INP may not be available in all Lighthouse versions, fallback to first-input-delay
    let inp = result.audits?.['interaction-to-next-paint']?.numericValue ?? 0;
    if (inp === 0) {
      // Fallback to FID (first-input-delay) for older Lighthouse versions
      inp = result.audits?.['first-input-delay']?.numericValue ?? 0;
    }

    const cls = result.audits?.['cumulative-layout-shift']?.numericValue ?? 0;
    const tbt = result.audits?.['total-blocking-time']?.numericValue ?? 0;

    const metrics: LighthouseMetrics = {
      performanceScore,
      lcp: Math.round(lcp),
      inp: Math.round(inp),
      cls: Math.round(cls * 1000) / 1000, // Round to 3 decimals
      tbt: Math.round(tbt),
    };

    // Save to cache
    saveLighthouseResultToCache(cacheKey, metrics);

    return metrics;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Lighthouse run failed: ${errorMessage}`);
  } finally {
    // Clean up Chrome processes (if any)
    // Note: Lighthouse automatically cleans up its Chrome instances
    // DO NOT use pkill - it kills ALL Chrome processes including developer's browser
    if (chromeProcess) {
      try {
        chromeProcess.kill();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Validate performance metrics against budget
 */
function validatePerformanceBudget(
  metrics: LighthouseMetrics,
  budget: PerformanceBudget,
): Violation[] {
  const violations: Violation[] = [];

  // Performance Score
  if (metrics.performanceScore < budget.minPerformanceScore) {
    violations.push({
      file: '<lighthouse>',
      line: 1,
      column: 1,
      message: `Performance score ${metrics.performanceScore} below budget ${budget.minPerformanceScore}`,
      suggestion: `The Performance Score is a weighted average of metric scores. Optimize bundle size, reduce JavaScript execution time, and improve rendering performance. Run "npm run build:library" and analyze with Chrome DevTools Performance panel.`,
      severity: 'critical',
      category: 'performance',
      learnMoreUrl: 'https://web.dev/performance-scoring/',
    });
  }

  // LCP (Largest Contentful Paint)
  if (metrics.lcp > budget.maxLCP) {
    violations.push({
      file: '<lighthouse>',
      line: 1,
      column: 1,
      message: `LCP (Largest Contentful Paint) ${metrics.lcp}ms exceeds budget ${budget.maxLCP}ms`,
      suggestion: `LCP measures when the largest content element becomes visible. Fix: Optimize images (use WebP/AVIF), defer non-critical CSS, preload critical resources (fonts, hero images), reduce server response time. Target: <2.5s for good UX.`,
      severity: 'critical',
      category: 'lcp',
      learnMoreUrl: 'https://web.dev/lcp/',
    });
  }

  // INP (Interaction to Next Paint) - Replaces FID as of March 2024
  if (metrics.inp > budget.maxINP) {
    violations.push({
      file: '<lighthouse>',
      line: 1,
      column: 1,
      message: `INP (Interaction to Next Paint) ${metrics.inp}ms exceeds budget ${budget.maxINP}ms`,
      suggestion: `INP measures responsiveness to user interactions (replaced FID in March 2024). Fix: Reduce JavaScript execution time, break up long tasks (>50ms), use web workers for heavy computation, defer non-critical scripts. Target: <200ms for responsive UI.`,
      severity: 'warning',
      category: 'inp',
      learnMoreUrl: 'https://web.dev/inp/',
    });
  }

  // CLS (Cumulative Layout Shift)
  if (metrics.cls > budget.maxCLS) {
    violations.push({
      file: '<lighthouse>',
      line: 1,
      column: 1,
      message: `CLS (Cumulative Layout Shift) ${metrics.cls} exceeds budget ${budget.maxCLS}`,
      suggestion: `CLS measures visual stability (unexpected layout shifts). Fix: Add explicit width/height to images and embeds, reserve space for dynamic content, avoid inserting content above existing content, use CSS transforms (not top/left) for animations. Target: <0.1 for stable layout.`,
      severity: 'critical',
      category: 'cls',
      learnMoreUrl: 'https://web.dev/cls/',
    });
  }

  // TBT (Total Blocking Time)
  if (metrics.tbt > budget.maxTBT) {
    violations.push({
      file: '<lighthouse>',
      line: 1,
      column: 1,
      message: `TBT (Total Blocking Time) ${metrics.tbt}ms exceeds budget ${budget.maxTBT}ms`,
      suggestion: `TBT measures main thread blocking during page load. Fix: Reduce main thread work, code-split large bundles, defer non-critical JavaScript, use requestIdleCallback for low-priority work. Target: <200ms for smooth interaction.`,
      severity: 'warning',
      category: 'tbt',
      learnMoreUrl: 'https://web.dev/tbt/',
    });
  }

  return violations;
}

/**
 * Validate bundle size against budget (total and per-component)
 * Uses gzipped sizes (matches production CDN delivery)
 */
function validateBundleSize(
  bundleData: {
    uncompressed: number;
    gzipped: number;
    perComponentSizes: Array<{ file: string; size: number; gzipped: number }>;
  },
  budget: PerformanceBudget,
): Violation[] {
  const violations: Violation[] = [];

  // Check total bundle size (gzipped)
  if (bundleData.gzipped > budget.maxBundleSize) {
    const budgetKB = Math.round(budget.maxBundleSize / 1024);
    const actualKB = Math.round(bundleData.gzipped / 1024);
    const uncompressedKB = Math.round(bundleData.uncompressed / 1024);

    violations.push({
      file: '<bundle>',
      line: 1,
      column: 1,
      message: `Total bundle size ${actualKB}KB (gzipped) exceeds budget ${budgetKB}KB (${uncompressedKB}KB uncompressed)`,
      suggestion: `Bundle is too large for production CDN delivery. Fix: Tree-shake unused code, use dynamic imports for lazy loading, minify production builds, analyze bundle composition. Run "npm run build:library" to rebuild.`,
      severity: 'critical',
      category: 'bundle-size',
      learnMoreUrl: 'https://web.dev/reduce-javascript-payloads-with-code-splitting/',
    });
  }

  // Check per-component budget (5KB gzipped per component)
  const oversizedComponents = bundleData.perComponentSizes.filter(
    (comp) => comp.gzipped > budget.maxPerComponentBundleSize,
  );

  if (oversizedComponents.length > 0) {
    for (const comp of oversizedComponents) {
      const budgetKB = Math.round(budget.maxPerComponentBundleSize / 1024);
      const actualKB = Math.round(comp.gzipped / 1024);
      const uncompressedKB = Math.round(comp.size / 1024);

      violations.push({
        file: comp.file,
        line: 1,
        column: 1,
        message: `Component ${comp.file} size ${actualKB}KB (gzipped) exceeds per-component budget ${budgetKB}KB (${uncompressedKB}KB uncompressed)`,
        suggestion: `Single component is too large. Fix: Split large components into smaller sub-components, lazy-load heavy features, reduce inline styles, optimize dependencies. Per-component budget enforces the "factory, not furniture" principle.`,
        severity: 'critical',
        category: 'component-bundle-size',
        learnMoreUrl: 'https://web.dev/reduce-javascript-payloads-with-code-splitting/',
      });
    }
  }

  return violations;
}

// ─── Validation Logic ─────────────────────────────────────────────────────

/**
 * Main validation function
 */
async function validateFiles(files: string[], deps?: HookDependencies): Promise<ValidationResult> {
  const violations: Violation[] = [];
  const startTime = Date.now();

  const stats = {
    filesChecked: files.length,
    totalViolations: 0,
    criticalViolations: 0,
    warningViolations: 0,
    performanceScore: 0,
    lcp: 0,
    inp: 0,
    cls: 0,
    tbt: 0,
    bundleSize: 0,
    bundleSizeGzipped: 0,
    executionTimeMs: 0,
  };

  // Skip if no component files changed
  if (files.length === 0) {
    return {
      passed: true,
      violations: [],
      stats: {
        ...stats,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  // Check for approval comments in changed files
  let hasApproval = false;
  for (const file of files) {
    if (hasApprovalComment(file)) {
      hasApproval = true;
      break;
    }
  }

  if (hasApproval) {
    return {
      passed: true,
      violations: [],
      stats: {
        ...stats,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  // Skip Lighthouse if flag is set (emergency commits)
  if (CONFIG.skipLighthouse) {
    console.warn(
      'WARNING: Skipping Lighthouse check (--skip-lighthouse flag). This should only be used in emergencies.',
    );
    return {
      passed: true,
      violations: [],
      stats: {
        ...stats,
        executionTimeMs: Date.now() - startTime,
      },
    };
  }

  try {
    // Check 1: Bundle size (component library, not Storybook)
    const bundleData = checkBundleSize(CONFIG.libraryBuildDir);
    stats.bundleSize = bundleData.uncompressed;
    stats.bundleSizeGzipped = bundleData.gzipped;

    const bundleViolations = validateBundleSize(bundleData, CONFIG.budget);
    violations.push(...bundleViolations);

    // Bail fast if critical bundle size violation
    if (CONFIG.bailFast && bundleViolations.some((v) => v.severity === 'critical')) {
      stats.criticalViolations = violations.filter((v) => v.severity === 'critical').length;
      stats.warningViolations = violations.filter((v) => v.severity === 'warning').length;
      stats.totalViolations = violations.length;
      stats.executionTimeMs = Date.now() - startTime;

      return {
        passed: false,
        violations,
        stats,
      };
    }

    // Check 2: Run Lighthouse (only in CI mode)
    if (CONFIG.ciMode) {
      const metrics = await runLighthouse(CONFIG.storybookUrl, deps);

      stats.performanceScore = metrics.performanceScore;
      stats.lcp = metrics.lcp;
      stats.inp = metrics.inp;
      stats.cls = metrics.cls;
      stats.tbt = metrics.tbt;

      const performanceViolations = validatePerformanceBudget(metrics, CONFIG.budget);
      violations.push(...performanceViolations);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If bundle directory doesn't exist, severity depends on environment
    if (errorMessage.includes('Build directory not found')) {
      violations.push({
        file: '<build>',
        line: 1,
        column: 1,
        message: CONFIG.ciMode
          ? 'CRITICAL: Component library build directory not found in CI'
          : 'Component library build directory not found',
        suggestion: CONFIG.ciMode
          ? 'CI must have built library. Check build pipeline. Run "npm run build:library" in CI before running hooks.'
          : 'Run "npm run build:library" before committing component changes to validate performance budgets.',
        severity: CONFIG.ciMode ? 'critical' : 'warning',
      });
    } else if (errorMessage.includes('Storybook not available')) {
      // Storybook not running is only critical in CI
      violations.push({
        file: '<lighthouse>',
        line: 1,
        column: 1,
        message: 'Storybook not available for Lighthouse audit',
        suggestion: CONFIG.ciMode
          ? 'CI must have Storybook running. Check CI pipeline. Run "npm run build:storybook && npx serve apps/storybook/dist" in CI.'
          : 'Start Storybook locally: npm run dev:storybook',
        severity: CONFIG.ciMode ? 'critical' : 'warning',
      });
    } else {
      // Other errors are critical
      violations.push({
        file: '<lighthouse>',
        line: 1,
        column: 1,
        message: `Performance validation failed: ${errorMessage}`,
        suggestion:
          'Ensure component library is built and Lighthouse is available. Run "npm run build:library" and install Lighthouse: npm install lighthouse@~12.8.0',
        severity: 'critical',
      });
    }
  }

  stats.criticalViolations = violations.filter((v) => v.severity === 'critical').length;
  stats.warningViolations = violations.filter((v) => v.severity === 'warning').length;
  stats.totalViolations = violations.length;
  stats.executionTimeMs = Date.now() - startTime;

  return {
    passed: stats.criticalViolations === 0,
    violations,
    stats,
  };
}

// ─── Output Formatting ────────────────────────────────────────────────────

function formatOutput(result: ValidationResult, jsonMode: boolean): string {
  if (jsonMode) {
    return JSON.stringify(result, null, 2);
  }

  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('╔═══════════════════════════════════════════════════════════════╗');
  lines.push('║          Lighthouse Performance Budget (H19)                 ║');
  lines.push('╚═══════════════════════════════════════════════════════════════╝');
  lines.push('');

  // Stats
  lines.push('Stats:');
  lines.push(`   Files checked: ${result.stats.filesChecked}`);
  if (result.stats.performanceScore > 0) {
    lines.push(`   Performance score: ${result.stats.performanceScore}/100`);
    lines.push(`   LCP: ${result.stats.lcp}ms (budget: ≤${CONFIG.budget.maxLCP}ms)`);
    lines.push(`   INP: ${result.stats.inp}ms (budget: ≤${CONFIG.budget.maxINP}ms)`);
    lines.push(`   CLS: ${result.stats.cls} (budget: ≤${CONFIG.budget.maxCLS})`);
    lines.push(`   TBT: ${result.stats.tbt}ms (budget: ≤${CONFIG.budget.maxTBT}ms)`);
  }
  lines.push(
    `   Bundle size: ${Math.round(result.stats.bundleSizeGzipped / 1024)}KB gzipped (${Math.round(result.stats.bundleSize / 1024)}KB uncompressed, budget: ≤${Math.round(CONFIG.budget.maxBundleSize / 1024)}KB)`,
  );
  lines.push(`   Critical violations: ${result.stats.criticalViolations}`);
  lines.push(`   Warnings: ${result.stats.warningViolations}`);
  lines.push('');

  // Violations
  if (result.violations.length > 0) {
    lines.push('Violations:');
    lines.push('');

    // Group by severity
    const critical = result.violations.filter((v) => v.severity === 'critical');
    const warnings = result.violations.filter((v) => v.severity === 'warning');

    if (critical.length > 0) {
      lines.push('CRITICAL ISSUES:');
      lines.push('');
      critical.forEach((violation) => {
        lines.push(`   [${violation.category?.toUpperCase() || 'UNKNOWN'}] ${violation.message}`);
        lines.push(`   Suggestion: ${violation.suggestion}`);
        if (violation.learnMoreUrl) {
          lines.push(`   Learn more: ${violation.learnMoreUrl}`);
        }
        lines.push('');
      });
    }

    if (warnings.length > 0) {
      lines.push('WARNINGS:');
      lines.push('');
      warnings.forEach((violation) => {
        lines.push(`   [${violation.category?.toUpperCase() || 'UNKNOWN'}] ${violation.message}`);
        lines.push(`   Suggestion: ${violation.suggestion}`);
        if (violation.learnMoreUrl) {
          lines.push(`   Learn more: ${violation.learnMoreUrl}`);
        }
        lines.push('');
      });
    }

    lines.push('');
    lines.push('Performance optimization tips:');
    lines.push('   - Use code splitting and lazy loading for large components');
    lines.push('   - Optimize images and use modern formats (WebP, AVIF)');
    lines.push('   - Defer non-critical JavaScript and CSS');
    lines.push('   - Use CSS containment and will-change for animations');
    lines.push('   - Add @lighthouse-approved: TICKET-123 Reason for temporary exceptions');
    lines.push('');
  } else {
    lines.push('All performance budgets met.');
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Exports for Testing ──────────────────────────────────────────────────

export {
  validateFiles,
  runLighthouse,
  checkBundleSize,
  validatePerformanceBudget,
  validateBundleSize,
  hasApprovalComment,
  matchGlobPattern,
  getStagedFiles,
  getLibraryHash,
  getCachedLighthouseResult,
  saveLighthouseResultToCache,
  checkChromeAvailability,
  checkLighthouseAvailability,
  checkStorybookAvailability,
};

export type { Violation, ValidationResult, LighthouseMetrics, PerformanceBudget, HookDependencies };

// Export CONFIG for testing
export { CONFIG };

// ─── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  const jsonMode = process.argv.includes('--json');

  try {
    const stagedFiles = getStagedFiles();

    if (stagedFiles.length === 0) {
      if (!jsonMode) {
        console.log('No staged component files to check.');
      }
      process.exit(0);
    }

    const result = await validateFiles(stagedFiles);
    const duration = Date.now() - startTime;

    console.log(formatOutput(result, jsonMode));

    if (!jsonMode) {
      console.log(`Execution time: ${duration}ms (budget: <${CONFIG.performanceBudgetMs}ms)`);
      if (duration > CONFIG.performanceBudgetMs) {
        console.log(
          `WARNING: Exceeded performance budget by ${duration - CONFIG.performanceBudgetMs}ms`,
        );
      }
      console.log('');
    }

    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] ?? '');

if (isMainModule) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
