import * as React from 'react';
import { contrastRatio } from './contrast';
import { useResolvedTokens } from './useResolvedToken';

/**
 * Surface card — renders a tile in the surface token's background, paired
 * with a text token, and prints the *live* WCAG contrast ratio inline.
 *
 * Lifted from /Users/himerus/Downloads/dist/foundation/03-colors.html:138-141.
 *
 * Wrap multiple cards in `<div className="hx-docs-surface-grid">…</div>`.
 *
 * The inline ratio is computed from `getComputedStyle` reads of the
 * surface- and text-token CSS custom properties, refreshed whenever the
 * Storybook toolbar mutates `data-theme` or `data-brand` on `<html>`.
 * Earlier revisions resolved both tokens once at module evaluation from
 * the static token map, which froze the printed ratio at the Apex/light
 * defaults even after a theme→dark flip.
 */

export interface SurfaceCardProps {
  /** Surface token name (e.g. `--hx-color-surface-default`). */
  surfaceToken: string;
  /** Text token to pair with for the contrast computation. */
  pairedWith: string;
  /** Optional descriptive label (e.g. `Cards, panels`). */
  description?: string;
  /** Optional override for the displayed surface label. Defaults to last 2 path segments. */
  label?: string;
}

function deriveLabel(token: string): string {
  // --hx-color-surface-default → surface.default
  return token.replace(/^--hx-color-/, '').replace(/-/g, '.');
}

export function SurfaceCard({ surfaceToken, pairedWith, description, label }: SurfaceCardProps) {
  const tokens = React.useMemo(
    () => [surfaceToken, pairedWith] as const,
    [surfaceToken, pairedWith],
  );
  const [surfaceValue, textValue] = useResolvedTokens(tokens);
  const ratio = contrastRatio(surfaceValue ?? '', textValue ?? '');
  const display = label ?? deriveLabel(surfaceToken);
  const ratioStr = ratio.toFixed(ratio >= 10 ? 1 : 2);

  return (
    <div
      className="hx-docs-surface-card"
      style={{
        background: `var(${surfaceToken})`,
        color: `var(${pairedWith})`,
      }}
    >
      <strong>{display}</strong>
      <div>
        {description ? <div>{description}</div> : null}
        <span className="hx-docs-surface-ratio">
          {ratioStr}:1 vs {deriveLabel(pairedWith)}
        </span>
      </div>
    </div>
  );
}
