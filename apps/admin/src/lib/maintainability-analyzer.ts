/**
 * Maintainability Analyzer.
 * Assesses component maintainability:
 * - File size (<500 lines)
 * - Test-to-code ratio (>1.5x)
 * - No circular dependencies
 * - Clear separation of concerns
 * - API stability (refactoring resistance)
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface MaintainabilityResult {
  tagName: string;
  score: number;
  subMetrics: MaintainabilitySubMetric[];
}

export interface MaintainabilitySubMetric {
  name: string;
  score: number;
  weight: number;
  passed: boolean;
  detail: string;
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), '../../packages/hx-library');
}

function readSource(tagName: string): string | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const sourcePath = resolve(libRoot, `src/components/${dir}/${tagName}.ts`);
  try {
    return readFileSync(sourcePath, 'utf-8');
  } catch {
    return null;
  }
}

function readTestFile(tagName: string): string | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const testPath = resolve(libRoot, `src/components/${dir}/${tagName}.test.ts`);
  try {
    return readFileSync(testPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Check component file size (<500 lines is maintainable).
 */
function checkFileSize(source: string): MaintainabilitySubMetric {
  const lines = source.split('\n').length;
  const threshold = 500;

  const score = lines <= threshold ? 100 : Math.max(0, 100 - (lines - threshold) / 10);
  const passed = lines <= threshold;
  const detail = passed
    ? `${lines} lines (under ${threshold})`
    : `${lines} lines (exceeds ${threshold} threshold)`;

  return {
    name: 'File Size',
    score: Math.round(score),
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Calculate test-to-code ratio (tests should be >1.5x component code).
 */
function checkTestToCodeRatio(source: string, tagName: string): MaintainabilitySubMetric {
  const testSource = readTestFile(tagName);

  if (!testSource) {
    return {
      name: 'Test-to-Code Ratio',
      score: 0,
      weight: 25,
      passed: false,
      detail: 'No test file found',
    };
  }

  const codeLines = source.split('\n').filter((l) => l.trim().length > 0).length;
  const testLines = testSource.split('\n').filter((l) => l.trim().length > 0).length;
  const ratio = testLines / codeLines;

  const score = Math.min(100, (ratio / 1.5) * 100);
  const passed = ratio >= 1.5;
  const detail = `${testLines} test lines / ${codeLines} code lines = ${ratio.toFixed(2)}x ratio`;

  return {
    name: 'Test-to-Code Ratio',
    score: Math.round(score),
    weight: 25,
    passed,
    detail,
  };
}

/**
 * Check for circular dependencies (import cycles).
 */
function checkNoCircularDeps(source: string, tagName: string): MaintainabilitySubMetric {
  const imports = source.match(/import\s+[^;]+from\s+['"]\.\.?\/[^'"]+['"]/g) ?? [];
  const relativeImports = imports.filter((imp) => /from\s+['"]\.\.?\//.test(imp));

  // Rough heuristic: check if any imports reference the same directory
  const dir = getComponentDirectory(tagName);
  const selfReferences = relativeImports.filter((imp) => imp.includes(dir));

  const score = selfReferences.length === 0 ? 100 : Math.max(0, 100 - selfReferences.length * 30);
  const passed = selfReferences.length === 0;
  const detail = passed
    ? `${relativeImports.length} imports, no circular refs`
    : `${selfReferences.length} potential circular dependencies`;

  return {
    name: 'No Circular Dependencies',
    score,
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Assess separation of concerns (logic, styles, templates).
 */
function checkSeparationOfConcerns(tagName: string, source: string): MaintainabilitySubMetric {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);

  // Check for separate files
  const hasStylesFile = existsSync(resolve(libRoot, `src/components/${dir}/${tagName}.styles.ts`));
  const hasTestFile = existsSync(resolve(libRoot, `src/components/${dir}/${tagName}.test.ts`));

  // Check if template is inline or separate method
  const hasRenderMethod = /render\s*\(\)\s*(?::\s*[^{]+)?\s*\{/.test(source);
  const hasInlineTemplate = /html`/.test(source);

  let score = 0;
  if (hasStylesFile) score += 35;
  if (hasTestFile) score += 35;
  if (hasRenderMethod || hasInlineTemplate) score += 30;

  const passed = hasStylesFile && hasTestFile;
  const detail = `Styles: ${hasStylesFile ? '✓' : '✗'}, Tests: ${hasTestFile ? '✓' : '✗'}, Template: ${hasRenderMethod || hasInlineTemplate ? '✓' : '✗'}`;

  return {
    name: 'Separation of Concerns',
    score,
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Assess API stability (fewer breaking changes = more maintainable).
 * Heuristic: check for @deprecated tags and version comments.
 */
function checkApiStability(source: string): MaintainabilitySubMetric {
  const deprecatedTags = source.match(/@deprecated/g) ?? [];
  const versionComments = source.match(/@since\s+v?\d+\.\d+/g) ?? [];
  const breakingComments = source.match(/BREAKING CHANGE|breaking:/gi) ?? [];

  // More deprecations = less stable API
  // Version tracking = more stable API
  const stabilityScore =
    100 - deprecatedTags.length * 10 - breakingComments.length * 20 + versionComments.length * 5;

  const score = Math.max(0, Math.min(100, stabilityScore));
  const passed = deprecatedTags.length === 0 && breakingComments.length === 0;
  const detail = passed
    ? 'Stable API (no deprecations or breaking changes)'
    : `${deprecatedTags.length} deprecations, ${breakingComments.length} breaking changes`;

  return {
    name: 'API Stability',
    score: Math.round(score),
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Analyze component maintainability.
 */
export function analyzeMaintainability(tagName: string): MaintainabilityResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const subMetrics: MaintainabilitySubMetric[] = [
    checkFileSize(source),
    checkTestToCodeRatio(source, tagName),
    checkNoCircularDeps(source, tagName),
    checkSeparationOfConcerns(tagName, source),
    checkApiStability(source),
  ];

  // Calculate weighted score
  const totalWeight = subMetrics.reduce((sum, m) => sum + m.weight, 0);
  const weightedScore = subMetrics.reduce((sum, m) => {
    const normalized = m.weight / totalWeight;
    return sum + m.score * normalized;
  }, 0);

  return {
    tagName,
    score: Math.round(weightedScore),
    subMetrics,
  };
}
