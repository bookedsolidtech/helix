import * as React from 'react';
import { cssColorToHex } from './contrast';
import { useResolvedTokens } from './useResolvedToken';

/**
 * 11-stop ramp grid. Reads tokens from the *active CSS cascade* via
 * `getComputedStyle(document.documentElement)` and renders one swatch
 * per stop with click-to-copy of the var() reference and computed-contrast
 * legibility (light text on dark stops, dark text on light stops).
 *
 * Lifted from /Users/himerus/Downloads/dist/foundation/03-colors.html:186-207.
 *
 * The hex values displayed in each swatch are resolved live whenever the
 * Storybook toolbar flips `data-theme` or `data-brand` on `<html>`, so
 * brand→Meridian and theme→dark both update the printed labels in step
 * with the swatch backgrounds. Earlier revisions read tokenEntries at
 * build time and showed Apex/light defaults regardless of the active
 * cascade, which made the AAA-cert color page misleading.
 */

const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const LIGHT_STOPS = new Set<number>([50, 100, 200, 300, 400]);

export interface TokenSwatchGridProps {
  /** Ramp role (e.g. `primary`, `neutral`, `success`). */
  ramp: string;
  /** Override the displayed label (defaults to capitalized ramp). */
  label?: string;
}

function copyToken(tokenName: string, swatchEl: HTMLElement | null) {
  const value = `var(${tokenName})`;
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(value).catch(() => {});
  }
  if (swatchEl) {
    swatchEl.classList.add('is-copied');
    window.setTimeout(() => swatchEl.classList.remove('is-copied'), 800);
  }
}

export function TokenSwatchGrid({ ramp, label }: TokenSwatchGridProps) {
  const tokenNames = React.useMemo(() => STOPS.map((stop) => `--hx-color-${ramp}-${stop}`), [ramp]);
  // Live-cascade read: updates on data-theme / data-brand mutation.
  const resolvedValues = useResolvedTokens(tokenNames);
  const displayLabel = label ?? ramp.charAt(0).toUpperCase() + ramp.slice(1);

  return (
    <div className="hx-docs-ramp-row">
      <div className="hx-docs-ramp-label">
        {displayLabel}
        <small>--hx-color-{ramp}-*</small>
      </div>
      {STOPS.map((stop, index) => {
        const tokenName = tokenNames[index]!;
        const resolved = resolvedValues[index] ?? '';
        const hex = cssColorToHex(resolved);
        const isLight = LIGHT_STOPS.has(stop);
        return (
          <button
            key={stop}
            type="button"
            className="hx-docs-swatch"
            data-light={isLight ? 'true' : 'false'}
            style={{ background: `var(${tokenName})` }}
            title={`Copy var(${tokenName})`}
            onClick={(event) => copyToken(tokenName, event.currentTarget)}
          >
            <div>
              <div className="hx-docs-swatch-step">{stop}</div>
              <div className="hx-docs-swatch-hex">{hex || '—'}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
