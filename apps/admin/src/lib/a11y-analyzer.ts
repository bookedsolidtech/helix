/**
 * Accessibility Analyzer.
 * Blends axe-core runtime results (70%) with static analysis (30%).
 * When no axe results exist, falls back to static-only with heuristic confidence.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface A11yResult {
  tagName: string;
  score: number;
  checks: A11yCheck[];
  totalChecks: number;
  passedChecks: number;
  hasAxeResults: boolean;
  axePassRate?: number;
  axeViolationCount?: number;
  axePassCount?: number;
}

export interface A11yCheck {
  name: string;
  passed: boolean;
  detail: string;
  weight: number;
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), '../../packages/hx-library');
}

function readComponentFiles(tagName: string): { source: string; styles: string } | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const sourcePath = resolve(libRoot, `src/components/${dir}/${tagName}.ts`);
  const stylesPath = resolve(libRoot, `src/components/${dir}/${tagName}.styles.ts`);
  try {
    const source = readFileSync(sourcePath, 'utf-8');
    let styles = '';
    try {
      styles = readFileSync(stylesPath, 'utf-8');
    } catch {
      /* no styles file */
    }
    return { source, styles };
  } catch {
    return null;
  }
}

export function analyzeAccessibility(tagName: string): A11yResult | null {
  const files = readComponentFiles(tagName);
  if (!files) return null;

  const { source, styles } = files;
  const combined = source + '\n' + styles;
  const checks: A11yCheck[] = [];

  // 1. Keyboard interaction support
  const hasKeydown = source.includes('@keydown') || source.includes('keydown');
  const hasKeyup = source.includes('@keyup') || source.includes('keyup');
  const hasKeyboard = hasKeydown || hasKeyup;
  checks.push({
    name: 'Keyboard support',
    passed: hasKeyboard,
    detail: hasKeyboard
      ? `Has ${[hasKeydown && 'keydown', hasKeyup && 'keyup'].filter(Boolean).join(', ')} handler(s)`
      : 'No keyboard event handlers',
    weight: 2,
  });

  // 2. ARIA attributes in template
  const ariaAttrs = source.match(/aria-\w+/g) || [];
  const uniqueAria = [...new Set(ariaAttrs)];
  checks.push({
    name: 'ARIA attributes',
    passed: uniqueAria.length > 0,
    detail: uniqueAria.length > 0 ? `Uses: ${uniqueAria.join(', ')}` : 'No ARIA attributes found',
    weight: 2,
  });

  // 3. Role attribute usage (where appropriate)
  const hasRole = source.includes('role=');
  const isInteractive = source.includes('@click') || source.includes('addEventListener');
  const roleNeeded = isInteractive;
  const rolePassed = !roleNeeded || hasRole;
  checks.push({
    name: 'Semantic roles',
    passed: rolePassed,
    detail: hasRole
      ? 'Role attribute(s) present'
      : roleNeeded
        ? 'Interactive element missing role'
        : 'Non-interactive, role not required',
    weight: 1,
  });

  // 4. Focus management
  const hasFocusVisible = combined.includes('focus-visible') || combined.includes(':focus-visible');
  const hasFocusWithin = combined.includes('focus-within') || combined.includes(':focus-within');
  const hasTabindex = source.includes('tabindex');
  const hasFocusMethod = source.includes('focus(');
  const focusScore = hasFocusVisible || hasFocusWithin || hasTabindex || hasFocusMethod;
  checks.push({
    name: 'Focus management',
    passed: focusScore,
    detail:
      [
        hasFocusVisible && 'focus-visible',
        hasFocusWithin && 'focus-within',
        hasTabindex && 'tabindex',
        hasFocusMethod && 'focus()',
      ]
        .filter(Boolean)
        .join(', ') || 'No focus management',
    weight: 2,
  });

  // 5. Disabled state handling
  const hasDisabledProp = source.includes('disabled');
  const hasAriaDisabled = source.includes('aria-disabled');
  const hasPointerEvents = combined.includes('pointer-events');
  const disabledHandled = !hasDisabledProp || hasAriaDisabled || hasPointerEvents;
  checks.push({
    name: 'Disabled state',
    passed: disabledHandled,
    detail: hasDisabledProp
      ? [hasAriaDisabled && 'aria-disabled', hasPointerEvents && 'pointer-events:none']
          .filter(Boolean)
          .join(', ') || 'Has disabled prop but incomplete handling'
      : 'No disabled state (N/A)',
    weight: 1,
  });

  // 6. Screen reader support (aria-live, role="alert", aria-label)
  const hasLiveRegion = source.includes('aria-live') || source.includes('role="alert"');
  const hasAriaLabel = source.includes('aria-label');
  const hasAriaDescribedby = source.includes('aria-describedby');
  const srSupport = hasLiveRegion || hasAriaLabel || hasAriaDescribedby;
  checks.push({
    name: 'Screen reader support',
    passed: srSupport,
    detail:
      [
        hasLiveRegion && 'live regions',
        hasAriaLabel && 'aria-label',
        hasAriaDescribedby && 'aria-describedby',
      ]
        .filter(Boolean)
        .join(', ') || 'No screen reader patterns',
    weight: 2,
  });

  // 7. Color contrast via design tokens (not hardcoded)
  const hardcodedColors = combined.match(/(?:color|background):\s*#[0-9a-f]{3,8}/gi) || [];
  const usesTokenColors =
    combined.includes('--hx-color-') ||
    combined.includes('var(--hx-') ||
    combined.includes('--wc-color-') ||
    combined.includes('var(--wc-');
  checks.push({
    name: 'Token-based colors',
    passed: usesTokenColors && hardcodedColors.length === 0,
    detail: usesTokenColors
      ? hardcodedColors.length === 0
        ? 'All colors via design tokens'
        : `${hardcodedColors.length} hardcoded color(s)`
      : 'Not using design token colors',
    weight: 1,
  });

  // 8. Form association (if applicable)
  const hasFormAssociated = source.includes('formAssociated');
  const hasInternals = source.includes('attachInternals');
  const isFormElement =
    source.includes('input') ||
    source.includes('select') ||
    source.includes('textarea') ||
    (source.includes('type=') && (source.includes('submit') || source.includes('reset')));
  const formPassed = !isFormElement || (hasFormAssociated && hasInternals);
  checks.push({
    name: 'Form association',
    passed: formPassed,
    detail: hasFormAssociated
      ? 'ElementInternals form association'
      : isFormElement
        ? 'Form element missing formAssociated'
        : 'Not a form element (N/A)',
    weight: 1,
  });

  // Static analysis scoring
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const passedWeight = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const staticScore = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 100;

  // Try to read axe-core test results
  const axeResults = readAxeTestResults(tagName);

  let score: number;
  let hasAxeResults = false;
  let axePassRate: number | undefined;
  let axeViolationCount: number | undefined;
  let axePassCount: number | undefined;

  if (axeResults) {
    hasAxeResults = true;
    axePassRate = axeResults.passRate;
    axeViolationCount = axeResults.violations;
    axePassCount = axeResults.passes;
    // 70% runtime (axe pass rate) + 30% static (current checks)
    score = Math.round(axeResults.passRate * 0.7 + staticScore * 0.3);
  } else {
    // Static only — heuristic confidence
    score = staticScore;
  }

  return {
    tagName,
    score,
    checks,
    totalChecks: checks.length,
    passedChecks: checks.filter((c) => c.passed).length,
    hasAxeResults,
    axePassRate,
    axeViolationCount,
    axePassCount,
  };
}

function readAxeTestResults(
  tagName: string,
): { passRate: number; violations: number; passes: number } | null {
  const libRoot = getLibraryRoot();
  const resultsPath = resolve(libRoot, '.cache/test-results.json');

  if (!existsSync(resultsPath)) return null;

  try {
    const raw = JSON.parse(readFileSync(resultsPath, 'utf-8')) as {
      testResults: Array<{
        name: string;
        assertionResults: Array<{
          ancestorTitles: string[];
          status: string;
          title: string;
        }>;
      }>;
    };

    // Find axe-core test results for this component
    const axeTests: Array<{ status: string }> = [];

    for (const file of raw.testResults) {
      if (!file.name.includes(`/${tagName}.test.`)) continue;

      for (const assertion of file.assertionResults) {
        const isAxeTest = assertion.ancestorTitles.some(
          (t) => t.includes('axe-core') || t.includes('Accessibility (axe'),
        );
        if (isAxeTest) {
          axeTests.push({ status: assertion.status });
        }
      }
    }

    if (axeTests.length === 0) return null;

    const passes = axeTests.filter((t) => t.status === 'passed').length;
    const violations = axeTests.filter((t) => t.status === 'failed').length;
    const total = axeTests.length;
    const passRate = total > 0 ? Math.round((passes / total) * 100) : 0;

    return { passRate, violations, passes };
  } catch {
    return null;
  }
}
