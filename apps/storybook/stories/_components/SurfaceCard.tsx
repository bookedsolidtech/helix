import * as React from 'react';
import { tokenEntries, tokenMap } from '@helixui/tokens';
import { resolveTokenRef, isHexColor } from '@helixui/tokens/utils';
import { contrastRatio } from './contrast';

/**
 * Surface card — renders a tile in the surface token's background, paired
 * with a text token, and prints the WCAG contrast ratio inline.
 *
 * Lifted from /Users/himerus/Downloads/dist/foundation/03-colors.html:138-141.
 *
 * Wrap multiple cards in `<div className="hx-docs-surface-grid">…</div>`.
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

function resolve(token: string): string {
  const entry = tokenEntries.find((t) => t.name === token);
  if (!entry) return '';
  const raw = entry.value;
  return isHexColor(raw) ? raw : resolveTokenRef(raw, tokenMap);
}

function deriveLabel(token: string): string {
  // --hx-color-surface-default → surface.default
  return token.replace(/^--hx-color-/, '').replace(/-/g, '.');
}

export function SurfaceCard({ surfaceToken, pairedWith, description, label }: SurfaceCardProps) {
  const surfaceHex = resolve(surfaceToken);
  const textHex = resolve(pairedWith);
  const ratio = contrastRatio(surfaceHex, textHex);
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
