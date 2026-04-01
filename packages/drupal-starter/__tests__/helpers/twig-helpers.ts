/**
 * Shared Twig file-system helpers for drupal-starter integration tests.
 *
 * Extracted to avoid duplicating file-walking logic across test files.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Collect all `.twig` / `.html.twig` files under `dir`, recursively.
 */
export function collectTwigFiles(dir: string): string[] {
  const results: string[] = [];
  function walk(current: string): void {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry.endsWith('.twig')) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}
