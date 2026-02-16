/**
 * Lit Best Practices Analyzer.
 * Validates adherence to Lit framework best practices:
 * - super() calls in lifecycle methods
 * - @state vs @property usage
 * - Reactive property updates
 * - No DOM manipulation in render()
 * - CSS in separate .styles.ts file
 * - Slots documented with @slot
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface LitBestPracticesResult {
  tagName: string;
  score: number;
  subMetrics: LitSubMetric[];
}

export interface LitSubMetric {
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

function hasStylesFile(tagName: string): boolean {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const stylesPath = resolve(libRoot, `src/components/${dir}/${tagName}.styles.ts`);
  return existsSync(stylesPath);
}

/**
 * Check if lifecycle methods properly call super().
 */
function checkSuperCalls(source: string): LitSubMetric {
  const lifecycleMethods = [
    'connectedCallback',
    'disconnectedCallback',
    'firstUpdated',
    'updated',
    'willUpdate',
  ];

  const violations: string[] = [];

  for (const method of lifecycleMethods) {
    const methodRegex = new RegExp(
      `${method}\\s*\\([^)]*\\)\\s*(?::\\s*[^{]+)?\\s*\\{([^}]+)`,
      'g',
    );
    const match = methodRegex.exec(source);

    if (match) {
      const methodBody = match[1];
      if (!methodBody.includes('super.')) {
        violations.push(method);
      }
    }
  }

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 20);
  const passed = violations.length === 0;
  const detail = passed
    ? 'All lifecycle methods call super()'
    : `${violations.length} lifecycle methods missing super() calls: ${violations.join(', ')}`;

  return {
    name: 'super() in Lifecycle',
    score,
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Validate @state vs @property usage.
 * @state should be used for internal state only (not public API).
 */
function checkStatePropertyUsage(source: string): LitSubMetric {
  const stateProps = source.match(/@state\(\)\s*(\w+)/g) ?? [];
  const publicProps = source.match(/@property\([^)]*\)\s*(\w+)/g) ?? [];

  // Check if any @state properties are documented in JSDoc (they shouldn't be public)
  const stateNames = stateProps.map((s) => s.match(/@state\(\)\s*(\w+)/)?.[1]).filter(Boolean);
  const publicNames = publicProps
    .map((p) => p.match(/@property\([^)]*\)\s*(\w+)/)?.[1])
    .filter(Boolean);

  const violations = stateNames.filter((name) => {
    // @state should not be in public API (no @attr JSDoc)
    return source.includes(`@attr ${name}`);
  });

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 15);
  const passed = violations.length === 0;
  const detail = passed
    ? `${stateNames.length} @state, ${publicNames.length} @property - correct usage`
    : `${violations.length} @state properties incorrectly public`;

  return {
    name: '@state vs @property',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Ensure reactive properties trigger updates (not direct assignments).
 */
function checkReactiveUpdates(source: string): LitSubMetric {
  // Look for direct assignments to properties within methods (anti-pattern)
  const propertyNames = source.match(/@property\([^)]*\)\s*(\w+)/g) ?? [];
  const names = propertyNames
    .map((p) => p.match(/@property\([^)]*\)\s*(\w+)/)?.[1])
    .filter((name): name is string => Boolean(name));

  const violations: string[] = [];

  for (const name of names) {
    // Check for direct mutation (rough heuristic)
    const mutationRegex = new RegExp(`this\\.${name}\\s*=`, 'g');
    const mutations = source.match(mutationRegex) ?? [];

    // Exclude property declarations
    const inDeclaration = source.match(new RegExp(`@property\\([^)]*\\)\\s*${name}\\s*[=:]`));
    if (mutations.length > (inDeclaration ? 1 : 0)) {
      violations.push(name);
    }
  }

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10);
  const passed = violations.length === 0;
  const detail = passed
    ? 'All property updates are reactive'
    : `${violations.length} properties may have non-reactive updates`;

  return {
    name: 'Reactive Updates',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Ensure render() method doesn't manipulate DOM directly.
 */
function checkNoDomManipulationInRender(source: string): LitSubMetric {
  // Find render() method
  const renderRegex = /render\s*\(\)\s*(?::\s*[^{]+)?\s*\{/g;
  const renderMatch = renderRegex.exec(source);

  if (!renderMatch) {
    return {
      name: 'No DOM Manipulation in render()',
      score: 100,
      weight: 20,
      passed: true,
      detail: 'No render() method found (likely uses template)',
    };
  }

  const renderStart = renderMatch.index + renderMatch[0].length;
  let depth = 1;
  let renderEnd = renderStart;
  for (let i = renderStart; i < source.length && depth > 0; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    renderEnd = i;
  }

  const renderBody = source.slice(renderStart, renderEnd);

  // Check for DOM manipulation patterns
  const domPatterns = [
    /\.appendChild\(/,
    /\.removeChild\(/,
    /\.insertBefore\(/,
    /\.replaceChild\(/,
    /\.innerHTML\s*=/,
    /document\.createElement\(/,
    /document\.querySelector\(/,
  ];

  const violations = domPatterns.filter((pattern) => pattern.test(renderBody));

  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 25);
  const passed = violations.length === 0;
  const detail = passed
    ? 'render() uses declarative templates only'
    : `${violations.length} DOM manipulation patterns in render()`;

  return {
    name: 'No DOM Manipulation in render()',
    score,
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Check if CSS is in separate .styles.ts file.
 */
function checkSeparateStylesFile(tagName: string, source: string): LitSubMetric {
  const hasFile = hasStylesFile(tagName);

  // Check if CSS is defined inline in component
  const hasInlineStyles =
    /static\s+styles\s*=\s*css`/.test(source) || /styles:\s*css`/.test(source);

  const score = hasFile && !hasInlineStyles ? 100 : hasFile ? 75 : 0;
  const passed = hasFile && !hasInlineStyles;
  const detail = hasFile
    ? hasInlineStyles
      ? 'Styles file exists but also has inline styles'
      : 'Styles in separate .styles.ts file'
    : 'No separate .styles.ts file';

  return {
    name: 'Separate Styles File',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Check if slots are documented with @slot JSDoc tags.
 */
function checkSlotDocumentation(source: string): LitSubMetric {
  // Count slots in template
  const slotMatches = source.match(/<slot[^>]*>/g) ?? [];
  const namedSlots = slotMatches.filter((s) => /name=/.test(s));
  const totalSlots = slotMatches.length;

  // Count @slot JSDoc tags
  const slotDocs = source.match(/@slot\s+[\w-]+/g) ?? [];

  const score = totalSlots === 0 ? 100 : Math.round((slotDocs.length / totalSlots) * 100);
  const passed = totalSlots === 0 || slotDocs.length >= totalSlots;
  const detail =
    totalSlots === 0
      ? 'No slots to document'
      : `${slotDocs.length}/${totalSlots} slots documented (${namedSlots.length} named)`;

  return {
    name: 'Slot Documentation',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Analyze component for Lit best practices.
 */
export function analyzeLitBestPractices(tagName: string): LitBestPracticesResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const subMetrics: LitSubMetric[] = [
    checkSuperCalls(source),
    checkStatePropertyUsage(source),
    checkReactiveUpdates(source),
    checkNoDomManipulationInRender(source),
    checkSeparateStylesFile(tagName, source),
    checkSlotDocumentation(source),
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
