/**
 * Code Quality Analyzer.
 * Analyzes component source for code quality metrics:
 * - Cyclomatic complexity
 * - Code duplication (DRY violations)
 * - Magic numbers
 * - Naming conventions
 * - Dead code (unused imports/functions)
 * - Comment quality
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface CodeQualityResult {
  tagName: string;
  score: number;
  subMetrics: CodeQualitySubMetric[];
  issues: CodeQualityIssue[];
}

export interface CodeQualitySubMetric {
  name: string;
  score: number;
  weight: number;
  passed: boolean;
  detail: string;
}

export interface CodeQualityIssue {
  type: 'complexity' | 'duplication' | 'magic-number' | 'naming' | 'dead-code' | 'comment';
  severity: 'error' | 'warning' | 'info';
  line?: number;
  message: string;
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
 * Calculate cyclomatic complexity for a method.
 * Counts decision points: if, else, for, while, case, catch, &&, ||, ?
 */
function calculateComplexity(methodBody: string): number {
  let complexity = 1; // Base complexity

  // Decision points
  const patterns = [
    /\bif\s*\(/g,
    /\belse\s+if\b/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /&&/g,
    /\|\|/g,
    /\?/g,
  ];

  for (const pattern of patterns) {
    const matches = methodBody.match(pattern);
    complexity += matches ? matches.length : 0;
  }

  return complexity;
}

/**
 * Extract methods from class and calculate complexity for each.
 */
function analyzeCyclomaticComplexity(source: string): CodeQualitySubMetric {
  // Match all methods (public, private, lifecycle)
  const methodRegex =
    /(?:^|\n)\s*(?:private\s+|protected\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g;
  const methods: Array<{ name: string; body: string; complexity: number }> = [];

  let match;
  while ((match = methodRegex.exec(source)) !== null) {
    const methodName = match[1];
    const startPos = match.index + match[0].length;

    // Find matching closing brace (simple heuristic)
    let depth = 1;
    let endPos = startPos;
    for (let i = startPos; i < source.length && depth > 0; i++) {
      if (source[i] === '{') depth++;
      if (source[i] === '}') depth--;
      endPos = i;
    }

    const methodBody = source.slice(startPos, endPos);
    const complexity = calculateComplexity(methodBody);

    methods.push({ name: methodName, body: methodBody, complexity });
  }

  // Calculate score: 100 if all methods <10, deduct 10 per violation
  const highComplexityMethods = methods.filter((m) => m.complexity >= 10);
  const score = Math.max(0, 100 - highComplexityMethods.length * 10);

  const passed = highComplexityMethods.length === 0;
  const detail = passed
    ? `All ${methods.length} methods have complexity <10`
    : `${highComplexityMethods.length}/${methods.length} methods exceed complexity 10 (max: ${Math.max(...methods.map((m) => m.complexity))})`;

  return {
    name: 'Cyclomatic Complexity',
    score,
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Detect code duplication via simple pattern matching.
 * Looks for repeated code blocks (3+ lines identical).
 */
function analyzeDuplication(source: string): CodeQualitySubMetric {
  const lines = source.split('\n').map((l) => l.trim());
  const blocks = new Map<string, number>();

  // Check 3-line blocks
  for (let i = 0; i < lines.length - 2; i++) {
    if (
      lines[i].length < 5 ||
      lines[i].startsWith('//') ||
      lines[i].startsWith('*') ||
      lines[i] === ''
    )
      continue;

    const block = `${lines[i]}\n${lines[i + 1]}\n${lines[i + 2]}`;
    blocks.set(block, (blocks.get(block) ?? 0) + 1);
  }

  const duplicates = Array.from(blocks.entries()).filter(([, count]) => count > 1);
  const score = Math.max(0, 100 - duplicates.length * 15);
  const passed = duplicates.length === 0;
  const detail = passed
    ? 'No code duplication detected'
    : `${duplicates.length} duplicate code blocks found`;

  return {
    name: 'No Code Duplication',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Detect magic numbers (numeric literals outside of common values).
 */
function analyzeMagicNumbers(source: string): CodeQualitySubMetric {
  // Remove comments and strings
  const codeOnly = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/"[^"]*"|'[^']*'|`[^`]*`/g, '');

  // Find numeric literals (excluding common values: 0, 1, -1, 2, 10, 100, 1000)
  const numericLiterals = codeOnly.match(/\b\d+\.?\d*\b/g) ?? [];
  const commonValues = new Set(['0', '1', '2', '10', '100', '1000']);
  const magicNumbers = numericLiterals.filter((n) => !commonValues.has(n));

  const score = Math.max(0, 100 - magicNumbers.length * 5);
  const passed = magicNumbers.length === 0;
  const detail = passed
    ? 'No magic numbers detected'
    : `${magicNumbers.length} magic numbers found`;

  return {
    name: 'No Magic Numbers',
    score,
    weight: 10,
    passed,
    detail,
  };
}

/**
 * Check naming conventions (kebab-case for CSS, camelCase for JS).
 */
function analyzeNamingConventions(source: string): CodeQualitySubMetric {
  const issues: string[] = [];

  // Check property names (should be camelCase)
  const properties = source.match(/@property\([^)]*\)\s*(\w+)/g) ?? [];
  for (const prop of properties) {
    const name = prop.split(/\s+/).pop();
    if (name && /[A-Z_-]/.test(name)) {
      issues.push(`Property ${name} not camelCase`);
    }
  }

  // Check CSS custom properties (should be --kebab-case)
  const cssProps = source.match(/--[\w-]+/g) ?? [];
  for (const prop of cssProps) {
    if (/[A-Z_]/.test(prop.slice(2))) {
      issues.push(`CSS property ${prop} not kebab-case`);
    }
  }

  const score = Math.max(0, 100 - issues.length * 10);
  const passed = issues.length === 0;
  const detail = passed ? 'All names follow conventions' : `${issues.length} naming violations`;

  return {
    name: 'Naming Conventions',
    score,
    weight: 10,
    passed,
    detail,
  };
}

/**
 * Detect dead code (unused imports).
 */
function analyzeDeadCode(source: string): CodeQualitySubMetric {
  const imports = source.match(/import\s+(?:\{[^}]+\}|[\w]+)\s+from\s+['"][^'"]+['"]/g) ?? [];
  const unusedImports: string[] = [];

  for (const importLine of imports) {
    const match = importLine.match(/import\s+(?:\{([^}]+)\}|([\w]+))/);
    if (!match) continue;

    const names = match[1]
      ? match[1].split(',').map((n) =>
          n
            .trim()
            .split(/\s+as\s+/)
            .pop()
            ?.trim(),
        )
      : [match[2]];

    for (const name of names) {
      if (!name) continue;
      // Check if used (rough heuristic: appears in source after import)
      const usageRegex = new RegExp(`\\b${name}\\b`);
      const usageCount = (source.slice(importLine.length).match(usageRegex) || []).length;
      if (usageCount === 0) {
        unusedImports.push(name);
      }
    }
  }

  const score = Math.max(0, 100 - unusedImports.length * 10);
  const passed = unusedImports.length === 0;
  const detail = passed ? 'No unused imports' : `${unusedImports.length} unused imports`;

  return {
    name: 'No Dead Code',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Assess comment quality (meaningful vs redundant).
 */
function analyzeCommentQuality(source: string): CodeQualitySubMetric {
  const comments = source.match(/\/\/.+|\/\*[\s\S]*?\*\//g) ?? [];
  const redundantPatterns = [/\s*\*\s*$/, /\/\/\s*TODO\b/, /\/\/\s*FIXME\b/, /\/\/\s*@ts-/];

  const redundantComments = comments.filter((c) => redundantPatterns.some((p) => p.test(c)));
  const meaningfulComments = comments.length - redundantComments.length;

  const score = Math.min(100, meaningfulComments * 10);
  const passed = meaningfulComments >= 5 && redundantComments.length === 0;
  const detail = `${meaningfulComments} meaningful comments, ${redundantComments.length} redundant`;

  return {
    name: 'Comment Quality',
    score,
    weight: 10,
    passed,
    detail,
  };
}

/**
 * Analyze component source for code quality metrics.
 */
export function analyzeCodeQuality(tagName: string): CodeQualityResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const subMetrics: CodeQualitySubMetric[] = [
    analyzeCyclomaticComplexity(source),
    analyzeDuplication(source),
    analyzeMagicNumbers(source),
    analyzeNamingConventions(source),
    analyzeDeadCode(source),
    analyzeCommentQuality(source),
  ];

  // Calculate weighted score
  const totalWeight = subMetrics.reduce((sum, m) => sum + m.weight, 0);
  const weightedScore = subMetrics.reduce((sum, m) => {
    const normalized = m.weight / totalWeight;
    return sum + m.score * normalized;
  }, 0);

  const issues: CodeQualityIssue[] = subMetrics
    .filter((m) => !m.passed)
    .map((m) => ({
      type: 'complexity' as const, // Default type
      severity: m.score < 50 ? ('error' as const) : ('warning' as const),
      message: `${m.name}: ${m.detail}`,
    }));

  return {
    tagName,
    score: Math.round(weightedScore),
    subMetrics,
    issues,
  };
}
