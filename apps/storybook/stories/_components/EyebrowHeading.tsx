import * as React from 'react';

/**
 * Editorial 6/4 column header — mono eyebrow above oversized headline,
 * optional lede in the right column. Lifted from
 * /Users/himerus/Downloads/dist/foundation/01-overview.html.
 *
 * Wrap in a `.hx-docs` container (provided by every MDX page wrapper)
 * so the editorial CSS layer applies.
 */
export interface EyebrowHeadingProps {
  /** Mono uppercase label above the title. */
  eyebrow: string;
  /** Headline. May contain HTML for emphasis (use `dangerouslySetInnerHTML` instead if needed). */
  title: string;
  /** Optional supporting lede paragraph in the right column. */
  lede?: React.ReactNode;
  /** Override the headline element (defaults to `h1`). */
  as?: 'h1' | 'h2';
}

export function EyebrowHeading({ eyebrow, title, lede, as: Heading = 'h1' }: EyebrowHeadingProps) {
  return (
    <header className="hx-docs-eyebrow-heading">
      <div>
        <p className="hx-docs-eyebrow">{eyebrow}</p>
        <Heading className="hx-docs-headline">{title}</Heading>
      </div>
      {lede ? <div className="hx-docs-lede">{lede}</div> : null}
    </header>
  );
}
