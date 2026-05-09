/**
 * ConsumerObligations — callout listing the consumer-side responsibilities
 * a component cert depends on.
 *
 * The AAA cert for a component is conditional: even when every measured
 * row passes, the consumer can still ship a non-conformant page if they
 * (a) strip the focus ring with author CSS, (b) omit an accessible name
 * on an icon-only instance, or (c) embed the component on a page that
 * itself fails 2.4.2 / 3.1.1 / etc.
 *
 * This component renders a strongly-themed warning callout with a list
 * of obligations the docs page author hand-curates from the component's
 * AAA-AUDIT.md "Known consumer obligations" section. It is intentionally
 * NOT auto-derived — the obligations reflect editorial judgement about
 * which footguns to flag, and live in story source so they evolve with
 * the component contract.
 */
import * as React from 'react';

export interface ConsumerObligationsProps {
  /** Component tag (display only — the obligations are passed via children). */
  tag?: string;
  /** Heading override. */
  heading?: string;
  /** One bullet per obligation. Plain string or rich React node. */
  obligations: ReadonlyArray<string | React.ReactNode>;
}

export function ConsumerObligations({
  tag,
  heading = 'Consumer obligations',
  obligations,
}: ConsumerObligationsProps): React.ReactElement {
  return (
    <aside
      className="hx-docs hx-consumer-obligations"
      role="note"
      aria-label={
        tag ? `Consumer obligations for ${tag}` : 'Consumer obligations'
      }
    >
      <header className="hx-consumer-obligations-header">
        <span className="hx-consumer-obligations-icon" aria-hidden="true">
          ⚠
        </span>
        <h3 className="hx-consumer-obligations-title">{heading}</h3>
      </header>
      <p className="hx-consumer-obligations-intro">
        For the AAA verdicts above to hold in real-world deployment, the consumer{' '}
        <strong>must</strong>:
      </p>
      <ul className="hx-consumer-obligations-list">
        {obligations.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
