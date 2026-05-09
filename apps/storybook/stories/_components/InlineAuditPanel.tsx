/**
 * InlineAuditPanel — embed the full AAA-AUDIT.md inline on a component
 * docs page, collapsed by default.
 *
 * Consumer pattern (in MDX):
 *
 *   import audit from '../../packages/hx-library/src/components/hx-button/AAA-AUDIT.md?raw';
 *   <InlineAuditPanel tag="hx-button" markdown={audit} />
 *
 * Vite resolves `?raw` to the file's text contents at build time, so the
 * audit ships in the docs bundle and is always synchronized with the
 * source-of-truth markdown — no extra build step, no drift.
 *
 * Rendering: we intentionally do NOT pull a markdown renderer. The audit
 * file is a long evidence document; rendering it as preformatted text
 * inside a styled wrapper preserves table alignment, code blocks, and
 * the heading hierarchy without dragging a markdown parser into the
 * docs bundle. A "View on GitHub" link in the footer surfaces the
 * fully-rendered version for consumers who want richer formatting.
 */
import * as React from 'react';

export interface InlineAuditPanelProps {
  /** Component tag (display only). */
  tag: string;
  /** Raw AAA-AUDIT.md contents — pass via `?raw` import. */
  markdown: string;
  /**
   * Repo path of the audit file (e.g. "src/components/hx-button/AAA-AUDIT.md").
   * Used to construct the "View on GitHub" link. Defaults to the
   * conventional `src/components/<tag>/AAA-AUDIT.md` path.
   */
  auditPath?: string;
  /** Heading override. */
  heading?: string;
  /** When true, the panel renders open by default. */
  defaultOpen?: boolean;
}

export function InlineAuditPanel({
  tag,
  markdown,
  auditPath,
  heading = 'Full AAA audit (inline)',
  defaultOpen = false,
}: InlineAuditPanelProps): React.ReactElement {
  const path = auditPath ?? `src/components/${tag}/AAA-AUDIT.md`;
  const githubUrl = `https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/${path}`;
  return (
    <section
      className="hx-docs hx-inline-audit"
      aria-label={`Inline AAA audit for ${tag}`}
    >
      <details className="hx-inline-audit-details" open={defaultOpen}>
        <summary className="hx-inline-audit-summary">
          <span className="hx-inline-audit-icon" aria-hidden="true">
            📄
          </span>
          <span className="hx-inline-audit-heading">{heading}</span>
          <span className="hx-inline-audit-hint">click to expand</span>
        </summary>
        <div className="hx-inline-audit-body">
          <pre className="hx-inline-audit-pre">
            <code>{markdown}</code>
          </pre>
          <footer className="hx-inline-audit-footer">
            <a
              className="hx-inline-audit-github-link"
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View formatted on GitHub →
            </a>
          </footer>
        </div>
      </details>
    </section>
  );
}
