import type { AnalyzerResult, AnalysisOptions, CemDeclaration, Recommendation } from '../types.js';

const MOTION_SOURCE_PATTERNS = [
  /prefers-reduced-motion/,
  /matchMedia.*prefers-reduced-motion/,
  /reduced-motion/,
];

const ANIMATION_INDICATORS = [
  /animat/i,
  /transition/i,
  /transform/i,
  /opacity.*transition/i,
  /keyframe/i,
  /motion/i,
];

/**
 * Analyze motion safety from CEM declaration and optional source.
 *
 * Checks for:
 * - prefers-reduced-motion media query in source/styles
 * - Animation-related CSS custom properties
 * - Documentation of motion behavior
 * - matchMedia usage for motion preferences
 */
export async function analyzeMotion(
  declaration: CemDeclaration,
  modulePath: string,
  options: AnalysisOptions,
): Promise<AnalyzerResult> {
  const findings: string[] = [];
  const recommendations: Recommendation[] = [];
  const tagName = declaration.tagName ?? declaration.name;
  const members = declaration.members ?? [];
  const cssProperties = declaration.cssProperties ?? [];

  let score = 0;
  const maxScore = 100;

  // Check CSS custom properties for animation/transition/duration indicators
  const animationCssProps = cssProperties.filter((p) =>
    ANIMATION_INDICATORS.some(
      (pattern) => pattern.test(p.name) || pattern.test(p.description ?? ''),
    ),
  );

  const hasAnimations = animationCssProps.length > 0;

  // Check member descriptions for motion documentation
  const motionDocumented = members.filter(
    (m) =>
      m.description !== undefined && /motion|animat|transition|reduced-motion/i.test(m.description),
  );

  if (motionDocumented.length > 0) {
    score += 20;
    findings.push(
      `${motionDocumented.length} member${motionDocumented.length === 1 ? '' : 's'} document motion behavior.`,
    );
  }

  // Check CSS properties for duration tokens (indicating animation)
  const durationProps = cssProperties.filter(
    (p) => /duration/i.test(p.name) || /duration/i.test(p.description ?? ''),
  );
  if (durationProps.length > 0) {
    findings.push(
      `Component uses ${durationProps.length} animation duration token${durationProps.length === 1 ? '' : 's'}.`,
    );
  }

  // Optional: source code analysis for prefers-reduced-motion
  if (options.readFile !== undefined) {
    const sourceResult = await analyzeMotionSource(modulePath, options, findings);
    score += sourceResult.score;

    if (hasAnimations && !sourceResult.hasReducedMotion) {
      recommendations.push({
        component: tagName,
        dimension: 'motionSafety',
        severity: 'major',
        message: 'Component has animations but no prefers-reduced-motion check detected in source.',
        suggestion:
          'Add @media (prefers-reduced-motion: reduce) to disable or simplify animations for users who prefer reduced motion.',
      });
    }
  }

  // If no animations detected, component is inherently motion-safe
  if (!hasAnimations && durationProps.length === 0) {
    score += 80;
    findings.push('No animation indicators detected — component is inherently motion-safe.');
  } else if (hasAnimations) {
    // Partial credit for having animation tokens (configurable)
    score += 20;
    findings.push(
      `Component has ${animationCssProps.length} animation-related CSS propert${animationCssProps.length === 1 ? 'y' : 'ies'}.`,
    );
  }

  return {
    dimension: 'motionSafety',
    score: Math.min(score, maxScore),
    maxScore,
    findings,
    recommendations,
  };
}

async function analyzeMotionSource(
  modulePath: string,
  options: AnalysisOptions,
  findings: string[],
): Promise<{ score: number; hasReducedMotion: boolean }> {
  if (options.readFile === undefined) {
    return { score: 0, hasReducedMotion: false };
  }

  try {
    const content = await options.readFile(modulePath);
    if (content === null) return { score: 0, hasReducedMotion: false };

    let hasReducedMotion = false;

    for (const pattern of MOTION_SOURCE_PATTERNS) {
      if (pattern.test(content)) {
        hasReducedMotion = true;
        break;
      }
    }

    if (hasReducedMotion) {
      findings.push('Source code respects prefers-reduced-motion preference.');
      return { score: 40, hasReducedMotion: true };
    }

    // Also check the styles file (common pattern: component.styles.ts)
    const stylesPath = modulePath.replace(/\.ts$/, '.styles.ts');
    if (stylesPath !== modulePath) {
      const stylesContent = await options.readFile(stylesPath);
      if (stylesContent !== null) {
        for (const pattern of MOTION_SOURCE_PATTERNS) {
          if (pattern.test(stylesContent)) {
            hasReducedMotion = true;
            break;
          }
        }

        if (hasReducedMotion) {
          findings.push('Styles file respects prefers-reduced-motion preference.');
          return { score: 40, hasReducedMotion: true };
        }
      }
    }

    return { score: 0, hasReducedMotion: false };
  } catch {
    return { score: 0, hasReducedMotion: false };
  }
}
