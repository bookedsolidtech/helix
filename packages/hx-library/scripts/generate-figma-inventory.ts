#!/usr/bin/env tsx
/**
 * Generate packages/hx-library/figma-inventory.json from the committed CEM.
 *
 * Usage:
 *   tsx scripts/generate-figma-inventory.ts          # write inventory
 *   tsx scripts/generate-figma-inventory.ts --check  # verify inventory matches (CI gate)
 *
 * Contract: ../docs/figma-build-spec.md §3–§11 (authoritative).
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildComponentEntry,
  extractHxTagsFromSource,
  hipaaDetectors,
  truncateDescription,
  type Cem,
  type CemDeclaration,
  type CemModule,
  type ComponentEntry,
  type ExclusionDetail,
  type Inventory,
  type Tier,
} from './lib/extractor.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, '..'); // packages/hx-library
const REPO_ROOT = resolve(PKG_ROOT, '../..');
const CEM_PATH = join(PKG_ROOT, 'custom-elements.json');
const OUT_PATH = join(PKG_ROOT, 'figma-inventory.json');
const TIER_OVERRIDES_PATH = join(PKG_ROOT, 'figma-tier-overrides.json');
const HX_LIBRARY_PKG_JSON = join(PKG_ROOT, 'package.json');
const HX_TOKENS_PKG_JSON = join(REPO_ROOT, 'packages/hx-tokens/package.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function readPkgVersion(pkgJsonPath: string): string {
  try {
    const pkg = readJson<{ version?: string }>(pkgJsonPath);
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function stableStringify(value: Inventory): string {
  // Our output is already deterministic (explicit sort + stable iteration);
  // JSON.stringify with indent 2 + trailing newline matches the committed shape.
  return JSON.stringify(value, null, 2) + '\n';
}

function loadTierOverrides(): Record<string, Tier> {
  if (!existsSync(TIER_OVERRIDES_PATH)) return {};
  try {
    const raw = readJson<Record<string, string>>(TIER_OVERRIDES_PATH);
    const out: Record<string, Tier> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith('_')) continue;
      if (value === 'atom' || value === 'molecule' || value === 'organism') {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// CEM walk
// ---------------------------------------------------------------------------

function iterModules(cem: Cem): CemModule[] {
  return (cem.modules ?? []).filter((m) => m.path?.startsWith('src/components/'));
}

function resolveComponentSourcePath(mod: CemModule): string {
  return join(PKG_ROOT, mod.path);
}

function readComponentSource(mod: CemModule): string {
  const sourcePath = resolveComponentSourcePath(mod);
  if (!existsSync(sourcePath)) return '';
  try {
    return readFileSync(sourcePath, 'utf8');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

interface BuildResult {
  inventory: Inventory;
  warnings: string[];
}

export function buildInventory(): BuildResult {
  const warnings: string[] = [];
  const cem = readJson<Cem>(CEM_PATH);
  if (cem.schemaVersion && cem.schemaVersion !== '1.0.0') {
    warnings.push(`Unexpected CEM schemaVersion: ${cem.schemaVersion}`);
  }

  const tierOverrides = loadTierOverrides();
  const components: ComponentEntry[] = [];
  const excluded: ExclusionDetail[] = [];

  for (const mod of iterModules(cem)) {
    for (const decl of mod.declarations ?? []) {
      if (decl.kind !== 'class') continue;
      if (!decl.tagName || !decl.tagName.startsWith('hx-')) continue;

      const hits = hipaaDetectors(decl as CemDeclaration, mod.path);
      if (hits.length > 0) {
        excluded.push({
          tag: decl.tagName,
          reason: 'hipaa-adjacent',
          policy: 'never-in-figma',
          detectedBy: hits,
          cemPath: mod.path,
          guidance:
            'Represent as a placeholder rectangle labeled "PHI field (code-only)" in compositions. Never create a Figma Component for this tag.',
        });
        continue;
      }

      // Pending-review default-deny (§5.6):
      // if description is empty AND there are no attributes at all, mark for review.
      const description = decl.description ?? '';
      const attrs = decl.attributes ?? [];
      if (!description.trim() && attrs.length === 0) {
        excluded.push({
          tag: decl.tagName,
          reason: 'pending-review',
          policy: 'review-required',
          detectedBy: ['empty-cem-surface'],
          cemPath: mod.path,
          guidance:
            'Description and attributes are empty; confirm intended Figma treatment before enabling.',
        });
        continue;
      }

      const source = readComponentSource(mod);
      const templateDependencies = source ? extractHxTagsFromSource(source, decl.tagName) : [];

      const entry = buildComponentEntry({
        decl: decl as CemDeclaration,
        module: mod,
        templateDependencies,
        tierOverride: tierOverrides[decl.tagName],
      });
      components.push(entry);
    }
  }

  // Deterministic sort: components alphabetical by tag.
  components.sort((a, b) => a.tag.localeCompare(b.tag));
  excluded.sort((a, b) => a.tag.localeCompare(b.tag));

  // Truncate description again just to be safe (builder already does).
  for (const c of components) {
    c.description = truncateDescription(c.description);
  }

  // Resolve tokens version via workspace package.
  const helixVersion = readPkgVersion(HX_LIBRARY_PKG_JSON);
  const tokensVersion = readPkgVersion(HX_TOKENS_PKG_JSON);

  const inventory: Inventory = {
    schemaVersion: '1.0.0',
    generatedAt: '1970-01-01T00:00:00.000Z', // overwritten below in non-check runs
    sourceCem: 'custom-elements.json',
    helixVersion,
    tokensVersion,
    components,
    excluded,
  };

  return { inventory, warnings };
}

// ---------------------------------------------------------------------------
// Check / write modes
// ---------------------------------------------------------------------------

/**
 * Normalize for comparison — ignore generatedAt (volatile) so `--check` stays
 * deterministic across clock differences.
 */
