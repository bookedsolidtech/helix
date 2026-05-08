/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * A11yStatusCard — surfaces helixMeta from the Custom Elements Manifest as a
 * compliance-grade status card on every component docs page.
 *
 * Rendered automatically by the autodocs template wired in
 * `.storybook/docs/HelixDocsPage.tsx`. The card is data-driven: when a
 * component declares `aaaCertified: true` (with `helixMeta.aaa.*` payload),
 * it renders the green "AAA Certified" headline with criteria chips, audit
 * link, ARIA pattern row, keyboard contract row, and capability badges.
 * Non-certified components fall back to a neutral "AAA — Pending audit"
 * state but still surface ARIA pattern + keyboard contract + capabilities
 * when present so consumer-facing documentation stays useful pre-audit.
 *
 * Source of truth: `@helixui/library/custom-elements.json`. The CEM is
 * imported once at module evaluation; runtime lookups walk all
 * `javascript-module` entries → `declarations[]` → matching `tagName`.
 *
 * Visual language inherits from `helix-docs.css` token-driven primitives
 * (no hardcoded colors / spacing) and pairs with the dark-editor Shiki
 * code-block chrome already established in the docs surface.
 */
import * as React from 'react';
import customElements from '@helixui/library/custom-elements.json';

// ── Types ───────────────────────────────────────────────────────

interface KeyboardContract {
  activate?: readonly string[];
  navigate?: readonly string[];
  dismiss?: readonly string[];
  disabledSuppresses?: boolean;
}

interface AaaPayload {
  certified?: boolean;
  certifiedDate?: string;
  criteria?: readonly string[];
  auditUrl?: string;
}

interface HelixMeta {
  aaa?: AaaPayload;
  keyboardContract?: KeyboardContract;
  ariaPattern?: string;
  ariaPatternSource?: string;
  forcedColorsSupported?: boolean;
  stability?: string;
  since?: string;
  formAssociated?: boolean;
  themeAware?: boolean;
  brandAware?: boolean;
  drupalSdcEligible?: boolean;
  reactWrapperStatus?: string;
  priorityTier?: 'P0' | 'P1' | 'P2' | 'Exempt' | string;
  phiHandles?: boolean;
  clinicalContext?: string;
}

interface CemDeclaration {
  tagName?: string;
  aaaCertified?: boolean;
  aaaCertifiedDate?: string;
  helixMeta?: HelixMeta;
  summary?: string;
}

// ── CEM resolution ──────────────────────────────────────────────

/**
 * Walk the CEM and return the declaration for `tag`, or null if absent.
 * Memoized once per tag — declarations are static at build time.
 */
const declarationCache = new Map<string, CemDeclaration | null>();

function findDeclaration(tag: string): CemDeclaration | null {
  if (declarationCache.has(tag)) {
    return declarationCache.get(tag) ?? null;
  }
  const cem = customElements as { modules?: Array<{ declarations?: CemDeclaration[] }> };
  for (const mod of cem.modules ?? []) {
    for (const decl of mod.declarations ?? []) {
      if (decl?.tagName === tag) {
        declarationCache.set(tag, decl);
        return decl;
      }
    }
  }
  declarationCache.set(tag, null);
  return null;
}

// ── Constants ───────────────────────────────────────────────────

const PRIORITY_TIER_TOOLTIPS: Record<string, string> = {
  P0: 'P0 — Foundational primitive. AAA-cert is mandatory before release.',
  P1: 'P1 — Common workflow component. AAA-cert is required for healthcare deploys.',
  P2: 'P2 — Convenience or composition layer. AAA-cert is recommended.',
  Exempt: 'Exempt — Component is decorative or internal-only and not subject to AAA cert.',
};

const REPO_BLOB_BASE = 'https://github.com/bookedsolidtech/helix/blob/main/packages/hx-library/';

// ── Helpers ─────────────────────────────────────────────────────

function humanizeKeyboardContract(kc: KeyboardContract | undefined): string | null {
  if (!kc) return null;
  const parts: string[] = [];
  if (kc.activate?.length) {
    parts.push(`${kc.activate.join(' / ')} activates`);
  }
  if (kc.navigate?.length) {
    parts.push(`${kc.navigate.join(' / ')} navigates`);
  }
  if (kc.dismiss?.length) {
    parts.push(`${kc.dismiss.join(' / ')} dismisses`);
  }
  if (kc.disabledSuppresses) {
    parts.push('disabled suppresses');
  }
  return parts.length ? parts.join(' · ') : null;
}

function formatCertDate(iso: string | undefined): string | null {
  if (!iso) return null;
  // Keep ISO date for stability (no locale dependency in cert audit trail).
  return iso;
}

// ── Sub-components ──────────────────────────────────────────────

interface CapabilityBadgeProps {
  label: string;
  truthy: boolean;
  /** Override label (e.g. "React wrapper: complete" instead of boolean). */
  valueLabel?: string;
}

