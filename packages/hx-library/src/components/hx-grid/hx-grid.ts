import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { tokenStyles } from '@helixui/tokens/lit';
import { helixGridStyles, helixGridItemStyles } from './hx-grid.styles.js';

type GapSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AlignValue = 'start' | 'center' | 'end' | 'stretch';
type JustifyValue = 'start' | 'center' | 'end' | 'stretch';

const GAP_TOKENS: Record<GapSize, string> = {
  none: '0',
  xs: 'var(--hx-space-1, 0.25rem)',
  sm: 'var(--hx-space-2, 0.5rem)',
  md: 'var(--hx-space-4, 1rem)',
  lg: 'var(--hx-space-6, 1.5rem)',
  xl: 'var(--hx-space-8, 2rem)',
};

/**
 * A CSS Grid layout wrapper with design-token-based column and gap system.
 *
 * @summary CSS Grid layout primitive for building responsive grid layouts.
 *
 * @tag hx-grid
 *
 * @slot - Default slot for grid content (use `hx-grid-item` for precise placement).
 *
 * @csspart base - The grid container element.
 *
 * @cssprop [--hx-grid-columns] - Override the computed grid-template-columns.
 * @cssprop [--hx-grid-gap] - Override the computed gap.
 * @cssprop [--hx-grid-row-gap] - Override the computed row-gap.
 * @cssprop [--hx-grid-column-gap] - Override the computed column-gap.
 */
@customElement('hx-grid')
export class HelixGrid extends LitElement {
  static override styles = [tokenStyles, helixGridStyles];

  /**
   * Number of equal columns (`repeat(N, 1fr)`) or a CSS grid-template-columns string.
   * @attr columns
   */
  @property({ reflect: true })
  columns: number | string = 1;

  /**
   * Gap size applied to both row and column gaps.
   * @attr gap
   */
  @property({ reflect: true })
  gap: GapSize = 'md';

  /**
   * Row gap override. When set, takes precedence over `gap` for row spacing.
   * @attr row-gap
   */
  @property({ attribute: 'row-gap', reflect: true })
  rowGap: GapSize | undefined;

  /**
   * Column gap override. When set, takes precedence over `gap` for column spacing.
   * @attr column-gap
   */
  @property({ attribute: 'column-gap', reflect: true })
  columnGap: GapSize | undefined;

  /**
   * Aligns grid items along the block axis (align-items).
   * @attr align
   */
  @property({ reflect: true })
  align: AlignValue = 'stretch';

  /**
   * Justifies grid items along the inline axis (justify-items).
   * @attr justify
   */
  @property({ reflect: true })
  justify: JustifyValue = 'stretch';

  private _gridTemplateColumns(): string {
    const cols = this.columns;
    if (typeof cols === 'number' || /^\d+$/.test(String(cols))) {
      return `var(--hx-grid-columns, repeat(${cols}, 1fr))`;
    }
    return `var(--hx-grid-columns, ${cols})`;
  }

  private _resolveGap(size: GapSize): string {
    return GAP_TOKENS[size] ?? GAP_TOKENS.md;
  }

  private _computedRowGap(): string {
    if (this.rowGap) {
      return `var(--hx-grid-row-gap, ${this._resolveGap(this.rowGap)})`;
    }
    return `var(--hx-grid-row-gap, var(--hx-grid-gap, ${this._resolveGap(this.gap)}))`;
  }

  private _computedColumnGap(): string {
    if (this.columnGap) {
      return `var(--hx-grid-column-gap, ${this._resolveGap(this.columnGap)})`;
    }
    return `var(--hx-grid-column-gap, var(--hx-grid-gap, ${this._resolveGap(this.gap)}))`;
  }

  private _baseStyle(): string {
    return [
      'display: grid',
      `grid-template-columns: ${this._gridTemplateColumns()}`,
      `row-gap: ${this._computedRowGap()}`,
      `column-gap: ${this._computedColumnGap()}`,
      `align-items: ${this.align}`,
      `justify-items: ${this.justify}`,
    ].join('; ');
  }

  override render() {
    return html`
      <div part="base" role="presentation" style=${this._baseStyle()}>
        <slot></slot>
      </div>
    `;
  }
}

/**
 * Optional companion element for precise grid item placement.
 * Applies grid-column and grid-row directly to the host element
 * so it participates correctly in the parent CSS grid layout.
 *
 * @summary Grid item with explicit column/row placement.
 *
 * @tag hx-grid-item
 *
 * @slot - Default slot for item content.
 */
@customElement('hx-grid-item')
export class HelixGridItem extends LitElement {
  static override styles = [tokenStyles, helixGridItemStyles];

  /**
   * CSS grid-column value (e.g., "1 / 3", "span 2").
   * @attr column
   */
  @property({ reflect: true })
  column: string | undefined;

  /**
   * CSS grid-row value (e.g., "1 / 2").
   * @attr row
   */
  @property({ reflect: true })
  row: string | undefined;

  /**
   * Column span shorthand — equivalent to setting `column: "span N"`.
   * @attr span
   */
  @property({ type: Number, reflect: true })
  span: number | undefined;

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('column') || changed.has('row') || changed.has('span')) {
      this._applyHostGridStyles();
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._applyHostGridStyles();
  }

  private _applyHostGridStyles(): void {
    if (this.column) {
      this.style.gridColumn = this.column;
    } else if (this.span !== undefined) {
      this.style.gridColumn = `span ${this.span}`;
    } else {
      this.style.gridColumn = '';
    }
    if (this.row) {
      this.style.gridRow = this.row;
    } else {
      this.style.gridRow = '';
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hx-grid': HelixGrid;
    'hx-grid-item': HelixGridItem;
  }
}