function normalizeForCompare(inv: Inventory): Inventory {
  return { ...inv, generatedAt: '' };
}

function freezeGeneratedAt(inv: Inventory): Inventory {
  // Use a stable commit-ordered timestamp when possible, else now().
  return { ...inv, generatedAt: new Date().toISOString() };
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const isCheck = args.has('--check');

  if (!existsSync(CEM_PATH)) {
    console.error(
      `CEM not found at ${CEM_PATH}. Run \`pnpm --filter=@helixui/library run cem\` first.`,
    );
    process.exit(1);
  }

  const { inventory, warnings } = buildInventory();
  for (const w of warnings) console.warn(`[warn] ${w}`);

  if (isCheck) {
    if (!existsSync(OUT_PATH)) {
      console.error(
        `figma-inventory.json missing at ${OUT_PATH}; run \`figma:inventory\` to generate.`,
      );
      process.exit(1);
    }
    const committed = readJson<Inventory>(OUT_PATH);
    const a = stableStringify(normalizeForCompare(committed));
    const b = stableStringify(normalizeForCompare(inventory));
    if (a !== b) {
      console.error('figma-inventory.json is stale relative to the current CEM.');
      console.error(
        'Run `pnpm --filter=@helixui/library run figma:inventory` and commit the result.',
      );
      process.exit(1);
    }
    console.log(
      `figma-inventory.json is current: ${inventory.components.length} components, ${inventory.excluded.length} excluded.`,
    );
    return;
  }

  const finalInv = freezeGeneratedAt(inventory);
  writeFileSync(OUT_PATH, stableStringify(finalInv), 'utf8');
  console.log(
    `Wrote ${OUT_PATH} — ${finalInv.components.length} components, ${finalInv.excluded.length} excluded.`,
  );
}

// Run when invoked directly (not when imported for tests).
const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (invokedDirectly) {
  main();
}
