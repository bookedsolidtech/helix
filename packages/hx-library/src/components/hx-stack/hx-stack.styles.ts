import { css } from 'lit';

export const helixStackStyles = css`
  :host {
    display: block;
  }

  :host([inline]) {
    display: inline-block;
  }

  [part='base'] {
    display: flex;
    flex-direction: column;
    gap: var(--hx-spacing-md, 1rem);
  }

  /* ─── Direction ─── */

  :host([direction='horizontal']) [part='base'] {
    flex-direction: row;
  }

  :host([direction='vertical']) [part='base'] {
    flex-direction: column;
  }

  /* ─── Wrap ─── */

  :host([wrap]) [part='base'] {
    flex-wrap: wrap;
  }

  /* ─── Alignment ─── */

  :host([align='start']) [part='base'] {
    align-items: flex-start;
  }

  :host([align='center']) [part='base'] {
    align-items: center;
  }

  :host([align='end']) [part='base'] {
    align-items: flex-end;
  }

  :host([align='stretch']) [part='base'] {
    align-items: stretch;
  }

  :host([align='baseline']) [part='base'] {
    align-items: baseline;
  }

  /* ─── Justify ─── */

  :host([justify='start']) [part='base'] {
    justify-content: flex-start;
  }

  :host([justify='center']) [part='base'] {
    justify-content: center;
  }

  :host([justify='end']) [part='base'] {
    justify-content: flex-end;
  }

  :host([justify='between']) [part='base'] {
    justify-content: space-between;
  }

  :host([justify='around']) [part='base'] {
    justify-content: space-around;
  }

  :host([justify='evenly']) [part='base'] {
    justify-content: space-evenly;
  }

  /* ─── Gap ─── */

  :host([gap='none']) [part='base'] {
    gap: 0;
  }

  :host([gap='xs']) [part='base'] {
    gap: var(--hx-spacing-xs, 0.25rem);
  }

  :host([gap='sm']) [part='base'] {
    gap: var(--hx-spacing-sm, 0.5rem);
  }

  :host([gap='md']) [part='base'] {
    gap: var(--hx-spacing-md, 1rem);
  }

  :host([gap='lg']) [part='base'] {
    gap: var(--hx-spacing-lg, 1.5rem);
  }

  :host([gap='xl']) [part='base'] {
    gap: var(--hx-spacing-xl, 2rem);
  }
`;
