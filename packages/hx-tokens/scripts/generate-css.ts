import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TokenDef {
  value: string;
}

function flatten(
  obj: Record<string, unknown>,
  prefix: string[] = [],
): { name: string; value: string }[] {
  const entries: { name: string; value: string }[] = [];

  for (const [key, val] of Object.entries(obj)) {
    const path = [...prefix, key];
    if (typeof val === 'object' && val !== null && 'value' in val) {
      entries.push({
        name: `--wc-${path.join('-')}`,
        value: (val as TokenDef).value,
      });
    } else if (typeof val === 'object' && val !== null) {
      entries.push(...flatten(val as Record<string, unknown>, path));
    }
  }

  return entries;
}

const jsonPath = resolve(__dirname, '../src/tokens.json');
const tokens = JSON.parse(readFileSync(jsonPath, 'utf-8'));
const entries = flatten(tokens);

const css = `:root {\n${entries.map(t => `  ${t.name}: ${t.value};`).join('\n')}\n}\n`;

const outDir = resolve(__dirname, '../dist');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'tokens.css'), css, 'utf-8');

console.log(`Generated dist/tokens.css (${entries.length} tokens)`);
