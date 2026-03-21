/**
 * Test script — scaffolds all templates into /tmp/helix-starters/
 * Run with: npx tsx test-scaffold.ts
 */
import { scaffoldProject } from './src/scaffold.js';
import type { ProjectOptions, Framework } from './src/types.js';
import fs from 'fs-extra';
import path from 'node:path';

const TEST_DIR = '/tmp/helix-starters';

const frameworks: Framework[] = [
  'react-next',
  'react-vite',
  'vue-nuxt',
  'vue-vite',
  'svelte-kit',
  'angular',
  'astro',
  'vanilla',
];

async function main() {
  // Clean test directory
  await fs.remove(TEST_DIR);
  await fs.ensureDir(TEST_DIR);

  console.log(`\n🧬 Scaffolding ${frameworks.length} starter kits into ${TEST_DIR}\n`);

  for (const framework of frameworks) {
    const name = `helix-${framework}`;
    const directory = path.join(TEST_DIR, name);

    const options: ProjectOptions = {
      name,
      directory,
      framework,
      componentBundles: ['core', 'forms'],
      typescript: true,
      eslint: true,
      designTokens: true,
      darkMode: true,
      installDeps: false, // Skip install for speed
    };

    console.log(`  📦 ${framework}...`);
    try {
      await scaffoldProject(options);
      const files = await listFiles(directory);
      console.log(`     ✅ ${files.length} files created`);
      for (const f of files) {
        console.log(`        ${f}`);
      }
    } catch (err) {
      console.error(`     ❌ ${(err as Error).message}`);
    }
    console.log();
  }

  console.log('Done! Check:', TEST_DIR);
}

async function listFiles(dir: string, prefix = ''): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...(await listFiles(path.join(dir, entry.name), relative)));
    } else if (entry.isFile()) {
      results.push(relative);
    }
  }
  return results;
}

main().catch(console.error);
