/**
 * HELIX-METADATA CEM analyzer plugin
 *
 * Reads the rich `@helix-*` JSDoc tag schema on component class declarations and
 * emits a structured `helixMeta: {...}` field on the matching class declaration
 * in the Custom Elements Manifest. Supersedes the original `aaa-certified.mjs`
 * plugin while keeping the back-compat `aaaCertified` / `aaaCertifiedDate`
 * top-level fields for consumers reading the 3.5.0 schema.
 *
 * AAA Cert Epic — Phase B.1 (validated-toasting-wand plan).
 *
 * ## Tag schema → helixMeta mapping
 *
 * Accessibility:
 *   `@aaa-certified <date>`             → top-level `aaaCertified: true` +
 *                                         `aaaCertifiedDate: <date>` (back-compat)
 *                                         AND `helixMeta.aaa.certified: true` +
 *                                         `helixMeta.aaa.certifiedDate: <date>`
 *   `@aaa-criteria 1.4.6, 2.1.3, …`     → `helixMeta.aaa.criteria: string[]`
 *   `@aaa-audit <relative-path>`        → `helixMeta.aaa.auditUrl: string`
 *   `@keyboard-contract …`              → `helixMeta.keyboardContract: { activate, navigate, dismiss, disabledSuppresses }`
 *   `@aria-pattern <pattern>`           → `helixMeta.ariaPattern: string`
 *   `@aria-pattern-source <url>`        → `helixMeta.ariaPatternSource: string`
 *   `@forced-colors-supported true|false` → `helixMeta.forcedColorsSupported: boolean`
 *   `@screen-reader-tested NVDA, …`     → `helixMeta.screenReaderTested: string[]`
 *
 * Composition / capability:
 *   `@stability stable|beta|experimental` → `helixMeta.stability: string`
 *   `@since <semver>`                   → `helixMeta.since: string`
 *   `@form-associated true|false`       → `helixMeta.formAssociated: boolean`
 *   `@theme-aware true|false`           → `helixMeta.themeAware: boolean`
 *   `@brand-aware true|false`           → `helixMeta.brandAware: boolean`
 *   `@composes-with <comp1>, <comp2>`   → `helixMeta.composesWith: string[]`
 *
 * Integration:
 *   `@drupal-sdc-eligible true|false`   → `helixMeta.drupalSdcEligible: boolean`
 *   `@react-wrapper-status complete|partial|none` → `helixMeta.reactWrapperStatus: string`
 *   `@figma-component-name <name>`      → `helixMeta.figma.componentName: string`
 *   `@figma-page <page>`                → `helixMeta.figma.page: string`
 *   `@priority-tier P0|P1|P2|exempt`    → `helixMeta.priorityTier: string`
 *                                          (auto-populated from p0-priority-tiers.json
 *                                          when the tag is omitted)
 *
 * Healthcare:
 *   `@phi-handles true|false`           → `helixMeta.phiHandles: boolean`
 *   `@clinical-context high|medium|low|none` → `helixMeta.clinicalContext: string`
 *
 * ## Keyboard contract grammar
 *
 *   `@keyboard-contract activate=Enter,Space; navigate=Arrow; dismiss=Escape; disabled-suppresses=true`
 *
 * Each `;`-delimited segment is `key=value`. The value is comma-split for the
 * known list-valued keys (`activate`, `navigate`, `dismiss`); other keys parse
 * literally. The `disabled-suppresses` key (kebab-case) maps to the
 * `disabledSuppresses: boolean` property in the emitted object.
 *
 * ## Auto-population of priorityTier
 *
 * When a class has no `@priority-tier` tag the plugin reverse-indexes
 * `packages/hx-library/src/p0-priority-tiers.json` by tag name and emits the
 * matching tier (`P0`, `P1`, `P2`, `exempt`). The lookup happens once at module
 * load time; all components in the same `cem` run share the same index.
 *
 * ## Field omission
 *
 * Tags that are absent are NOT emitted as `null` / `false` — they are simply
 * omitted from `helixMeta`. The field set is therefore an opt-in marker per
 * tag, keeping manifest JSON small and making the schema additive over time.
 *
 * Top-level `aaaCertified` / `aaaCertifiedDate` follow the same omission rule
 * to preserve byte-for-byte back-compat with the original `aaa-certified.mjs`
 * plugin output.
 */

import { parse } from 'comment-parser';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Liberal ISO-8601 date matcher: YYYY-MM-DD with optional time. Anything else
// is captured but emitted as a free-form string so we do not reject valid
// future-format certification metadata.
const DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/;

