import * as React from 'react';

/**
 * Card with a title, optional mono tag, optional descriptive copy, and a
 * dashed-border `.demo` zone for the live composition. Lifted from
 * /Users/himerus/Downloads/dist/components/07-buttons.html:170-184.
 */
export interface DocsCardProps {
  /** Card title (h4-equivalent). */
  title: string;
  /** Optional mono tag flush-right (e.g. `hx-button + svg`). */
  tag?: string;
  /** Optional body copy under the title. */
  children?: React.ReactNode;
  /** Live demo content rendered in the dashed `.demo` zone. */
  demo: React.ReactNode;
}

export function DocsCard({ title, tag, children, demo }: DocsCardProps) {
  return (
    <div className="hx-docs-card">
      <div className="hx-docs-card-head">
        <h4 className="hx-docs-card-title">{title}</h4>
        {tag ? <span className="hx-docs-card-tag">{tag}</span> : null}
      </div>
      {children ? <p className="hx-docs-card-body">{children}</p> : null}
      <div className="hx-docs-card-demo">{demo}</div>
    </div>
  );
}
