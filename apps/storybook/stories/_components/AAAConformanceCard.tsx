/**
 * AAAConformanceCard — per-criterion conformance evidence rendered inline
 * on a component's docs page.
 *
 * SOURCE OF TRUTH: `@helixui/library/aaa-verdicts.json` — the slim snapshot
 * generated from the formal audit harness (`scripts/aaa-formal-audit.mjs`
 * → `scripts/generate-aaa-verdicts.mjs`). One row per standards criterion;
 * the verdict + evidence comes directly from that snapshot so the docs
 * surface cannot disagree with the formal audit output, the matrix.md, or
 * the per-component AAA-AUDIT.md.
 *
 * Earlier revisions of this card resolved Not-Applicable verdicts from a
 * hand-maintained heuristic against `helixMeta.formAssociated`. That
 * approach produced verdicts that disagreed with the formal harness as
 * soon as a component's form-association classification changed in the
 * audit (e.g. hx-button moved from N/A 3.3.6 to Partially Supports once
 * the audit learned to detect non-Element-Internals form participation).
 * The heuristic has been removed. Every verdict on this surface is now
 * audit-data-driven.
 *
 * Visual chrome (badge styling, evidence prose, citation link) is
 * unchanged — this card remains the procurement-facing companion to the
 * `A11yStatusCard` chip row and the inline AAA-AUDIT.md panel.
 */
import * as React from 'react';
import customElements from '@helixui/library/custom-elements.json';
import verdictsSnapshot from '@helixui/library/aaa-verdicts.json';
import { listStandardCriteria } from './aaa-standards-data';

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

interface CemRoot {
  modules?: Array<{ declarations?: CemDeclaration[] }>;
}

type Verdict =
  | 'Supports'
  | 'Partially Supports'
  | 'Does Not Support'
  | 'Not Applicable'
  | 'Audit Pending';

interface VerdictEntry {
  verdict: string;
  evidence: string;
}

interface ComponentVerdicts {
  [criterionId: string]: VerdictEntry;
}

interface VerdictSnapshot {
  generatedAt?: string;
  sourceAuditRunAt?: string | null;
  standards?: string;
  standardsSource?: string | null;
  components?: Record<string, ComponentVerdicts | { __error?: string }>;
}

interface Row {
  id: string;
  name: string;
  level: string;
  type: 'wcag-sc' | 'peer';
  verdict: Verdict;
  summary: string;
  evidence: string;
  url: string;
  understandingUrl?: string;
  applicability?: string;
}

const REPO_BLOB_BASE = 'https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/';

const declCache = new Map<string, CemDeclaration | null>();
function findDeclaration(tag: string): CemDeclaration | null {
  if (declCache.has(tag)) return declCache.get(tag) ?? null;
  const cem = customElements as CemRoot;
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

const VERDICTS = verdictsSnapshot as VerdictSnapshot;
const KNOWN_VERDICTS = new Set<Verdict>([
  'Supports',
  'Partially Supports',
  'Does Not Support',
  'Not Applicable',
]);

/**
 * Normalise an arbitrary verdict string from the snapshot. Unknown values
 * fall back to "Audit Pending" so the docs surface never invents a
 * "Supports" verdict for an unaudited path.
 */
function normaliseVerdict(raw: string | undefined): Verdict {
  if (typeof raw === 'string' && KNOWN_VERDICTS.has(raw as Verdict)) {
    return raw as Verdict;
  }
  return 'Audit Pending';
}

function getComponentVerdicts(tag: string): ComponentVerdicts | null {
  const entry = VERDICTS.components?.[tag];
  if (!entry) return null;
  if ('__error' in entry) return null;
  return entry as ComponentVerdicts;
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
  const auditUrl = decl.helixMeta?.aaa?.auditUrl
    ? `${REPO_BLOB_BASE}${decl.helixMeta.aaa.auditUrl}`
    : null;
  const certDate = decl.aaaCertifiedDate ?? decl.helixMeta?.aaa?.certifiedDate ?? null;

  const componentVerdicts = getComponentVerdicts(tag);
  const auditPending = componentVerdicts === null;

  const allCriteria = listStandardCriteria();
  const rows: Row[] = allCriteria.map((sc) => {
    const entry = componentVerdicts?.[sc.id];
    const verdict: Verdict = auditPending ? 'Audit Pending' : normaliseVerdict(entry?.verdict);
    return {
      id: sc.id,
      name: sc.name,
      level: sc.level,
      type: sc.type,
      verdict,
      summary: sc.summary,
      evidence: entry?.evidence ?? '',
      url: sc.url,
      understandingUrl: sc.understandingUrl,
      applicability: sc.componentApplicability,
    };
  });

  const supportsCount = rows.filter((r) => r.verdict === 'Supports').length;
  const partialCount = rows.filter((r) => r.verdict === 'Partially Supports').length;
  const failCount = rows.filter((r) => r.verdict === 'Does Not Support').length;
  const naCount = rows.filter((r) => r.verdict === 'Not Applicable').length;
  const pendingCount = rows.filter((r) => r.verdict === 'Audit Pending').length;

  return (
    <section
      className="hx-docs hx-aaa-conformance"
      aria-label={`AAA conformance evidence for ${tag}`}
    >
      <header className="hx-aaa-conformance-header">
        <div>
          <h3 className="hx-aaa-conformance-title">{heading}</h3>
          <p className="hx-aaa-conformance-subtitle">
            {auditPending ? (
              <>
                <strong>Audit pending.</strong> This component has not been measured by the formal
                AAA audit harness yet. Run <code>pnpm aaa:audit</code> to populate verdicts.
              </>
            ) : certified ? (
              <>
                <strong>Certified WCAG 2.2 Level AAA</strong>
                {certDate ? (
                  <>
                    {' '}
                    on <time dateTime={certDate}>{certDate}</time>
                  </>
                ) : null}
                . {supportsCount} Supports
                {partialCount > 0 ? ` · ${partialCount} Partially Supports` : null}
                {failCount > 0 ? ` · ${failCount} Does Not Support` : null} · {naCount} Not
                Applicable
                {pendingCount > 0 ? ` · ${pendingCount} Audit Pending` : null} across {rows.length}{' '}
                criteria. Verdicts are sourced live from the formal audit snapshot.
              </>
            ) : (
              <>
                Not yet certified. Verdicts below are sourced from the formal audit snapshot —{' '}
                {supportsCount} Supports
                {partialCount > 0 ? `, ${partialCount} Partially Supports` : null}
                {failCount > 0 ? `, ${failCount} Does Not Support` : null}, {naCount} Not Applicable
                {pendingCount > 0 ? `, ${pendingCount} Audit Pending` : null}.
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
                {row.verdict === 'Partially Supports' ? '⚠ Partially Supports' : null}
                {row.verdict === 'Does Not Support' ? '✕ Does Not Support' : null}
                {row.verdict === 'Not Applicable' ? '— Not Applicable' : null}
                {row.verdict === 'Audit Pending' ? '… Audit Pending' : null}
              </span>
            </div>
            <p className="hx-aaa-conformance-row-summary">{row.summary}</p>
            {row.evidence ? (
              <p
                className="hx-aaa-conformance-row-evidence"
                data-verdict={row.verdict.toLowerCase().replace(/\s+/g, '-')}
              >
                <strong>
                  {row.verdict === 'Not Applicable'
                    ? 'Why N/A:'
                    : row.verdict === 'Partially Supports'
                      ? 'Partial — why:'
                      : row.verdict === 'Does Not Support'
                        ? 'Failure — why:'
                        : 'Evidence:'}
                </strong>{' '}
                {row.evidence}
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
