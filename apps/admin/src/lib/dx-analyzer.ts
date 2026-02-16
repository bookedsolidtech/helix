/**
 * Developer Experience (DX) Analyzer.
 * Evaluates component developer experience:
 * - Intellisense support (JSDoc + TypeScript)
 * - Error messages helpfulness
 * - Debugging ease (source maps, logging)
 * - Fast rebuild time (<1s)
 * - Clear examples in documentation
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory, getComponentData } from './cem-parser';

export interface DxResult {
  tagName: string;
  score: number;
  subMetrics: DxSubMetric[];
}

export interface DxSubMetric {
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

/**
 * Check Intellisense support (JSDoc completeness + TypeScript types).
 */
function checkIntellisenseSupport(tagName: string, source: string): DxSubMetric {
  const data = getComponentData(tagName);
  if (!data) {
    return {
      name: 'Intellisense Support',
      score: 0,
      weight: 30,
      passed: false,
      detail: 'Component not found in CEM',
    };
  }

  // Count documented properties
  const totalProps = data.properties.length;
  const documentedProps = data.properties.filter(
    (p) => p.description && p.description.length > 10,
  ).length;

  // Check for JSDoc on class
  const hasClassJsDoc = /\/\*\*[\s\S]*?\*\/\s*export\s+class/.test(source);

  // Check for type annotations
  const hasTypes = /@property\([^)]*type:\s*\w+/.test(source);

  const propCoverage = totalProps > 0 ? (documentedProps / totalProps) * 100 : 100;
  const score = Math.round(propCoverage * 0.6 + (hasClassJsDoc ? 20 : 0) + (hasTypes ? 20 : 0));

  const passed = propCoverage >= 80 && hasClassJsDoc && hasTypes;
  const detail = `${documentedProps}/${totalProps} props documented, ${hasClassJsDoc ? '✓' : '✗'} class JSDoc, ${hasTypes ? '✓' : '✗'} types`;

  return {
    name: 'Intellisense Support',
    score,
    weight: 30,
    passed,
    detail,
  };
}

/**
 * Check error message quality (helpful error messages in code).
 */
function checkErrorMessages(source: string): DxSubMetric {
  // Find throw statements and console.error/warn
  const throwStatements = source.match(/throw\s+new\s+\w*Error\([^)]+\)/g) ?? [];
  const consoleErrors = source.match(/console\.(error|warn)\([^)]+\)/g) ?? [];

  const totalErrorHandling = throwStatements.length + consoleErrors.length;

  // Check for descriptive error messages (>20 chars)
  const descriptiveErrors = [...throwStatements, ...consoleErrors].filter((err) => {
    const messageMatch = err.match(/['"`]([^'"`]+)['"`]/);
    return messageMatch && messageMatch[1].length > 20;
  });

  const score =
    totalErrorHandling === 0
      ? 70
      : Math.min(100, (descriptiveErrors.length / totalErrorHandling) * 100);
  const passed = totalErrorHandling === 0 || descriptiveErrors.length >= totalErrorHandling * 0.8;
  const detail =
    totalErrorHandling === 0
      ? 'No error handling (may need improvement)'
      : `${descriptiveErrors.length}/${totalErrorHandling} errors have helpful messages`;

  return {
    name: 'Error Messages',
    score: Math.round(score),
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Check debugging support (console.log patterns, source maps).
 */
function checkDebuggingEase(tagName: string, source: string): DxSubMetric {
  // Check for debug logging patterns
  const debugLogs = source.match(/console\.(log|debug|info)\(/g) ?? [];

  // Check for source map generation (look for declaration file)
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const hasDeclarationMap = existsSync(resolve(libRoot, `dist/${dir}/${tagName}.d.ts.map`));

  // Good debugging: some logs (not too many), source maps available
  const logScore =
    debugLogs.length > 0 && debugLogs.length < 10 ? 50 : debugLogs.length >= 10 ? 20 : 30;
  const sourceMapScore = hasDeclarationMap ? 50 : 0;

  const score = logScore + sourceMapScore;
  const passed = score >= 70;
  const detail = `${debugLogs.length} debug logs, ${hasDeclarationMap ? '✓' : '✗'} source maps`;

  return {
    name: 'Debugging Ease',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Check rebuild time (file size proxy: smaller files = faster rebuilds).
 */
function checkRebuildTime(tagName: string): DxSubMetric {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const sourcePath = resolve(libRoot, `src/components/${dir}/${tagName}.ts`);

  try {
    const stats = statSync(sourcePath);
    const sizeKb = stats.size / 1024;

    // Score based on file size: <10KB = fast, >50KB = slow
    const score = sizeKb < 10 ? 100 : sizeKb < 30 ? 80 : sizeKb < 50 ? 60 : 40;
    const passed = sizeKb < 30;
    const detail = `${sizeKb.toFixed(1)} KB source file (${passed ? 'fast' : 'slow'} rebuild)`;

    return {
      name: 'Fast Rebuild',
      score,
      weight: 10,
      passed,
      detail,
    };
  } catch {
    return {
      name: 'Fast Rebuild',
      score: 0,
      weight: 10,
      passed: false,
      detail: 'Source file not found',
    };
  }
}

/**
 * Check for clear examples in documentation.
 */
function checkExamplesInDocs(tagName: string, source: string): DxSubMetric {
  // Check for @example JSDoc tags
  const exampleTags = source.match(/@example/g) ?? [];

  // Check if docs page exists
  const docsRoot = resolve(process.cwd(), '../docs');
  const docsPath = resolve(docsRoot, `src/content/docs/component-library/${tagName}.mdx`);
  const hasDocsPage = existsSync(docsPath);

  let docsExamples = 0;
  if (hasDocsPage) {
    try {
      const docsContent = readFileSync(docsPath, 'utf-8');
      docsExamples = (docsContent.match(/```/g) ?? []).length / 2; // Code blocks
    } catch {
      // Ignore
    }
  }

  const totalExamples = exampleTags.length + docsExamples;
  const score = Math.min(100, totalExamples * 25);
  const passed = totalExamples >= 3;
  const detail = hasDocsPage
    ? `${exampleTags.length} JSDoc @example, ${docsExamples} docs examples`
    : 'No docs page';

  return {
    name: 'Clear Examples',
    score,
    weight: 30,
    passed,
    detail,
  };
}

/**
 * Analyze component developer experience.
 */
export function analyzeDx(tagName: string): DxResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const subMetrics: DxSubMetric[] = [
    checkIntellisenseSupport(tagName, source),
    checkErrorMessages(source),
    checkDebuggingEase(tagName, source),
    checkRebuildTime(tagName),
    checkExamplesInDocs(tagName, source),
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
