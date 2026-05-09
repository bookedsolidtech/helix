/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AAAConformanceCard — per-criterion conformance evidence rendered inline
 * on a component's docs page.
 *
 * Pulls live from `@helixui/library/custom-elements.json` (the component's
 * `helixMeta.aaa.criteria` list) and joins each id against
 * `scripts/aaa-standards.json` (plain-language summary, threshold, spec
 * URL). One row per standards criterion; verdict = Supports when listed
 * on the cert payload, Not Applicable when standards-applicability rules
 * out the component (currently only 3.3.6 + form-associated heuristic).
 *
 * This is a docs-surface companion to the `A11yStatusCard` already mounted
 * on every autodocs page — the status card shows the headline cert badge
 * + criterion chips; this card expands each chip into a row with the
 * "why it passes" prose.
 */
import * as React from 'react';
import customElements from '@helixui/library/custom-elements.json';
import { getStandardCriterion, listStandardCriteria } from './aaa-standards-data';

interface CemDeclaration {
  tagName?: string;
  aaaCertified?: boolean | null;
  aaaCertifiedDate?: string;
  helixMeta?: {
    formAssociated?: boolean;
    priorityTier?: string;
    aaa?: {
      certified?: boolean;
      certifiedDate?: string;
      criteria?: readonly string[];
      auditUrl?: string;
    };
  };
}

const REPO_BLOB_BASE = 'https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/';

const declCache = new Map<string, CemDeclaration | null>();
function findDeclaration(tag: string): CemDeclaration | null {
  if (declCache.has(tag)) return declCache.get(tag) ?? null;
  const cem = customElements as { modules?: Array<{ declarations?: CemDeclaration[] }> };
  for (const mod of cem.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (decl?.tagName === tag) {
        declCache.set(tag, decl);
        return decl;
      }
    }
  }
  declCache.set(tag, null);
  return null;
}

type Verdict = 'Supports' | 'Not Applicable' | 'Unknown';

interface Row {
  id: string;
  name: string;
  level: string;
  type: 'wcag-sc' | 'peer';
  verdict: Verdict;
  summary: string;
  url: string;
  understandingUrl?: string;
  applicability?: string;
  notApplicableReason?: string;
}

/**
 * Heuristic Not-Applicable resolver. Mirrors the standards file's
 * `componentApplicability` strings but enforced as code so the docs
 * verdict matches the formal-audit harness output without re-running it.
 *
 * Currently only 3.3.6 (Error Prevention All) is N/A on a per-component
 * basis — the audit harness writes "Not Applicable" when the component
 * is not form-associated. Every other criterion applies universally.
 */
function resolveNotApplicable(
  criterionId: string,
  decl: CemDeclaration,
): { reason: string } | null {
  if (criterionId === '3.3.6') {
    if (decl.helixMeta?.formAssociated !== true) {
      return {
        reason: 'Component is not form-associated; error prevention applies to form submission.',
      };
    }
  }
  return null;
}

export interface AAAConformanceCardProps {
  /** Component tag (e.g. "hx-button"). */
  tag: string;
  /** Heading override. Defaults to "AAA Conformance — per-criterion evidence". */
  heading?: string;
}

export function AAAConformanceCard({
  tag,
  heading = 'AAA Conformance — per-criterion evidence',
}: AAAConformanceCardProps): React.ReactElement | null {
  const decl = findDeclaration(tag);
  if (!decl) return null;

  const certified = decl.aaaCertified === true || decl.helixMeta?.aaa?.certified === true;
  const claimedCriteria = new Set(decl.helixMeta?.aaa?.criteria ?? []);
  const auditUrl = decl.helixMeta?.aaa?.auditUrl
    ? `${REPO_BLOB_BASE}${decl.helixMeta.aaa.auditUrl}`
    : null;
  const certDate = decl.aaaCertifiedDate ?? decl.helixMeta?.aaa?.certifiedDate ?? null;

  const allCriteria = listStandardCriteria();
  const rows: Row[] = allCriteria.map((sc) => {
    const naResult = resolveNotApplicable(sc.id, decl);
    let verdict: Verdict = 'Unknown';
    if (naResult) verdict = 'Not Applicable';
    else if (claimedCriteria.has(sc.id)) verdict = 'Supports';
    return {
      id: sc.id,
      name: sc.name,
      level: sc.level,
      type: sc.type,
      verdict,
      summary: sc.summary,
      url: sc.url,
      understandingUrl: sc.understandingUrl,
      applicability: sc.componentApplicability,
      notApplicableReason: naResult?.reason,
    };
  });

  const supportsCount = rows.filter((r) => r.verdict === 'Supports').length;
  const naCount = rows.filter((r) => r.verdict === 'Not Applicable').length;
  const unknownCount = rows.filter((r) => r.verdict === 'Unknown').length;

  return (
    <section
      className="hx-docs hx-aaa-conformance"
      aria-label={`AAA conformance evidence for ${tag}`}
    >
      <header className="hx-aaa-conformance-header">
        <div>
          <h3 className="hx-aaa-conformance-title">{heading}</h3>
          <p className="hx-aaa-conformance-subtitle">
            {certified ? (
              <>
                <strong>Certified WCAG 2.2 Level AAA</strong>
                {certDate ? (
                  <>
                    {' '}
                    on <time dateTime={certDate}>{certDate}</time>
                  </>
                ) : null}
                . {supportsCount} Supports · {naCount} Not Applicable
                {unknownCount > 0 ? ` · ${unknownCount} Unknown` : null} across {rows.length}{' '}
                criteria.
              </>
            ) : (
              <>
                Not yet certified. Verdicts shown below reflect the standards file only and have not
                been measured by the audit harness for this component.
              </>
            )}
          </p>
        </div>
        {auditUrl ? (
          <a
            className="hx-aaa-conformance-audit-link"
            href={auditUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View full AAA-AUDIT.md →
          </a>
        ) : null}
      </header>

      <ol className="hx-aaa-conformance-rows" aria-label="Per-criterion verdicts">
        {rows.map((row) => (
          <li
            key={row.id}
            className="hx-aaa-conformance-row"
            data-verdict={row.verdict.toLowerCase().replace(/\s+/g, '-')}
            data-criterion-type={row.type}
          >
            <div className="hx-aaa-conformance-row-head">
              <span className="hx-aaa-conformance-row-id">
                <code>{row.id}</code>
              </span>
              <span className="hx-aaa-conformance-row-name">{row.name}</span>
              <span className="hx-aaa-conformance-row-level" aria-label={`Level ${row.level}`}>
                {row.level}
              </span>
              <span
                className="hx-aaa-conformance-row-verdict"
                data-verdict={row.verdict.toLowerCase().replace(/\s+/g, '-')}
              >
                {row.verdict === 'Supports' ? '✓ Supports' : null}
                {row.verdict === 'Not Applicable' ? '— Not Applicable' : null}
                {row.verdict === 'Unknown' ? '? Unknown' : null}
              </span>
            </div>
            <p className="hx-aaa-conformance-row-summary">{row.summary}</p>
            {row.verdict === 'Not Applicable' && row.notApplicableReason ? (
              <p className="hx-aaa-conformance-row-na">
                <strong>Why N/A:</strong> {row.notApplicableReason}
              </p>
            ) : null}
            <div className="hx-aaa-conformance-row-links">
              <a href={row.url} target="_blank" rel="noopener noreferrer">
                Spec ↗
              </a>
              {row.understandingUrl ? (
                <a href={row.understandingUrl} target="_blank" rel="noopener noreferrer">
                  Understanding ↗
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
