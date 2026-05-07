import * as React from 'react';

/**
 * State matrix — variant rows × state columns, each cell renders the actual
 * custom element with the corresponding `.force-{state}` class applied.
 *
 * Lifted from /Users/himerus/Downloads/dist/components/07-buttons.html:247-282.
 *
 * Components opt in to hover/active visualization by exposing
 * `:host(.force-hover)` / `:host(.force-active)` rules in their .styles.ts.
 * Focus and disabled work for every host.
 *
 * The MDX page must side-effect-import the component being matrixed
 * (e.g. `import '@helixui/library/components/hx-button';`) before
 * mounting this component, so the custom element is registered.
 */

export type MatrixState = 'rest' | 'hover' | 'active' | 'focus' | 'disabled';

const STATE_CLASS: Record<MatrixState, string> = {
  rest: '',
  hover: 'force-hover',
  active: 'force-active',
  focus: 'force-focus',
  disabled: 'force-disabled',
};

const STATE_LABEL: Record<MatrixState, string> = {
  rest: 'Rest',
  hover: 'Hover',
  active: 'Active',
  focus: 'Focus (kbd)',
  disabled: 'Disabled',
};

export interface StateMatrixProps {
  /** Custom element tag name (e.g. `hx-button`). */
  tagName: string;
  /**
   * Variant attribute name (default `variant`). The value is set as an
   * attribute on the rendered element.
   */
  variantAttr?: string;
  /** Variant values to render — one row per variant. */
  variants: string[];
  /** State columns to render. Defaults to all five. */
  states?: MatrixState[];
  /** Slot text for every cell. */
  children?: React.ReactNode;
  /**
   * Extra static attributes propagated onto every rendered host.
   * Useful for `size`, `appearance`, etc.
   */
  attrs?: Record<string, string | boolean>;
}

function renderCell(
  tagName: string,
  variantAttr: string,
  variant: string,
  state: MatrixState,
  children: React.ReactNode,
  attrs: Record<string, string | boolean> = {},
) {
  const props: Record<string, unknown> = {
    [variantAttr]: variant,
    className: STATE_CLASS[state],
    ...attrs,
  };
  if (state === 'disabled') {
    props.disabled = true;
    props['aria-disabled'] = 'true';
  }
  return React.createElement(tagName, props, children ?? variant);
}

export function StateMatrix({
  tagName,
  variantAttr = 'variant',
  variants,
  states = ['rest', 'hover', 'active', 'focus', 'disabled'],
  children,
  attrs,
}: StateMatrixProps) {
  const cols = states.length;
  const gridTemplate = `140px repeat(${cols}, minmax(0, 1fr))`;

  return (
    <div className="hx-docs-state-matrix" style={{ gridTemplateColumns: gridTemplate }}>
      <div />
      {states.map((s) => (
        <div key={`h-${s}`} className="hx-docs-col-head">
          {STATE_LABEL[s]}
        </div>
      ))}
      {variants.flatMap((v) => [
        <div key={`l-${v}`} className="hx-docs-state-lbl">
          {v}
        </div>,
        ...states.map((s) => (
          <div key={`c-${v}-${s}`} className="hx-docs-state-cell">
            {renderCell(tagName, variantAttr, v, s, children, attrs)}
          </div>
        )),
      ])}
    </div>
  );
}
