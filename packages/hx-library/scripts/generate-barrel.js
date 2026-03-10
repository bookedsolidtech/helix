#!/usr/bin/env node
/* global console */

// Auto-generates src/index.ts from component directories.
// Scans src/components/<name>/index.ts and re-exportLines everything.
// Eliminates merge conflicts on the barrel file when multiple
// component PRs target main simultaneously.
// Usage: node scripts/generate-barrel.js

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const componentsDir = join(rootDir, 'src', 'components');
const outputFile = join(rootDir, 'src', 'index.ts');

// Scan component directories
const components = readdirSync(componentsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith('hx-'))
  .map((d) => d.name)
  .sort();

// Extract exportLines from each component's index.ts
const exportLines = [];

for (const component of components) {
  const indexPath = join(componentsDir, component, 'index.ts');
  if (!existsSync(indexPath)) continue;

  const content = readFileSync(indexPath, 'utf-8');

  // Match export { Foo } or export { Foo, Bar } patterns
  const exportMatch = content.match(/export\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g);
  if (!exportMatch) continue;

  // Re-export from the component directory
  for (const line of exportMatch) {
    const names = line.match(/export\s*\{([^}]+)\}/)?.[1];
    if (!names) continue;

    const cleanNames = names
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .join(', ');

    exportLines.push(`export { ${cleanNames} } from './components/${component}/index.js';`);
  }
}

// Generate the barrel file
const output = `/**
 * @helixui/library - Enterprise Healthcare Web Component Library
 *
 * Built with Lit 3.x. All components are custom elements that can be used
 * in any framework or vanilla HTML.
 *
 * AUTO-GENERATED — Do not edit manually.
 * Run \`npm run generate:barrel\` to regenerate.
 */

${exportLines.join('\n')}
`;

writeFileSync(outputFile, output);

const count = exportLines.length;
console.log(`Generated src/index.ts with ${count} component exports.`);
