#!/usr/bin/env node
/**
 * Debug script to test the health scorer with live data
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Simulate process.cwd() being in /apps/admin
const mockCwd = '/Volumes/Development/wc-2026/apps/admin';

function hasDocsPage(tagName) {
  const docsRoot = resolve(mockCwd, "../docs");
  const docsPath = resolve(docsRoot, `src/content/docs/component-library/${tagName}.mdx`);
  console.log(`\nChecking docs for ${tagName}:`);
  console.log(`  docsRoot: ${docsRoot}`);
  console.log(`  docsPath: ${docsPath}`);
  console.log(`  exists: ${existsSync(docsPath)}`);
  return existsSync(docsPath);
}

// Test with some components
const testComponents = ['hx-button', 'hx-card', 'hx-text-input', 'hx-badge', 'hx-select'];

console.log('Testing docs detection:\n');
console.log('='.repeat(60));

for (const component of testComponents) {
  const hasDocs = hasDocsPage(component);
  console.log(`${component}: ${hasDocs ? '✓ FOUND' : '✗ NOT FOUND'}`);
}

console.log('\n' + '='.repeat(60));
console.log('\nSummary:');
console.log(`All components have docs: ${testComponents.every(c => hasDocsPage(c))}`);
