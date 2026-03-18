import type { AnalyzerResult, AnalysisOptions, CemDeclaration, Recommendation } from '../types.js';

const FOCUS_SOURCE_PATTERNS = [
  /focus\s*\(/,
  /\.focus\(\)/,
  /activeElement/,
  /focusTrap|focus-trap/i,
  /delegatesFocus/,
  /tabIndex/,
  /focus-visible/,
];

/**
 * Analyze focus management from CEM declaration and optional source.
 *
 * Checks for:
 * - tabindex property
 * - Focus-related CSS parts (focus-ring, focus-visible)
 * - Focus-related CSS custom properties (--*-focus-*)
 * - delegatesFocus in shadow root options
 * - Focus trap patterns in source (optional)
 */
export async function analyzeFocus(
  declaration: CemDeclaration,
  modulePath: string,
  options: AnalysisOptions,
): Promise<AnalyzerResult> {
  const findings: string[] = [];
  const recommendations: Recommendation[] = [];
  const tagName = declaration.tagName ?? declaration.name;
  const members = declaration.members ?? [];
  const cssParts = declaration.cssParts ?? [];
  const cssProperties = declaration.cssProperties ?? [];

  let score = 0;
  const maxScore = 100;

  // Check for tabindex property
  const hasTabindex = members.some(
    (m) => m.name === 'tabindex' || m.name === 'tabIndex' || m.attribute === 'tabindex',
  );
  if (hasTabindex) {
    score += 25;
    findings.push('Component exposes tabindex property.');
  }

  // Check for focus-related CSS parts
  const focusParts = cssParts.filter(
    (p) => /focus/i.test(p.name) || /focus/i.test(p.description ?? ''),
  );
  if (focusParts.length > 0) {
    score += 20;
    findings.push(
      `Found ${focusParts.length} focus-related CSS part${focusParts.length === 1 ? '' : 's'}: ${focusParts.map((p) => p.name).join(', ')}.`,
    );
  }

  // Check for focus-related CSS custom properties
  const focusCssProps = cssProperties.filter(
    (p) => /focus/i.test(p.name) || /focus/i.test(p.description ?? ''),
  );
  if (focusCssProps.length > 0) {
    score += 20;
    findings.push(
      `Found ${focusCssProps.length} focus-related CSS custom propert${focusCssProps.length === 1 ? 'y' : 'ies'}.`,
    );
  }

  // Check member descriptions for focus management documentation
  const focusDocumented = members.filter(
    (m) => m.description !== undefined && /focus|blur|tabindex|tab\s*order/i.test(m.description),
  );
  if (focusDocumented.length > 0) {
    score += 15;
    findings.push(
      `${focusDocumented.length} member${focusDocumented.length === 1 ? '' : 's'} document focus behavior.`,
    );
  }

  // Optional: source code analysis
  if (options.readFile !== undefined) {
    const sourceScore = await analyzeFocusSource(modulePath, options, findings);
    score += sourceScore;
  }

  if (score === 0) {
    recommendations.push({
      component: tagName,
      dimension: 'focusManagement',
      severity: 'minor',
      message: 'No focus management patterns detected.',
      suggestion:
        'Consider adding tabindex, focus delegation, or focus-visible CSS parts to support keyboard users.',
    });
  }

  return {
    dimension: 'focusManagement',
    score: Math.min(score, maxScore),
    maxScore,
    findings,
    recommendations,
  };
}

async function analyzeFocusSource(
  modulePath: string,
  options: AnalysisOptions,
  findings: string[],
): Promise<number> {
  if (options.readFile === undefined) return 0;

  try {
    const content = await options.readFile(modulePath);
    if (content === null) return 0;

    let sourceScore = 0;
    const detected: string[] = [];

    for (const pattern of FOCUS_SOURCE_PATTERNS) {
      if (pattern.test(content)) {
        detected.push(pattern.source);
      }
    }

    if (detected.length > 0) {
      sourceScore = Math.min(detected.length * 5, 20);
      findings.push(
        `Source code contains ${detected.length} focus management pattern${detected.length === 1 ? '' : 's'}.`,
      );
    }

    return sourceScore;
  } catch {
    return 0;
  }
}
