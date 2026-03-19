import type { AnalyzerResult, AnalysisOptions, CemDeclaration, Recommendation } from '../types.js';

const KEYBOARD_PATTERNS = [
  /keydown/i,
  /keyup/i,
  /keypress/i,
  /keyboard/i,
  /arrow\s*key/i,
  /enter\s*key/i,
  /escape/i,
  /tab\s*key/i,
  /roving/i,
  /hotkey/i,
];

const SOURCE_KEYBOARD_PATTERNS = [
  /addEventListener\s*\(\s*['"]key(down|up|press)['"]/,
  /\.onkey(down|up)/,
  /roving.*tabindex/i,
  /e\.key\s*===?\s*['"](Arrow|Enter|Escape|Tab|Space|Home|End)/,
  /event\.key\s*===?\s*['"](Arrow|Enter|Escape|Tab|Space|Home|End)/,
  /case\s+['"](Arrow|Enter|Escape|Tab|Space|Home|End)/,
];

/**
 * Analyze keyboard accessibility from CEM declaration and optional source.
 *
 * Checks for:
 * - Keyboard event handler references in CEM descriptions
 * - Methods named with keyboard patterns (handleKeydown, _onKeyDown)
 * - Source code keyboard event listeners (optional)
 * - Roving tabindex patterns
 */
export async function analyzeKeyboard(
  declaration: CemDeclaration,
  modulePath: string,
  options: AnalysisOptions,
): Promise<AnalyzerResult> {
  const findings: string[] = [];
  const recommendations: Recommendation[] = [];
  const tagName = declaration.tagName ?? declaration.name;
  const members = declaration.members ?? [];

  let score = 0;
  const maxScore = 100;

  // Check member names for keyboard handler patterns
  const keyboardMethods = members.filter(
    (m) =>
      m.kind === 'method' &&
      /key(down|up|press|board)|_onKey|handleKey|_handleKey|roving|Roving/i.test(m.name),
  );
  if (keyboardMethods.length > 0) {
    score += 30;
    findings.push(
      `Found ${keyboardMethods.length} keyboard handler method${keyboardMethods.length === 1 ? '' : 's'}: ${keyboardMethods.map((m) => m.name).join(', ')}.`,
    );
  }

  // Check descriptions for keyboard interaction documentation
  const keyboardDocumented = members.filter(
    (m) =>
      m.description !== undefined && KEYBOARD_PATTERNS.some((p) => p.test(m.description as string)),
  );
  if (keyboardDocumented.length > 0) {
    score += 20;
    findings.push(
      `${keyboardDocumented.length} member${keyboardDocumented.length === 1 ? '' : 's'} document keyboard interactions.`,
    );
  }

  // Check for roving tabindex pattern
  const hasRovingTabindex = members.some(
    (m) =>
      /roving/i.test(m.name) ||
      (m.description !== undefined && /roving.*tabindex/i.test(m.description)),
  );
  if (hasRovingTabindex) {
    score += 20;
    findings.push('Component implements roving tabindex pattern.');
  }

  // Optional: source code analysis for keyboard handlers
  if (options.readFile !== undefined) {
    const sourceScore = await analyzeKeyboardSource(modulePath, options, findings);
    score += sourceScore;
  }

  // Check component description for keyboard docs
  if (
    declaration.description !== undefined &&
    KEYBOARD_PATTERNS.some((p) => p.test(declaration.description as string))
  ) {
    score += 10;
    findings.push('Component description documents keyboard behavior.');
  }

  if (score === 0) {
    recommendations.push({
      component: tagName,
      dimension: 'keyboardAccess',
      severity: 'major',
      message: 'No keyboard interaction patterns detected.',
      suggestion:
        'Add keyboard event handlers for Enter, Space, and arrow key navigation as appropriate for the component role.',
    });
  }

  return {
    dimension: 'keyboardAccess',
    score: Math.min(score, maxScore),
    maxScore,
    findings,
    recommendations,
  };
}

async function analyzeKeyboardSource(
  modulePath: string,
  options: AnalysisOptions,
  findings: string[],
): Promise<number> {
  if (options.readFile === undefined) return 0;

  try {
    const content = await options.readFile(modulePath);
    if (content === null) return 0;

    let sourceScore = 0;
    const matchedPatterns: string[] = [];

    for (const pattern of SOURCE_KEYBOARD_PATTERNS) {
      if (pattern.test(content)) {
        matchedPatterns.push(pattern.source);
      }
    }

    if (matchedPatterns.length > 0) {
      sourceScore = Math.min(matchedPatterns.length * 10, 30);
      findings.push(
        `Source code contains ${matchedPatterns.length} keyboard handling pattern${matchedPatterns.length === 1 ? '' : 's'}.`,
      );
    }

    return sourceScore;
  } catch {
    return 0;
  }
}
