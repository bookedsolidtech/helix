/**
 * VRT (Visual Regression Testing) Analyzer.
 * Reads Playwright VRT test results and baseline screenshot status
 * for the health scorer's VRT and Cross-Browser dimensions.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export interface VrtResult {
  tagName: string;
  score: number;
  hasBaselines: boolean;
  baselineCount: number;
  regressionCount: number;
  browserResults: BrowserResult[];
  detail: string;
}

export interface BrowserResult {
  browser: string;
  passed: number;
  failed: number;
  total: number;
  passRate: number;
}

export interface CrossBrowserResult {
  tagName: string;
  score: number;
  browsers: BrowserResult[];
  allBrowsersPass: boolean;
  detail: string;
}

function getProjectRoot(): string {
  return resolve(process.cwd(), '../..');
}

function getComponentScreenshotsDir(tagName: string): string {
  return resolve(getProjectRoot(), `packages/hx-library/src/components/${tagName}/__screenshots__`);
}

function getTestResultsPath(): string {
  return resolve(getProjectRoot(), 'packages/hx-library/.cache/test-results.json');
}

export function analyzeVrt(tagName: string): VrtResult | null {
  const screenshotsDir = getComponentScreenshotsDir(tagName);

  // Check for baseline screenshots in component-specific directory
  let baselineCount = 0;
  if (existsSync(screenshotsDir)) {
    try {
      const files = readdirSync(screenshotsDir, { recursive: true }) as string[];
      baselineCount = files.filter((f) => typeof f === 'string' && f.endsWith('.png')).length;
    } catch {
      // Directory exists but can't read
    }
  }

  const hasBaselines = baselineCount > 0;

  // Try to read test results to see if component has visual tests
  const resultsPath = getTestResultsPath();
  if (!existsSync(resultsPath)) {
    // No test results yet — score based on baseline existence only
    return {
      tagName,
      score: hasBaselines ? 50 : 0,
      hasBaselines,
      baselineCount,
      regressionCount: 0,
      browserResults: [],
      detail: hasBaselines
        ? `${baselineCount} baseline screenshots (no test results yet)`
        : 'No VRT baselines or results',
    };
  }

  try {
    const raw = JSON.parse(readFileSync(resultsPath, 'utf-8')) as VitestTestResults;

    // Find component test file
    const componentTestFile = `${tagName}.test.ts`;
    const componentTests = raw.testResults.filter((t) => t.name.includes(componentTestFile));

    if (componentTests.length === 0) {
      return {
        tagName,
        score: hasBaselines ? 50 : 0,
        hasBaselines,
        baselineCount,
        regressionCount: 0,
        browserResults: [],
        detail: hasBaselines ? `${baselineCount} baselines but no test results` : 'No VRT data',
      };
    }

    // Count passed/failed assertions for this component
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const testFile of componentTests) {
      totalTests += testFile.assertionResults.length;
      passedTests += testFile.assertionResults.filter((a) => a.status === 'passed').length;
      failedTests += testFile.assertionResults.filter((a) => a.status === 'failed').length;
    }

    // For browser results, use Chromium (Vitest browser mode default)
    const browserResults: BrowserResult[] = hasBaselines
      ? [
          {
            browser: 'chromium',
            passed: passedTests,
            failed: failedTests,
            total: totalTests,
            passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
          },
        ]
      : [];

    // Score based on both baselines AND passing tests
    let score = 0;
    if (hasBaselines && totalTests > 0) {
      score = Math.round((passedTests / totalTests) * 100);
    } else if (hasBaselines) {
      score = 50; // Has screenshots but no test results
    }

    return {
      tagName,
      score,
      hasBaselines,
      baselineCount,
      regressionCount: failedTests,
      browserResults,
      detail: hasBaselines
        ? `${baselineCount} screenshots, ${passedTests}/${totalTests} tests pass`
        : 'No VRT data',
    };
  } catch {
    return null;
  }
}

export function analyzeCrossBrowser(tagName: string): CrossBrowserResult | null {
  const vrt = analyzeVrt(tagName);
  if (!vrt || vrt.browserResults.length === 0) {
    return {
      tagName,
      score: 0,
      browsers: [],
      allBrowsersPass: false,
      detail: 'No cross-browser test data',
    };
  }

  const allPass = vrt.browserResults.every((b) => b.passRate === 100);
  const avgPassRate =
    vrt.browserResults.reduce((sum, b) => sum + b.passRate, 0) / vrt.browserResults.length;

  return {
    tagName,
    score: Math.round(avgPassRate),
    browsers: vrt.browserResults,
    allBrowsersPass: allPass,
    detail: allPass
      ? `All ${vrt.browserResults.length} browsers pass`
      : `${vrt.browserResults.filter((b) => b.passRate === 100).length}/${vrt.browserResults.length} browsers fully passing`,
  };
}

// Internal types for Vitest JSON reporter results
interface VitestTestResults {
  numTotalTestSuites: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: Array<{
    name: string;
    status: string;
    assertionResults: Array<{
      ancestorTitles: string[];
      fullName: string;
      status: 'passed' | 'failed' | 'pending';
      title: string;
      duration: number;
      failureMessages: string[];
    }>;
  }>;
}
