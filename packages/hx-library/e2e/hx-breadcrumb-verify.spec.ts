/**
 * Temporary verification test for hx-breadcrumb new features.
 * Delete after verification.
 */
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distIndex = path.resolve(
  __dirname,
  '../dist/index.js',
);

test.describe('hx-breadcrumb — feature verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <script type="module" src="${distIndex}"></script>
        </head>
        <body>
          <hx-breadcrumb id="bc" label="Breadcrumb">
            <hx-breadcrumb-item href="/home">Home</hx-breadcrumb-item>
            <hx-breadcrumb-item href="/dept">Department</hx-breadcrumb-item>
            <hx-breadcrumb-item href="/dept/div">Division</hx-breadcrumb-item>
            <hx-breadcrumb-item href="/dept/div/patient">Patient</hx-breadcrumb-item>
            <hx-breadcrumb-item>Records</hx-breadcrumb-item>
          </hx-breadcrumb>
        </body>
      </html>
    `, { waitUntil: 'networkidle' });
    // Wait for custom elements to upgrade
    await page.waitForFunction(() => customElements.get('hx-breadcrumb') !== undefined);
    await page.waitForTimeout(100);
  });

  test('nav has aria-label', async ({ page }) => {
    const nav = page.locator('hx-breadcrumb').first();
    const shadowNav = await nav.evaluateHandle((el) => el.shadowRoot?.querySelector('[part="nav"]'));
    const label = await page.evaluate((el) => el?.getAttribute('aria-label'), shadowNav);
    expect(label).toBe('Breadcrumb');
  });

  test('last item has aria-current="page"', async ({ page }) => {
    const lastItem = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('hx-breadcrumb-item'));
      return items[items.length - 1]?.getAttribute('aria-current');
    });
    expect(lastItem).toBe('page');
  });

  test('hx-breadcrumb-item exposes part="item"', async ({ page }) => {
    const hasPart = await page.evaluate(() => {
      const item = document.querySelector('hx-breadcrumb-item[href="/home"]');
      return item?.shadowRoot?.querySelector('[part="item"]') !== null;
    });
    expect(hasPart).toBe(true);
  });

  test('hx-breadcrumb-item exposes part="separator"', async ({ page }) => {
    const hasPart = await page.evaluate(() => {
      const item = document.querySelector('hx-breadcrumb-item[href="/home"]');
      return item?.shadowRoot?.querySelector('[part="separator"]') !== null;
    });
    expect(hasPart).toBe(true);
  });

  test('maxItems collapses middle items', async ({ page }) => {
    await page.evaluate(() => {
      const bc = document.getElementById('bc') as HTMLElement & { maxItems: number };
      bc.maxItems = 3;
    });
    await page.waitForTimeout(100);

    const hiddenCount = await page.evaluate(() => {
      return document.querySelectorAll('hx-breadcrumb-item[data-bc-hidden]').length;
    });
    expect(hiddenCount).toBeGreaterThan(0);
  });

  test('maxItems shows ellipsis element', async ({ page }) => {
    await page.evaluate(() => {
      const bc = document.getElementById('bc') as HTMLElement & { maxItems: number };
      bc.maxItems = 3;
    });
    await page.waitForTimeout(100);

    const ellipsisExists = await page.evaluate(() => {
      return document.querySelector('hx-breadcrumb-item.hx-bc-ellipsis') !== null;
    });
    expect(ellipsisExists).toBe(true);
  });

  test('json-ld attribute injects script into document head', async ({ page }) => {
    await page.evaluate(() => {
      const bc = document.getElementById('bc') as HTMLElement;
      bc.setAttribute('json-ld', '');
    });
    await page.waitForTimeout(100);

    const scriptExists = await page.evaluate(() => {
      const script = document.head.querySelector('script[data-hx-breadcrumb]');
      return script !== null && script.type === 'application/ld+json';
    });
    expect(scriptExists).toBe(true);
  });

  test('json-ld contains BreadcrumbList schema', async ({ page }) => {
    await page.evaluate(() => {
      const bc = document.getElementById('bc') as HTMLElement;
      bc.setAttribute('json-ld', '');
    });
    await page.waitForTimeout(100);

    const schema = await page.evaluate(() => {
      const script = document.head.querySelector('script[data-hx-breadcrumb]');
      return script ? JSON.parse(script.textContent ?? '{}') : null;
    });
    expect(schema?.['@type']).toBe('BreadcrumbList');
    expect(schema?.itemListElement).toHaveLength(5);
  });

  test('separator slot updates CSS custom property', async ({ page }) => {
    await page.evaluate(() => {
      const bc = document.getElementById('bc') as HTMLElement;
      const sep = document.createElement('span');
      sep.slot = 'separator';
      sep.textContent = '>';
      bc.appendChild(sep);
    });
    await page.waitForTimeout(100);

    const propValue = await page.evaluate(() => {
      const bc = document.getElementById('bc') as HTMLElement;
      return bc.style.getPropertyValue('--hx-breadcrumb-separator-content');
    });
    expect(propValue).toBe('">"');
  });
});
