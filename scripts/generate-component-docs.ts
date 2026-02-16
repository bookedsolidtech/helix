#!/usr/bin/env tsx
/**
 * Generate Starlight MDX documentation pages from Custom Elements Manifest (CEM).
 *
 * Reads packages/hx-library/custom-elements.json and generates MDX files at
 * apps/docs/src/content/docs/component-library/{tagName}.mdx
 *
 * Usage:
 *   npm run generate-docs              # create missing docs (skip existing)
 *   npm run generate-docs -- --dry-run # preview without writing files
 *   npm run generate-docs -- --force   # overwrite existing docs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

interface ComponentDeclaration {
  kind: 'class';
  name: string;
  tagName?: string;
  description?: string;
  summary?: string;
}

interface Module {
  kind: 'javascript-module';
  path: string;
  declarations?: ComponentDeclaration[];
}

interface CustomElementsManifest {
  schemaVersion: string;
  modules: Module[];
}

interface ComponentInfo {
  tagName: string;
  className: string;
  description: string;
  summary?: string;
}

// ============================================================================
// Paths
// ============================================================================

const REPO_ROOT = path.resolve(__dirname, '..');
const CEM_PATH = path.join(REPO_ROOT, 'packages/hx-library/custom-elements.json');
const DOCS_DIR = path.join(REPO_ROOT, 'apps/docs/src/content/docs/component-library');

// ============================================================================
// MDX Template
// ============================================================================

function generateMDX(component: ComponentInfo): string {
  const title = component.tagName;
  const description =
    component.description || component.summary || `${component.className} component`;

  return `---
title: "${title}"
description: ${description}
---

import ComponentLoader from '../../../components/ComponentLoader.astro';
import ComponentDoc from '../../../components/ComponentDoc.astro';

<ComponentLoader />

<ComponentDoc tagName="${component.tagName}" section="summary" />

## Overview

${description}

## API Reference

<ComponentDoc tagName="${component.tagName}" section="api" />
`;
}

// ============================================================================
// CEM Parser
// ============================================================================

function extractComponentsFromCEM(cemPath: string): ComponentInfo[] {
  if (!fs.existsSync(cemPath)) {
    console.error(`❌ CEM file not found at: ${cemPath}`);
    console.error('   Run "npm run cem" to generate it first.');
    process.exit(1);
  }

  const cemContent = fs.readFileSync(cemPath, 'utf-8');
  const cem: CustomElementsManifest = JSON.parse(cemContent);

  const components: ComponentInfo[] = [];

  for (const module of cem.modules) {
    if (!module.declarations) continue;

    for (const declaration of module.declarations) {
      if (declaration.kind === 'class' && declaration.tagName) {
        components.push({
          tagName: declaration.tagName,
          className: declaration.name,
          description: declaration.description || declaration.summary || '',
          summary: declaration.summary,
        });
      }
    }
  }

  return components.sort((a, b) => a.tagName.localeCompare(b.tagName));
}

// ============================================================================
// File Writer
// ============================================================================

function writeComponentDocs(
  components: ComponentInfo[],
  options: { dryRun?: boolean; force?: boolean } = {},
) {
  const { dryRun = false, force = false } = options;
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const component of components) {
    const filePath = path.join(DOCS_DIR, `${component.tagName}.mdx`);
    const mdxContent = generateMDX(component);

    const exists = fs.existsSync(filePath);

    if (dryRun) {
      if (exists && !force) {
        skipped++;
        console.log(
          `⏭️  WOULD SKIP: ${component.tagName}.mdx (already exists, use --force to overwrite)`,
        );
      } else if (exists && force) {
        console.log(`⚠️  WOULD UPDATE: ${component.tagName}.mdx`);
      } else {
        console.log(`✅ WOULD CREATE: ${component.tagName}.mdx`);
      }
      continue;
    }

    // Skip existing files unless --force is used
    if (exists && !force) {
      skipped++;
      console.log(
        `⏭️  Skipped: ${component.tagName}.mdx (already exists, use --force to overwrite)`,
      );
      continue;
    }

    fs.writeFileSync(filePath, mdxContent, 'utf-8');

    if (exists) {
      updated++;
      console.log(`⚠️  Updated: ${component.tagName}.mdx`);
    } else {
      created++;
      console.log(`✅ Created: ${component.tagName}.mdx`);
    }
  }

  if (dryRun) {
    console.log('\n🔍 Dry run completed. No files were written.');
    console.log('   Run without --dry-run to create files.');
  } else {
    console.log(`\n✨ Done!`);
    console.log(`   Created: ${created} files`);
    console.log(`   Updated: ${updated} files`);
    console.log(`   Skipped: ${skipped} files`);
    console.log(`   Total: ${created + updated} component docs`);
  }
}

// ============================================================================
// Main
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log('📚 Generating Starlight component documentation from CEM...\n');

  const components = extractComponentsFromCEM(CEM_PATH);

  console.log(`Found ${components.length} components in CEM:\n`);
  components.forEach((c) => {
    console.log(`   - ${c.tagName} (${c.className})`);
  });
  console.log('');

  if (force) {
    console.log('⚠️  --force flag enabled: will overwrite existing docs\n');
  }

  writeComponentDocs(components, { dryRun, force });
}

main();
