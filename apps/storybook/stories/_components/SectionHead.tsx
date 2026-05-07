import * as React from 'react';

/**
 * Section divider — h2 with optional mono-meta annotation, baseline-aligned,
 * separated from the section body by a 1px rule. Lifted from
 * /Users/himerus/Downloads/dist/foundation/03-colors.html:16-23.
 */
export interface SectionHeadProps {
  title: string;
  /** Mono token annotation displayed flush-right (e.g. `--hx-color-{role}-{50…950}`). */
  meta?: string;
}

export function SectionHead({ title, meta }: SectionHeadProps) {
  return (
    <div className="hx-docs-section-head">
      <h2>{title}</h2>
      {meta ? <span className="hx-docs-section-meta">{meta}</span> : null}
    </div>
  );
}