const PRIORITY_TIER_VALUES = new Set(['P0', 'P1', 'P2', 'exempt']);
const STABILITY_VALUES = new Set(['stable', 'beta', 'experimental']);
const REACT_WRAPPER_STATUS_VALUES = new Set(['complete', 'partial', 'none']);
const CLINICAL_CONTEXT_VALUES = new Set(['high', 'medium', 'low', 'none']);

// Tag set the plugin is responsible for. The `aaa-certified` tag is special-
// cased because it ALSO populates the top-level back-compat fields.
const HANDLED_TAGS = new Set([
  'aaa-certified',
  'aaa-criteria',
  'aaa-audit',
  'keyboard-contract',
  'aria-pattern',
  'aria-pattern-source',
  'forced-colors-supported',
  'screen-reader-tested',
  'stability',
  'since',
  'form-associated',
  'theme-aware',
  'brand-aware',
  'composes-with',
  'drupal-sdc-eligible',
  'react-wrapper-status',
  'figma-component-name',
  'figma-page',
  'priority-tier',
  'phi-handles',
  'clinical-context',
]);

// ── Priority-tier index (auto-population fallback) ─────────────────────────

/**
 * Build a tagName → tier reverse index from p0-priority-tiers.json. Returns an
 * empty Map when the JSON file cannot be located or fails to parse so that the
 * plugin still emits all OTHER metadata fields cleanly. Errors are surfaced as
 * `console.warn` so that CI logs flag drift, never as exceptions that abort
 * the manifest build.
 */
function loadPriorityTierIndex() {
  const index = new Map();
  let priorityFilePath;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    priorityFilePath = resolve(here, '..', 'src', 'p0-priority-tiers.json');
  } catch (err) {
    console.warn(`[helix-metadata] could not resolve p0-priority-tiers.json path: ${err.message}`);
    return index;
  }

  if (!existsSync(priorityFilePath)) {
    console.warn(
      `[helix-metadata] p0-priority-tiers.json not found at ${priorityFilePath}; ` +
        `priority-tier auto-population disabled.`,
    );
    return index;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(priorityFilePath, 'utf8'));
  } catch (err) {
    console.warn(
      `[helix-metadata] p0-priority-tiers.json failed to parse (${err.message}); ` +
        `priority-tier auto-population disabled.`,
    );
    return index;
  }

  // Schema: { p0: { components: { <category>: ['hx-foo', …] } }, p1: {…}, p2: {…},
  // exempt: { components: ['hx-foo', …] } }
  for (const tierKey of ['p0', 'p1', 'p2', 'exempt']) {
    const tierLabel = tierKey === 'exempt' ? 'exempt' : tierKey.toUpperCase(); // P0 / P1 / P2 / exempt
    const tierBlock = raw?.[tierKey]?.components;
    if (!tierBlock) continue;
    if (Array.isArray(tierBlock)) {
      for (const tag of tierBlock) {
        if (typeof tag === 'string') index.set(tag, tierLabel);
      }
      continue;
    }
    // Nested categories: { 'form-inputs': ['hx-text-input', …], … }
    for (const category of Object.values(tierBlock)) {
      if (!Array.isArray(category)) continue;
      for (const tag of category) {
        if (typeof tag === 'string') index.set(tag, tierLabel);
      }
    }
  }

  return index;
}

// ── Tag value parsers ──────────────────────────────────────────────────────

