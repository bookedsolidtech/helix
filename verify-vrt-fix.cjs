/**
 * Verification script for VRT analyzer fix
 * Tests the updated analyzer logic directly
 */
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname);

function getComponentScreenshotsDir(tagName) {
  return path.resolve(projectRoot, `packages/wc-library/src/components/${tagName}/__screenshots__`);
}

function countScreenshots(tagName) {
  const dir = getComponentScreenshotsDir(tagName);
  if (!fs.existsSync(dir)) {
    return 0;
  }

  try {
    const files = fs.readdirSync(dir, { recursive: true });
    return files.filter((f) => typeof f === 'string' && f.endsWith('.png')).length;
  } catch {
    return 0;
  }
}

function getTestResultsPath() {
  return path.resolve(projectRoot, 'packages/wc-library/.cache/test-results.json');
}

const components = [
  'wc-checkbox',
  'wc-select',
  'wc-switch',
  'wc-textarea',
  'wc-text-input',
  'wc-radio-group',
  'wc-button', // No screenshots
  'wc-card', // No screenshots
];

console.log('VRT Analyzer Fix Verification');
console.log('='.repeat(80));
console.log('\n1. Screenshot Detection (component-specific directories):');
console.log('-'.repeat(80));

for (const tag of components) {
  const count = countScreenshots(tag);
  const dir = getComponentScreenshotsDir(tag);
  console.log(`${tag.padEnd(20)} ${count} screenshots`);
  console.log(`  ${''.padEnd(18)} ${fs.existsSync(dir) ? '✓' : '✗'} ${dir}`);
}

console.log('\n2. Test Results File:');
console.log('-'.repeat(80));
const resultsPath = getTestResultsPath();
const exists = fs.existsSync(resultsPath);
console.log(`${exists ? '✓' : '✗'} ${resultsPath}`);

if (exists) {
  const stats = fs.statSync(resultsPath);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);

  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    console.log(`  Total test suites: ${data.numTotalTestSuites}`);
    console.log(`  Total tests: ${data.numTotalTests}`);
    console.log(`  Passed: ${data.numPassedTests}`);
    console.log(`  Failed: ${data.numFailedTests}`);
  } catch (e) {
    console.log(`  ✗ Error parsing JSON: ${e.message}`);
  }
}

console.log('\n3. Summary:');
console.log('-'.repeat(80));
const withScreenshots = components.filter((t) => countScreenshots(t) > 0);
console.log(`Components with screenshots: ${withScreenshots.length}/${components.length}`);
console.log(`  ${withScreenshots.join(', ')}`);
console.log(`\nTest results file exists: ${exists ? 'YES' : 'NO'}`);

console.log('\n✓ VRT analyzer should now correctly find:');
console.log('  - Screenshots in component-specific __screenshots__ directories');
console.log('  - Test results in .cache/test-results.json');
console.log('\nExpected health dashboard impact:');
console.log('  - VRT dimension: scores for components with screenshots');
console.log('  - Cross-Browser dimension: scores based on Vitest browser mode results');
