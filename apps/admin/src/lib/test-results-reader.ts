/**
 * Reads and parses Vitest JSON reporter output from .cache/test-results.json
 * Provides component-level test summaries for the health scorer and UI.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TestResult {
  name: string;
  fullName: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  component: string;
  suite: string;
  error?: string;
}

export interface ComponentTestSummary {
  component: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  totalDuration: number;
  tests: TestResult[];
}

export interface AllTestResults {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  passRate: number;
  totalDuration: number;
  components: ComponentTestSummary[];
  tests: TestResult[];
}

function getTestResultsPath(): string {
  return resolve(process.cwd(), "../../packages/wc-library/.cache/test-results.json");
}

function extractComponentName(filePath: string): string {
  // Extract from filename like "wc-button.test.ts" → "wc-button"
  const fileMatch = filePath.match(/(wc-[\w-]+)\.test\.ts$/);
  if (fileMatch) return fileMatch[1];
  // Fallback: extract from directory
  const dirMatch = filePath.match(/components\/(wc-[^/]+)\//);
  return dirMatch?.[1] ?? "unknown";
}

function _extractSuiteName(fullName: string): string {
  // fullName format: "suite > subsuite > test name"
  const parts = fullName.split(" > ");
  return parts.length > 1 ? parts[1] : parts[0];
}

interface VitestJsonResult {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  startTime: number;
  testResults: Array<{
    name: string;
    assertionResults: Array<{
      ancestorTitles: string[];
      title: string;
      fullName: string;
      status: "passed" | "failed" | "pending";
      duration: number | null;
      failureMessages: string[];
    }>;
  }>;
}

function parseVitestJson(raw: VitestJsonResult): AllTestResults {
  const tests: TestResult[] = [];

  for (const file of raw.testResults) {
    const component = extractComponentName(file.name);

    for (const assertion of file.assertionResults) {
      const status: TestResult["status"] =
        assertion.status === "passed" ? "pass" :
        assertion.status === "failed" ? "fail" : "skip";

      tests.push({
        name: assertion.title,
        fullName: assertion.fullName,
        status,
        duration: assertion.duration ?? 0,
        component,
        suite: assertion.ancestorTitles[1] ?? assertion.ancestorTitles[0] ?? "default",
        error: assertion.failureMessages.length > 0
          ? assertion.failureMessages.join("\n")
          : undefined,
      });
    }
  }

  // Build per-component summaries
  const componentMap = new Map<string, TestResult[]>();
  for (const test of tests) {
    const existing = componentMap.get(test.component) ?? [];
    existing.push(test);
    componentMap.set(test.component, existing);
  }

  const components: ComponentTestSummary[] = Array.from(componentMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(
    ([component, componentTests]) => {
      const passed = componentTests.filter((t) => t.status === "pass").length;
      const failed = componentTests.filter((t) => t.status === "fail").length;
      const skipped = componentTests.filter((t) => t.status === "skip").length;
      const total = componentTests.length;
      const totalDuration = componentTests.reduce((sum, t) => sum + t.duration, 0);

      return {
        component,
        total,
        passed,
        failed,
        skipped,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        totalDuration,
        tests: componentTests,
      };
    }
  );

  const totalPassed = tests.filter((t) => t.status === "pass").length;
  const totalFailed = tests.filter((t) => t.status === "fail").length;
  const totalSkipped = tests.filter((t) => t.status === "skip").length;
  const totalTests = tests.length;
  const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

  return {
    timestamp: new Date(raw.startTime).toISOString(),
    totalTests,
    totalPassed,
    totalFailed,
    totalSkipped,
    passRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
    totalDuration,
    components,
    tests,
  };
}

export function hasTestResults(): boolean {
  return existsSync(getTestResultsPath());
}

export function getAllTestResults(): AllTestResults | null {
  const filePath = getTestResultsPath();
  if (!existsSync(filePath)) return null;

  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8")) as VitestJsonResult;
    return parseVitestJson(raw);
  } catch {
    return null;
  }
}

export function getTestResultsForComponent(tagName: string): ComponentTestSummary | null {
  const results = getAllTestResults();
  if (!results) return null;

  return results.components.find((c) => c.component === tagName) ?? null;
}

// ── V8 Coverage Support ──────────────────────────────────────────────

export interface ComponentCoverage {
  component: string;
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
}

interface CoverageSummaryFile {
  lines: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
}

interface CoverageSummaryJson {
  total: CoverageSummaryFile;
  [filePath: string]: CoverageSummaryFile;
}

function getCoverageSummaryPath(): string {
  return resolve(process.cwd(), "../../packages/wc-library/.cache/coverage/coverage-summary.json");
}

export function getCoverageForComponent(tagName: string): ComponentCoverage | null {
  const coveragePath = getCoverageSummaryPath();
  if (!existsSync(coveragePath)) return null;

  try {
    const raw = JSON.parse(readFileSync(coveragePath, "utf-8")) as CoverageSummaryJson;

    // Find entries matching this component's source file
    const componentFiles = Object.entries(raw).filter(
      ([path]) => path !== "total" && path.includes(`/${tagName}`)
        && !path.includes(".test.") && !path.includes(".stories.") && !path.includes(".styles.")
    );

    if (componentFiles.length === 0) return null;

    // Aggregate coverage across all matching files
    let totalLines = 0, coveredLines = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalStatements = 0, coveredStatements = 0;

    for (const [, data] of componentFiles) {
      totalLines += data.lines.total;
      coveredLines += data.lines.covered;
      totalBranches += data.branches.total;
      coveredBranches += data.branches.covered;
      totalFunctions += data.functions.total;
      coveredFunctions += data.functions.covered;
      totalStatements += data.statements.total;
      coveredStatements += data.statements.covered;
    }

    return {
      component: tagName,
      lineCoverage: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
      branchCoverage: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
      functionCoverage: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
      statementCoverage: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
    };
  } catch {
    return null;
  }
}
