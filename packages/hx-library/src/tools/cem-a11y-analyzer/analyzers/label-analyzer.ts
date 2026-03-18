import type { AnalyzerResult, AnalysisOptions, CemDeclaration, Recommendation } from '../types.js';

/**
 * Analyze label support from CEM declaration.
 *
 * Checks for:
 * - label property
 * - ariaLabel / aria-label property
 * - ariaLabelledBy / aria-labelledby references
 * - Label slot definition
 * - Label-related documentation warnings
 */
export async function analyzeLabel(
  declaration: CemDeclaration,
  _modulePath: string,
  _options: AnalysisOptions,
): Promise<AnalyzerResult> {
  const findings: string[] = [];
  const recommendations: Recommendation[] = [];
  const tagName = declaration.tagName ?? declaration.name;
  const members = declaration.members ?? [];
  const slots = declaration.slots ?? [];
  const attributes = declaration.attributes ?? [];

  let score = 0;
  const maxScore = 100;

  // Check for label property
  const hasLabelProp = members.some(
    (m) => m.name === 'label' && m.privacy !== 'private' && m.kind === 'field',
  );
  if (hasLabelProp) {
    score += 30;
    findings.push('Component has a label property.');
  }

  // Check for ariaLabel / hxAriaLabel property
  const hasAriaLabel = members.some(
    (m) => m.name === 'ariaLabel' || m.name === 'hxAriaLabel' || m.attribute === 'aria-label',
  );
  if (hasAriaLabel) {
    score += 25;
    findings.push('Component supports aria-label.');
  }

  // Check for aria-labelledby
  const hasAriaLabelledBy = members.some(
    (m) =>
      m.name === 'ariaLabelledBy' ||
      m.name === 'ariaLabelledby' ||
      m.attribute === 'aria-labelledby',
  );
  const hasAriaLabelledByAttr = attributes.some((a) => a.name === 'aria-labelledby');
  if (hasAriaLabelledBy || hasAriaLabelledByAttr) {
    score += 15;
    findings.push('Component supports aria-labelledby.');
  }

  // Check for label slot
  const hasLabelSlot = slots.some((s) => s.name === 'label' || /label/i.test(s.description ?? ''));
  if (hasLabelSlot) {
    score += 15;
    findings.push('Component provides a label slot.');
  }

  // Check descriptions for label requirement documentation
  const labelDocumented = members.filter(
    (m) =>
      m.description !== undefined &&
      /\blabel\b|labelled|labelledby|accessible\s*name/i.test(m.description),
  );
  if (labelDocumented.length > 0) {
    score += 15;
    findings.push(
      `${labelDocumented.length} member${labelDocumented.length === 1 ? '' : 's'} document labeling requirements.`,
    );
  }

  // Recommendations
  if (!hasLabelProp && !hasAriaLabel) {
    recommendations.push({
      component: tagName,
      dimension: 'labelSupport',
      severity: 'major',
      message: 'No label or aria-label property detected.',
      suggestion:
        'Add a label property or aria-label support so screen readers can identify this component.',
    });
  }

  if (hasLabelProp && !hasAriaLabel) {
    recommendations.push({
      component: tagName,
      dimension: 'labelSupport',
      severity: 'info',
      message: 'Component has label but no separate aria-label property.',
      suggestion: 'Consider adding aria-label for cases where a visible label is not appropriate.',
    });
  }

  return {
    dimension: 'labelSupport',
    score: Math.min(score, maxScore),
    maxScore,
    findings,
    recommendations,
  };
}
