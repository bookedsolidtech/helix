#!/usr/bin/env node
/**
 * Download official technology logos
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logosDir = path.join(__dirname, '../apps/docs/public/logos');

// Ensure logos directory exists
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const logos = [
  {
    name: 'lit.svg',
    url: 'https://raw.githubusercontent.com/lit/lit.dev/main/packages/lit-dev-content/site/images/flame-favicon.svg',
  },
  {
    name: 'storybook.svg',
    url: 'https://raw.githubusercontent.com/storybookjs/brand/main/icon/icon-storybook-default.svg',
  },
  {
    name: 'vitest.svg',
    url: 'https://raw.githubusercontent.com/vitest-dev/vitest/main/docs/public/logo.svg',
  },
  {
    name: 'astro.svg',
    url: 'https://astro.build/assets/press/astro-icon-light.svg',
  },
  {
    name: 'typescript.svg',
    url: 'https://www.vectorlogo.zone/logos/typescriptlang/typescriptlang-icon.svg',
  },
  {
    name: 'drupal.svg',
    url: 'https://www.vectorlogo.zone/logos/drupal/drupal-icon.svg',
  },
  {
    name: 'turborepo.svg',
    url: 'https://cdn.simpleicons.org/turborepo',
  },
  {
    name: 'npm.svg',
    url: 'https://www.vectorlogo.zone/logos/npmjs/npmjs-icon.svg',
  },
];

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, dest).then(resolve).catch(reject);
            return;
          }
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function downloadAllLogos() {
  console.log('📥 Downloading official technology logos...\n');

  for (const logo of logos) {
    const dest = path.join(logosDir, logo.name);
    try {
      await downloadFile(logo.url, dest);
      console.log(`✓ Downloaded ${logo.name}`);
    } catch (error) {
      console.error(`✗ Failed to download ${logo.name}:`, error);
    }
  }

  console.log('\n✅ Logo download complete!');
}

downloadAllLogos().catch(console.error);
