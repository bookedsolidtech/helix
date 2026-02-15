import { css } from 'lit';
import { tokenEntries } from './index.js';

/** Lit CSSResult with all tokens as :host custom properties (Shadow DOM compatible) */
export const tokenStyles = css([
  `:host {\n${tokenEntries.map(t => `  ${t.name}: ${t.value};`).join('\n')}\n}`,
] as unknown as TemplateStringsArray);