function CapabilityBadge({ label, truthy, valueLabel }: CapabilityBadgeProps) {
  if (!truthy && !valueLabel) return null;
  return (
    <span className="hx-a11y-card-cap-badge">
      <span className="hx-a11y-card-cap-label">{label}</span>
      <span className="hx-a11y-card-cap-value">{valueLabel ?? '✓'}</span>
    </span>
  );
}

// ── Main card ───────────────────────────────────────────────────

export interface A11yStatusCardProps {
  /** Component tag name (e.g. "hx-button"). */
  tag: string;
}

export function A11yStatusCard({ tag }: A11yStatusCardProps): React.ReactElement | null {
  const decl = findDeclaration(tag);
  if (!decl) {
    // Tag not in CEM (e.g. internal Storybook story). Render nothing rather
    // than a misleading "Pending audit" badge for non-component pages.
    return null;
  }

  const meta = decl.helixMeta ?? {};
  const aaa = meta.aaa ?? {};
  const certified = decl.aaaCertified === true || aaa.certified === true;
  const certDate = formatCertDate(decl.aaaCertifiedDate ?? aaa.certifiedDate);
  const criteria = aaa.criteria ?? [];
  const auditUrl = aaa.auditUrl ? `${REPO_BLOB_BASE}${aaa.auditUrl}` : null;
  const tier = meta.priorityTier ?? null;
  const tierTooltip = tier ? (PRIORITY_TIER_TOOLTIPS[tier] ?? `Priority tier: ${tier}`) : null;
  const keyboardLine = humanizeKeyboardContract(meta.keyboardContract);

  return (
    <aside className="hx-docs hx-a11y-card" data-certified={certified ? 'true' : 'false'}>
      <header className="hx-a11y-card-header">
        <div className="hx-a11y-card-headline">
          <span className="hx-a11y-card-icon" aria-hidden="true">
            {certified ? '✓' : '◷'}
          </span>
          <div className="hx-a11y-card-title-block">
            <h3 className="hx-a11y-card-title">
              {certified ? 'AAA Certified' : 'AAA — Pending audit'}
            </h3>
            {certified && certDate ? (
              <p className="hx-a11y-card-subtitle">
                Certified <time dateTime={certDate}>{certDate}</time> · WCAG 2.1 Level AAA
              </p>
            ) : (
              <p className="hx-a11y-card-subtitle">
                Component has not yet completed the WCAG 2.1 Level AAA audit.
              </p>
            )}
          </div>
        </div>
        {tier ? (
          <span
            className="hx-a11y-card-tier"
            data-tier={tier}
            title={tierTooltip ?? undefined}
            aria-label={tierTooltip ?? `Priority tier ${tier}`}
          >
            {tier}
          </span>
        ) : null}
      </header>

      {certified && criteria.length ? (
        <div className="hx-a11y-card-row">
          <span className="hx-a11y-card-row-label">Success Criteria</span>
          <ul className="hx-a11y-card-criteria" aria-label="WCAG success criteria audited">
            {criteria.map((sc) => (
              <li key={sc} className="hx-a11y-card-criterion">
                <code>{sc}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {meta.ariaPattern ? (
        <div className="hx-a11y-card-row">
          <span className="hx-a11y-card-row-label">ARIA Pattern</span>
          <span className="hx-a11y-card-row-value">
            <code>{meta.ariaPattern}</code>
            {meta.ariaPatternSource ? (
              <>
                {' '}
                <a
                  className="hx-a11y-card-link"
                  href={meta.ariaPatternSource}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  W3C APG ↗
                </a>
              </>
            ) : null}
          </span>
        </div>
      ) : null}

      {keyboardLine ? (
        <div className="hx-a11y-card-row">
          <span className="hx-a11y-card-row-label">Keyboard</span>
          <span className="hx-a11y-card-row-value">{keyboardLine}</span>
        </div>
      ) : null}

      <div className="hx-a11y-card-row hx-a11y-card-caps-row">
        <span className="hx-a11y-card-row-label">Capabilities</span>
        <div className="hx-a11y-card-caps">
          <CapabilityBadge label="Forced colors" truthy={meta.forcedColorsSupported === true} />
          <CapabilityBadge label="Form-associated" truthy={meta.formAssociated === true} />
          <CapabilityBadge label="Theme-aware" truthy={meta.themeAware === true} />
          <CapabilityBadge label="Brand-aware" truthy={meta.brandAware === true} />
          <CapabilityBadge label="Drupal SDC" truthy={meta.drupalSdcEligible === true} />
          {meta.reactWrapperStatus ? (
            <CapabilityBadge label="React wrapper" truthy valueLabel={meta.reactWrapperStatus} />
          ) : null}
          {meta.stability ? (
            <CapabilityBadge label="Stability" truthy valueLabel={meta.stability} />
          ) : null}
          {meta.since ? <CapabilityBadge label="Since" truthy valueLabel={meta.since} /> : null}
        </div>
      </div>

      {certified && auditUrl ? (
        <footer className="hx-a11y-card-footer">
          <a
            className="hx-a11y-card-audit-link"
            href={auditUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View full AAA audit →
          </a>
        </footer>
      ) : null}
    </aside>
  );
}
