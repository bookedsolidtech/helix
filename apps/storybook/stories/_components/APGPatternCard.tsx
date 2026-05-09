/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * APGPatternCard — surfaces the WAI-ARIA Authoring Practices Guide
 * pattern citation and the keyboard contract pulled from the component's
 * `helixMeta.ariaPattern` + `helixMeta.keyboardContract` JSDoc tags
 * (see `packages/hx-library/src/components/<tag>/<tag>.ts`).
 *
 * The keyboard rows are rendered as `<kbd>` token clusters so the
 * component contract reads like the APG keyboard tables themselves.
 *
 * Optional `screenReaderAnnouncement` prop documents the expected
 * announcement string a screen reader emits for the canonical default
 * state — a practical aid for QA teams running NVDA / JAWS / VoiceOver
 * acceptance tests on a HELiX deploy.
 */
import * as React from 'react';
import customElements from '@helixui/library/custom-elements.json';

interface KeyboardContract {
  activate?: readonly string[];
  navigate?: readonly string[];
  dismiss?: readonly string[];
  disabledSuppresses?: boolean;
}

interface CemDeclaration {
  tagName?: string;
  helixMeta?: {
    ariaPattern?: string;
    ariaPatternSource?: string;
    keyboardContract?: KeyboardContract;
  };
}

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

function KbdGroup({ keys }: { keys: readonly string[] }): React.ReactElement {
  return (
    <span className="hx-apg-kbd-group">
      {keys.map((k, i) => (
        <React.Fragment key={`${k}-${i}`}>
          {i > 0 ? <span className="hx-apg-kbd-sep"> / </span> : null}
          <kbd className="hx-apg-kbd">{k}</kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export interface APGPatternCardProps {
  tag: string;
  /** Heading override. */
  heading?: string;
  /** Optional expected screen-reader announcement string for the default state. */
  screenReaderAnnouncement?: string;
  /** Optional override for the screen-reader announcement label (e.g. "When focused"). */
  screenReaderContext?: string;
}

export function APGPatternCard({
  tag,
  heading = 'ARIA pattern & keyboard contract',
  screenReaderAnnouncement,
  screenReaderContext = 'When focused, screen readers announce',
}: APGPatternCardProps): React.ReactElement | null {
  const decl = findDeclaration(tag);
  if (!decl) return null;
  const meta = decl.helixMeta ?? {};
  const pattern = meta.ariaPattern;
  const patternUrl = meta.ariaPatternSource;
  const kc = meta.keyboardContract ?? {};

  if (!pattern && !kc.activate && !kc.navigate && !kc.dismiss) {
    return null;
  }

  return (
    <section className="hx-docs hx-apg-card" aria-label={`ARIA pattern walkthrough for ${tag}`}>
      <header className="hx-apg-card-header">
        <h3 className="hx-apg-card-title">{heading}</h3>
        {pattern ? (
          <p className="hx-apg-card-subtitle">
            Implements the <code>{pattern}</code> pattern from the W3C WAI-ARIA Authoring Practices
            Guide.{' '}
            {patternUrl ? (
              <a
                className="hx-apg-card-link"
                href={patternUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open APG pattern ↗
              </a>
            ) : null}
          </p>
        ) : null}
      </header>

      <div className="hx-apg-card-body">
        <h4 className="hx-apg-card-section-title">Keyboard contract</h4>
        <ul className="hx-apg-card-keyboard">
          {kc.activate?.length ? (
            <li>
              <KbdGroup keys={kc.activate} />
              <span className="hx-apg-kbd-desc">activates the component</span>
            </li>
          ) : null}
          {kc.navigate?.length ? (
            <li>
              <KbdGroup keys={kc.navigate} />
              <span className="hx-apg-kbd-desc">navigates between items</span>
            </li>
          ) : null}
          {kc.dismiss?.length ? (
            <li>
              <KbdGroup keys={kc.dismiss} />
              <span className="hx-apg-kbd-desc">dismisses / closes</span>
            </li>
          ) : null}
          {kc.disabledSuppresses ? (
            <li className="hx-apg-card-keyboard-note">
              <span className="hx-apg-kbd-desc">
                When <code>disabled</code>, all keyboard activation is suppressed.
              </span>
            </li>
          ) : null}
        </ul>

        {screenReaderAnnouncement ? (
          <>
            <h4 className="hx-apg-card-section-title">Expected screen-reader announcement</h4>
            <p className="hx-apg-card-sr">
              {screenReaderContext}:{' '}
              <q className="hx-apg-card-sr-quote">{screenReaderAnnouncement}</q>
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
