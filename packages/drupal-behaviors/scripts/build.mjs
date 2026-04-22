/**
 * Build script for @helixui/drupal-behaviors.
 *
 * The source files are plain JavaScript IIFEs that depend on the Drupal and
 * once() globals at runtime — they cannot be processed by tsc or Vite without
 * losing their IIFE structure. This script:
 *
 *   1. Cleans dist/
 *   2. Copies src/index.js  → dist/index.js  (combined bundle)
 *   3. Copies src/behaviors/*.js → dist/behaviors/*.js (individual files)
 *   4. Copies src/index.d.ts → dist/index.d.ts (hand-authored type declarations)
 *
 * The hand-authored src/index.d.ts is the canonical type surface for this
 * package. Drupal consumers load these files via libraries.yml, not via ES
 * module imports, so no bundling step is required.
 */

import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

async function build() {
  // 1. Clean dist/
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await mkdir(join(dist, 'behaviors'), { recursive: true });

  // 2. Copy src/index.js → dist/index.js
  await copyFile(join(src, 'index.js'), join(dist, 'index.js'));
  console.log('  copied src/index.js → dist/index.js');

  // 3. Copy src/index.d.ts → dist/index.d.ts
  await copyFile(join(src, 'index.d.ts'), join(dist, 'index.d.ts'));
  console.log('  copied src/index.d.ts → dist/index.d.ts');

  // 4. Copy individual behavior files
  const behaviors = await readdir(join(src, 'behaviors'));
  for (const file of behaviors) {
    if (file.endsWith('.js')) {
      await copyFile(join(src, 'behaviors', file), join(dist, 'behaviors', file));
      console.log(`  copied src/behaviors/${file} → dist/behaviors/${file}`);
    }
  }

  console.log('\n@helixui/drupal-behaviors build complete.');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
