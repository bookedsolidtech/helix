/**
 * Typed wrapper around `scripts/aaa-standards.json` for the AAA story
 * conformance surface.
 *
 * The file is the canonical source of truth for the WCAG 2.2 Level AAA +
 * peer-standard criteria HELiX certifies against. Same artefact the
 * automated audit harness (`scripts/aaa-formal-audit.mjs`) drives off; we
 * import it raw and freeze it so the docs surface and the audit harness
 * cannot drift on plain-language summary, threshold, or spec URL.
 *
 * Memoized lookup: criteria are static at build time, ~11 entries; we
 * walk once and stash a Record<id, Criterion>.
 */
import standards from '../../../../scripts/aaa-standards.json';

export interface AAAStandardCriterion {
  id: string;
  slug: string;
  name: string;
  level: string;
  wcagVersion?: string;
  type: 'wcag-sc' | 'peer';
  url: string;
  understandingUrl?: string;
  summary: string;
  componentApplicability?: string;
  evidence?: string;
}

interface RawCriterion {
  id: string;
  slug: string;
  name: string;
  level: string;
  wcagVersion?: string;
  type: string;
  url: string;
  understandingUrl?: string;
  summary: string;
  componentApplicability?: string;
  evidence?: string;
}

interface RawStandards {
  criteria?: RawCriterion[];
}

const raw = standards as unknown as RawStandards;

const byId: Record<string, AAAStandardCriterion> = Object.freeze(
  (raw.criteria ?? []).reduce<Record<string, AAAStandardCriterion>>((acc, c) => {
    acc[c.id] = {
      id: c.id,
      slug: c.slug,
      name: c.name,
      level: c.level,
      wcagVersion: c.wcagVersion,
      type: c.type === 'peer' ? 'peer' : 'wcag-sc',
      url: c.url,
      understandingUrl: c.understandingUrl,
      summary: c.summary,
      componentApplicability: c.componentApplicability,
      evidence: c.evidence,
    };
    return acc;
  }, {}),
);

/**
 * Resolve a criterion by id (e.g. "1.4.6", "forced-colors", "apg-keyboard").
 * Returns null when the id is unknown — happens when a component declares
 * a criterion not present in the standards file (audit drift signal).
 */
export function getStandardCriterion(id: string): AAAStandardCriterion | null {
  return byId[id] ?? null;
}

export function listStandardCriteria(): readonly AAAStandardCriterion[] {
  return Object.values(byId);
}