function parseList(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBoolean(raw) {
  if (raw === undefined || raw === null) return undefined;
  const v = String(raw).trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

function parseEnum(raw, allowed) {
  if (raw === undefined || raw === null) return undefined;
  const v = String(raw).trim();
  return allowed.has(v) ? v : undefined;
}

/**
 * Parse a `@keyboard-contract` value into `{ activate, navigate, dismiss,
 * disabledSuppresses }`. Returns an empty object when the segment list is
 * empty so callers can detect omission.
 *
 *   "activate=Enter,Space; navigate=Arrow; dismiss=Escape; disabled-suppresses=true"
 *     → { activate: ['Enter', 'Space'], navigate: ['Arrow'], dismiss: ['Escape'],
 *         disabledSuppresses: true }
 */
function parseKeyboardContract(raw) {
  if (!raw) return undefined;
  const out = {};
  const segments = raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const segment of segments) {
    const eqIdx = segment.indexOf('=');
    if (eqIdx === -1) continue;
    const key = segment.slice(0, eqIdx).trim();
    const value = segment.slice(eqIdx + 1).trim();
    if (!key) continue;

    if (key === 'disabled-suppresses') {
      const b = parseBoolean(value);
      if (b !== undefined) out.disabledSuppresses = b;
      continue;
    }
    if (key === 'activate' || key === 'navigate' || key === 'dismiss') {
      out[key] = parseList(value);
      continue;
    }
    // Unknown key — preserve verbatim so future contract keys flow through
    // without a plugin update. Camel-case the kebab key for JS ergonomics.
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

// ── Tag-block extraction helpers ────────────────────────────────────────────

/**
 * Pull every relevant tag out of a class's JSDoc blocks into a flat
 * `{ tag, value }[]` shape. The same tag may appear multiple times (rare, but
 * not rejected — last-write-wins semantics in the assembly step).
 *
 * comment-parser splits the value across `tag.name` (first whitespace-
 * separated token) and `tag.description` (everything after); we re-join with a
 * single space so multi-token values like `1.4.6, 2.1.3, 2.4.13` survive.
 */
function extractTagsFromJsDoc(jsDocBlocks) {
  const out = [];
  if (!Array.isArray(jsDocBlocks) || jsDocBlocks.length === 0) return out;

  for (const jsDoc of jsDocBlocks) {
    const fullText = jsDoc?.getFullText?.();
    if (!fullText) continue;
    const parsed = parse(fullText);
    for (const block of parsed) {
      for (const tag of block?.tags ?? []) {
        if (!tag?.tag) continue;
        if (!HANDLED_TAGS.has(tag.tag)) continue;
        const tokens = [tag.name, tag.description]
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean);
        const value = tokens.join(' ').trim();
        out.push({ tag: tag.tag, value });
      }
    }
  }
  return out;
}

/**
 * Assemble the structured `helixMeta` object plus the back-compat top-level
 * `aaaCertified` / `aaaCertifiedDate` from the flat tag list. Returns
 *
 *   { helixMeta, aaaCertified, aaaCertifiedDate }
 *
 * with each field set only when the matching tag was present.
 */
function assembleMetadata(tags, { tagName, priorityTierIndex }) {
  const meta = {};
  let aaaCertified;
  let aaaCertifiedDate;

  // Aggregate AAA fields into a sub-object so consumers can read
  // `helixMeta.aaa.criteria` etc. without null-checking.
  let aaaSub;
  const ensureAaa = () => (aaaSub ??= {});

  // Figma sub-object (componentName + page).
  let figmaSub;
  const ensureFigma = () => (figmaSub ??= {});

  for (const { tag, value } of tags) {
    switch (tag) {
      case 'aaa-certified': {
        aaaCertified = true;
        ensureAaa().certified = true;
        if (value) {
          // Free-form free pass: ISO date OR audit identifier OR version. Same
          // rule as the original plugin to preserve back-compat.
          aaaCertifiedDate = value;
          ensureAaa().certifiedDate = value;
          // DATE_RE is informational — emit as-is regardless of match.
          void DATE_RE;
        }
        break;
      }
      case 'aaa-criteria': {
        const list = parseList(value);
        if (list.length > 0) ensureAaa().criteria = list;
        break;
      }
      case 'aaa-audit': {
        if (value) ensureAaa().auditUrl = value;
        break;
      }
      case 'keyboard-contract': {
        const parsed = parseKeyboardContract(value);
        if (parsed) meta.keyboardContract = parsed;
        break;
      }
      case 'aria-pattern': {
        if (value) meta.ariaPattern = value;
        break;
      }
      case 'aria-pattern-source': {
        if (value) meta.ariaPatternSource = value;
        break;
      }
      case 'forced-colors-supported': {
        const b = parseBoolean(value);
        if (b !== undefined) meta.forcedColorsSupported = b;
        break;
      }
      case 'screen-reader-tested': {
        const list = parseList(value);
        if (list.length > 0) meta.screenReaderTested = list;
        break;
      }
      case 'stability': {
        const v = parseEnum(value, STABILITY_VALUES);
        if (v) meta.stability = v;
        break;
      }
      case 'since': {
        if (value) meta.since = value;
        break;
      }
      case 'form-associated': {
        const b = parseBoolean(value);
        if (b !== undefined) meta.formAssociated = b;
        break;
      }
      case 'theme-aware': {
        const b = parseBoolean(value);
        if (b !== undefined) meta.themeAware = b;
        break;
      }
      case 'brand-aware': {
        const b = parseBoolean(value);
        if (b !== undefined) meta.brandAware = b;
        break;
      }
      case 'composes-with': {
        const list = parseList(value);
        if (list.length > 0) meta.composesWith = list;
        break;
      }
      case 'drupal-sdc-eligible': {
        const b = parseBoolean(value);
        if (b !== undefined) meta.drupalSdcEligible = b;
        break;
      }
      case 'react-wrapper-status': {
        const v = parseEnum(value, REACT_WRAPPER_STATUS_VALUES);
        if (v) meta.reactWrapperStatus = v;
        break;
      }
      case 'figma-component-name': {
        if (value) ensureFigma().componentName = value;
        break;
      }
      case 'figma-page': {
        if (value) ensureFigma().page = value;
        break;
      }
      case 'priority-tier': {
        const v = parseEnum(value, PRIORITY_TIER_VALUES);
        if (v) meta.priorityTier = v;
        break;
      }
      case 'phi-handles': {
        const b = parseBoolean(value);
        if (b !== undefined) meta.phiHandles = b;
        break;
      }
      case 'clinical-context': {
        const v = parseEnum(value, CLINICAL_CONTEXT_VALUES);
        if (v) meta.clinicalContext = v;
        break;
      }
      default:
        // Unreachable — HANDLED_TAGS gate above keeps unknowns out.
        break;
    }
  }

  // Auto-populate priorityTier from the central index when the tag was absent.
  if (!meta.priorityTier && tagName && priorityTierIndex) {
    const fallback = priorityTierIndex.get(tagName);
    if (fallback) meta.priorityTier = fallback;
  }

  if (aaaSub) meta.aaa = aaaSub;
  if (figmaSub) meta.figma = figmaSub;

  const helixMeta = Object.keys(meta).length > 0 ? meta : undefined;
  return { helixMeta, aaaCertified, aaaCertifiedDate };
}

// ── Plugin factory ─────────────────────────────────────────────────────────

/**
 * Plugin entry point. Pass `{ priorityTierIndex }` to inject a pre-built index
 * (used by the unit tests); otherwise the plugin loads it from disk on first
 * call.
 */
export function helixMetadataPlugin(options = {}) {
  let priorityTierIndex = options.priorityTierIndex;

  return {
    name: 'HELIX-METADATA',

    /**
     * analyzePhase runs once per AST node. We watch for class declarations and
     * inspect their attached JSDoc blocks. The matching class declaration in
     * the in-flight `moduleDoc` was already created by the analyzer's CORE
     * plugins (CLASSES, CLASS-JSDOC) earlier in the same phase, so we look it
     * up by name and patch it in place.
     */
    analyzePhase({ ts, node, moduleDoc }) {
      if (node.kind !== ts.SyntaxKind.ClassDeclaration) return;

      const className = node?.name?.getText?.();
      if (!className) return;

      const classDoc = moduleDoc?.declarations?.find(
        (declaration) => declaration.kind === 'class' && declaration.name === className,
      );
      if (!classDoc) return;

      // Lazy-load the index on first hit so the plugin is cheap to construct
      // in tests that pass their own index.
      if (priorityTierIndex === undefined) {
        priorityTierIndex = loadPriorityTierIndex();
      }

      const tags = extractTagsFromJsDoc(node?.jsDoc);

      // Even when no tags are present we still want the priority-tier fallback
      // for P0/P1/P2/exempt members of the canonical roster.
      const { helixMeta, aaaCertified, aaaCertifiedDate } = assembleMetadata(tags, {
        tagName: classDoc.tagName,
        priorityTierIndex,
      });

      if (aaaCertified) classDoc.aaaCertified = true;
      if (aaaCertifiedDate) classDoc.aaaCertifiedDate = aaaCertifiedDate;
      if (helixMeta) classDoc.helixMeta = helixMeta;
    },
  };
}

export default helixMetadataPlugin;

// Test surface: export the pure helpers so the unit suite can exercise them
// without spinning up the analyzer.
export const __test__ = {
  parseList,
  parseBoolean,
  parseEnum,
  parseKeyboardContract,
  assembleMetadata,
  loadPriorityTierIndex,
  HANDLED_TAGS,
  PRIORITY_TIER_VALUES,
  STABILITY_VALUES,
  REACT_WRAPPER_STATUS_VALUES,
  CLINICAL_CONTEXT_VALUES,
};
