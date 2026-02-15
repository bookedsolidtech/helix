import { tokenEntries } from './index.js';

/** Complete CSS with all tokens as :root custom properties */
export const tokensCSS: string = `:root {\n${
  tokenEntries.map(t => `  ${t.name}: ${t.value};`).join('\n')
}\n}\n`;
