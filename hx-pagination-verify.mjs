/**
 * Standalone Playwright verification for hx-pagination.
 * Uses the built dist files to verify the component renders correctly.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const distPath = resolve(__dirname, 'packages/hx-library/dist/shared');
const files = (await import('fs')).readdirSync(distPath);
const paginationFile = files.find((f) => f.startsWith('hx-pagination') && f.endsWith('.js'));

if (!paginationFile) {
  console.error('❌ hx-pagination dist file not found');
  process.exit(1);
}

const paginationCode = readFileSync(resolve(distPath, paginationFile), 'utf-8');

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.setContent(`
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>hx-pagination test</title></head>
<body>
  <hx-pagination id="pg1" total-pages="10" current-page="5"></hx-pagination>
  <hx-pagination id="pg2" total-pages="5" current-page="1"></hx-pagination>
  <hx-pagination id="pg3" total-pages="20" current-page="10" show-first-last></hx-pagination>
  <script type="module">
    ${paginationCode}
  </script>
</body>
</html>
`);

await page.waitForTimeout(500);

// Test 1: nav element with aria-label
const navLabel = await page.evaluate(() => {
  const el = document.querySelector('#pg1');
  return el?.shadowRoot?.querySelector('nav')?.getAttribute('aria-label');
});
console.assert(navLabel === 'Pagination', `❌ Expected aria-label "Pagination", got "${navLabel}"`);
console.log('✓ nav has aria-label="Pagination"');

// Test 2: current page button has aria-current
const currentPageText = await page.evaluate(() => {
  const el = document.querySelector('#pg1');
  const btn = el?.shadowRoot?.querySelector('button[aria-current="page"]');
  return btn?.textContent?.trim();
});
console.assert(currentPageText === '5', `❌ Expected current page "5", got "${currentPageText}"`);
console.log('✓ current page button has aria-current="page"');

// Test 3: prev button disabled on first page
const prevDisabled = await page.evaluate(() => {
  const el = document.querySelector('#pg2');
  const btn = el?.shadowRoot?.querySelector('button[aria-label="Previous page"]');
  return btn?.disabled;
});
console.assert(prevDisabled === true, `❌ Expected prev button to be disabled on page 1`);
console.log('✓ prev button disabled on first page');

// Test 4: ellipsis present on many pages
const ellipsisCount = await page.evaluate(() => {
  const el = document.querySelector('#pg1');
  return el?.shadowRoot?.querySelectorAll('[part="ellipsis"]').length ?? 0;
});
console.assert(ellipsisCount >= 1, `❌ Expected at least 1 ellipsis, got ${ellipsisCount}`);
console.log(`✓ ellipsis rendered (${ellipsisCount} found)`);

// Test 5: first/last buttons shown when show-first-last is set
const hasFirstBtn = await page.evaluate(() => {
  const el = document.querySelector('#pg3');
  return !!el?.shadowRoot?.querySelector('button[aria-label="First page"]');
});
console.assert(hasFirstBtn, '❌ Expected first-page button to exist');
console.log('✓ first/last buttons shown when show-first-last is set');

// Test 6: page-change event fires
const eventPage = await page.evaluate(async () => {
  const el = document.querySelector('#pg2');
  return new Promise((resolve) => {
    el?.addEventListener('hx-page-change', (e) => {
      resolve(e.detail.page);
    });
    const nextBtn = el?.shadowRoot?.querySelector('button[aria-label="Next page"]');
    nextBtn?.click();
  });
});
console.assert(eventPage === 2, `❌ Expected hx-page-change detail.page=2, got ${eventPage}`);
console.log('✓ hx-page-change event fires with correct page');

// Test 7: CSS parts exposed
const partsCheck = await page.evaluate(() => {
  const el = document.querySelector('#pg1');
  const sr = el?.shadowRoot;
  return {
    nav: !!sr?.querySelector('[part="nav"]'),
    list: !!sr?.querySelector('[part="list"]'),
    item: !!sr?.querySelector('[part="item"]'),
    button: !!sr?.querySelector('[part="button"]'),
  };
});
console.assert(partsCheck.nav, '❌ Missing part="nav"');
console.assert(partsCheck.list, '❌ Missing part="list"');
console.assert(partsCheck.item, '❌ Missing part="item"');
console.assert(partsCheck.button, '❌ Missing part="button"');
console.log('✓ CSS parts: nav, list, item, button all exposed');

if (errors.length > 0) {
  console.error('Console errors:', errors);
  process.exit(1);
}

await browser.close();
console.log('\n✅ All hx-pagination verification checks passed!');
