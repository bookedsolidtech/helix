/**
 * Bundle Size Analyzer.
 * Measures per-component output size from the Vite library build.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

export interface BundleSizeResult {
  tagName: string;
  score: number;
  rawBytes: number;
  gzipBytes: number;
  budgetBytes: number;
  underBudget: boolean;
  detail: string;
}

const BUDGET_BYTES = 5120; // 5KB gzipped per component

function getLibraryRoot(): string {
  return resolve(process.cwd(), '../../packages/hx-library');
}

function findComponentChunk(tagName: string): string | null {
  const distShared = resolve(getLibraryRoot(), 'dist/shared');
  try {
    const files = readdirSync(distShared);
    const chunkName = files.find(
      (f) => f.startsWith(tagName) && f.endsWith('.js') && !f.endsWith('.js.map'),
    );
    return chunkName ? resolve(distShared, chunkName) : null;
  } catch {
    return null;
  }
}

export function analyzeBundleSize(tagName: string): BundleSizeResult | null {
  const chunkPath = findComponentChunk(tagName);
  if (!chunkPath) return null;

  const content = readFileSync(chunkPath, 'utf-8');
  const rawBytes = statSync(chunkPath).size;
  const gzipBytes = gzipSync(content, { level: 9 }).length;

  const underBudget = gzipBytes <= BUDGET_BYTES;

  // Score: 100 if under budget, linear decay to 0 at 2x budget
  let score: number;
  if (gzipBytes <= BUDGET_BYTES) {
    score = 100;
  } else if (gzipBytes >= BUDGET_BYTES * 2) {
    score = 0;
  } else {
    score = Math.round(100 * (1 - (gzipBytes - BUDGET_BYTES) / BUDGET_BYTES));
  }

  const rawKB = (rawBytes / 1024).toFixed(1);
  const gzipKB = (gzipBytes / 1024).toFixed(1);
  const budgetKB = (BUDGET_BYTES / 1024).toFixed(1);

  return {
    tagName,
    score,
    rawBytes,
    gzipBytes,
    budgetBytes: BUDGET_BYTES,
    underBudget,
    detail: `${gzipKB}KB gzip (${rawKB}KB raw) — budget ${budgetKB}KB`,
  };
}
