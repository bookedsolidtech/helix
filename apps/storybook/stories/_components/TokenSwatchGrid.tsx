import * as React from 'react';
import { tokenEntries, tokenMap } from '@helixui/tokens';
import { resolveTokenRef, isHexColor } from '@helixui/tokens/utils';

/**
 * 11-stop ramp grid. Reads tokens from @helixui/tokens, renders one swatch
 * per stop with click-to-copy of the var() reference and computed-contrast
 * legibility (light text on dark stops, dark text on light stops).
 *
 * Lifted from /Users/himerus/Downloads/dist/foundation/03-colors.html:186-207.
 *
 * The hex values displayed in each swatch are resolved at render time from
 * the tokenMap; on theme change Storybook re-renders MDX, so the values
 * track the active theme's primitive ramp.
 */

const STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const LIGHT_STOPS = new Set([50, 100, 200, 300, 400]);

export interface TokenSwatchGridProps {
  /** Ramp role (e.g. `primary`, `neutral`, `success`). */
  ramp: string;
  /** Override the displayed label (defaults to capitalized ramp). */
  label?: string;
}

interface ResolvedStop {
  stop: number;
  tokenName: string;
  hex: string;
  isLight: boolean;
}

function resolveStops(ramp: string): ResolvedStop[] {
  return STOPS.map((stop) => {
    const tokenName = `--hx-color-${ramp}-${stop}`;
    const entry = tokenEntries.find((t) => t.name === tokenName);
    const raw = entry?.value ?? '';
    const resolved = isHexColor(raw) ? raw : resolveTokenRef(raw, tokenMap);
    return {
      stop,
      tokenName,
      hex: resolved.toUpperCase(),
      isLight: LIGHT_STOPS.has(stop),
    };
  });
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
  const stops = React.useMemo(() => resolveStops(ramp), [ramp]);
  const displayLabel = label ?? ramp.charAt(0).toUpperCase() + ramp.slice(1);

  return (
    <div className="hx-docs-ramp-row">
      <div className="hx-docs-ramp-label">
        {displayLabel}
        <small>--hx-color-{ramp}-*</small>
      </div>
      {stops.map((s) => (
        <button
          key={s.stop}
          type="button"
          className="hx-docs-swatch"
          data-light={s.isLight ? 'true' : 'false'}
          style={{ background: `var(${s.tokenName})` }}
          title={`Copy var(${s.tokenName})`}
          onClick={(event) => copyToken(s.tokenName, event.currentTarget)}
        >
          <div>
            <div className="hx-docs-swatch-step">{s.stop}</div>
            <div className="hx-docs-swatch-hex">{s.hex || '—'}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
