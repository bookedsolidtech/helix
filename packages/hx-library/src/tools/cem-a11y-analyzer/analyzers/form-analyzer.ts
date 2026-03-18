import type { AnalyzerResult, AnalysisOptions, CemDeclaration, Recommendation } from '../types.js';

/**
 * Analyze form association support from CEM declaration.
 *
 * Checks for:
 * - static formAssociated = true
 * - ElementInternals (_internals)
 * - form property (returns associated form)
 * - validity/validationMessage properties
 * - formResetCallback, formDisabledCallback, formStateRestoreCallback
 */
export async function analyzeForm(
  declaration: CemDeclaration,
  _modulePath: string,
  _options: AnalysisOptions,
): Promise<AnalyzerResult> {
  const findings: string[] = [];
  const recommendations: Recommendation[] = [];
  const tagName = declaration.tagName ?? declaration.name;
  const members = declaration.members ?? [];

  let score = 0;
  const maxScore = 100;

  // Check for static formAssociated = true
  const hasFormAssociated = members.some(
    (m) => m.name === 'formAssociated' && m.static === true && m.default === 'true',
  );
  if (hasFormAssociated) {
    score += 25;
    findings.push('Component declares static formAssociated = true.');
  }

  // Check for ElementInternals
  const hasInternals = members.some((m) => m.name === '_internals' || m.name === 'internals');
  if (hasInternals) {
    score += 20;
    findings.push('Component uses ElementInternals.');
  }

  // Check for form property
  const hasForm = members.some(
    (m) => m.name === 'form' && (m.kind === 'field' || m.kind === 'method'),
  );
  if (hasForm) {
    score += 10;
    findings.push('Component exposes form property.');
  }

  // Check for validation properties
  const hasValidity = members.some((m) => m.name === 'validity');
  const hasValidationMessage = members.some((m) => m.name === 'validationMessage');
  if (hasValidity || hasValidationMessage) {
    score += 15;
    findings.push('Component exposes validation state.');
  }

  // Check form lifecycle callbacks
  const callbacks = [
    'formResetCallback',
    'formDisabledCallback',
    'formStateRestoreCallback',
  ] as const;
  const foundCallbacks = callbacks.filter((cb) => members.some((m) => m.name === cb));
  if (foundCallbacks.length > 0) {
    score += 10 * Math.min(foundCallbacks.length, 3);
    findings.push(`Implements form callbacks: ${foundCallbacks.join(', ')}.`);
  }

  // If component has no form features at all, that's fine for non-form components
  // Only recommend if it partially implements form association
  if (hasFormAssociated && !hasInternals) {
    recommendations.push({
      component: tagName,
      dimension: 'formAssociation',
      severity: 'major',
      message: 'Component declares formAssociated but no ElementInternals detected.',
      suggestion: 'Use attachInternals() and store as _internals for full form participation.',
    });
  }

  if (hasFormAssociated && foundCallbacks.length < 2) {
    recommendations.push({
      component: tagName,
      dimension: 'formAssociation',
      severity: 'minor',
      message: `Only ${foundCallbacks.length} of 3 form lifecycle callbacks implemented.`,
      suggestion:
        'Implement formResetCallback, formDisabledCallback, and formStateRestoreCallback for complete form integration.',
    });
  }

  return {
    dimension: 'formAssociation',
    score: Math.min(score, maxScore),
    maxScore,
    findings,
    recommendations,
  };
}
