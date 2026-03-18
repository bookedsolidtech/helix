import type {
  AnalyzerResult,
  AnalysisOptions,
  CemDeclaration,
  CemMember,
  Recommendation,
} from '../types.js';

const ARIA_PROPERTY_PATTERN = /^aria[A-Z]/;
const ARIA_ATTR_PATTERN = /^aria-/;

/**
 * Analyze ARIA support from CEM declaration.
 *
 * Checks for:
 * - role property/attribute
 * - aria-* properties (ariaLabel, ariaDescribedBy, etc.)
 * - ARIA attribute bindings
 * - ARIA documentation in member descriptions
 */
export async function analyzeAria(
  declaration: CemDeclaration,
  _modulePath: string,
  _options: AnalysisOptions,
): Promise<AnalyzerResult> {
  const findings: string[] = [];
  const recommendations: Recommendation[] = [];
  const tagName = declaration.tagName ?? declaration.name;
  const members = declaration.members ?? [];
  const attributes = declaration.attributes ?? [];

  let score = 0;
  const maxScore = 100;

  // Check for role property or getter
  const hasRole = members.some((m) => m.name === 'role' || m.name === '_role');
  if (hasRole) {
    score += 30;
    findings.push('Component defines an ARIA role.');
  } else {
    recommendations.push({
      component: tagName,
      dimension: 'ariaSupport',
      severity: 'minor',
      message: 'No explicit ARIA role detected in CEM.',
      suggestion:
        'Consider adding a role property or using ElementInternals.role if this component has semantic meaning.',
    });
  }

  // Check for aria-* properties (camelCase in JS: ariaLabel, ariaDescribedBy, etc.)
  const ariaProperties = members.filter(
    (m) =>
      ARIA_PROPERTY_PATTERN.test(m.name) ||
      (m.name.startsWith('hxAria') && m.privacy !== 'private'),
  );
  if (ariaProperties.length > 0) {
    score += 25;
    findings.push(
      `Found ${ariaProperties.length} ARIA propert${ariaProperties.length === 1 ? 'y' : 'ies'}: ${ariaProperties.map((p) => p.name).join(', ')}.`,
    );
  }

  // Check for aria-* attributes
  const ariaAttributes = attributes.filter((a) => ARIA_ATTR_PATTERN.test(a.name));
  if (ariaAttributes.length > 0) {
    score += 15;
    findings.push(
      `Found ${ariaAttributes.length} ARIA attribute${ariaAttributes.length === 1 ? '' : 's'}: ${ariaAttributes.map((a) => a.name).join(', ')}.`,
    );
  }

  // Check descriptions for ARIA documentation
  const ariaDocumented = membersWithAriaDocumentation(members);
  if (ariaDocumented.length > 0) {
    score += 15;
    findings.push(
      `${ariaDocumented.length} member${ariaDocumented.length === 1 ? '' : 's'} document ARIA semantics in descriptions.`,
    );
  } else if (ariaProperties.length === 0 && !hasRole) {
    recommendations.push({
      component: tagName,
      dimension: 'ariaSupport',
      severity: 'major',
      message: 'No ARIA properties or role documentation found.',
      suggestion: 'Add JSDoc annotations describing ARIA semantics for this component.',
    });
  }

  // Check for aria-live or live region indicators in descriptions
  const hasLiveRegion = members.some(
    (m) =>
      m.description !== undefined &&
      /aria-live|live\s*region|assertive|polite/i.test(m.description),
  );
  if (hasLiveRegion) {
    score += 15;
    findings.push('Component documents live region behavior.');
  }

  return {
    dimension: 'ariaSupport',
    score: Math.min(score, maxScore),
    maxScore,
    findings,
    recommendations,
  };
}

function membersWithAriaDocumentation(members: CemMember[]): CemMember[] {
  return members.filter(
    (m) =>
      m.description !== undefined &&
      /aria[- ]|role=|role\b|accessible|screen\s*reader|assistive/i.test(m.description),
  );
}
