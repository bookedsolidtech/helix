/**
 * CEM → figma-inventory.json extractor (pure, deterministic).
 *
 * Contract: packages/hx-library/docs or docs/figma-build-spec.md §3–§11.
 *
 * Intentionally dependency-free (no tsx/vite/lit imports) so it can run as
 * a plain Node script and be unit-tested with a Node-only vitest config.
 */

// ---------------------------------------------------------------------------
// Types (local; keep this file independent from any published .d.ts)
// ---------------------------------------------------------------------------

export interface CemAttribute {
  name: string;
  type?: { text?: string };
  default?: string;
  description?: string;
  fieldName?: string;
  attribute?: string;
}

export interface CemSlot {
  name?: string;
  description?: string;
}

export interface CemCssProperty {
  name: string;
  default?: string;
  description?: string;
}

export interface CemCssPart {
  name: string;
  description?: string;
}

export interface CemEvent {
  name: string;
  description?: string;
}

export interface CemMember {
  kind: string;
  name?: string;
  type?: { text?: string };
  default?: string;
  attribute?: string;
  description?: string;
  reflects?: boolean;
  privacy?: string;
}

export interface CemSuperclass {
  name?: string;
  package?: string;
  module?: string;
}

/**
 * Subset of `helixMeta` that the figma-inventory mirror surfaces. Mirrors
 * the schema emitted by `cem-plugins/helix-metadata.mjs` (Phase B.1) but
 * only carries the fields figgy / Drupal SDC builders / AI agents need at
 * a glance — full parity with helixMeta is intentionally NOT a goal.
 */
export interface CemHelixMetaAaa {
  certified?: boolean;
  certifiedDate?: string;
  criteria?: string[];
  auditUrl?: string;
}

export interface CemHelixMetaKeyboardContract {
  activate?: string[];
  navigate?: string[];
  dismiss?: string[];
  disabledSuppresses?: boolean;
  [key: string]: unknown;
}

export interface CemHelixMeta {
  aaa?: CemHelixMetaAaa;
  keyboardContract?: CemHelixMetaKeyboardContract;
  ariaPattern?: string;
  ariaPatternSource?: string;
  forcedColorsSupported?: boolean;
  screenReaderTested?: string[];
  stability?: string;
  since?: string;
  formAssociated?: boolean;
  themeAware?: boolean;
  brandAware?: boolean;
  composesWith?: string[];
  drupalSdcEligible?: boolean;
  reactWrapperStatus?: string;
  figma?: { componentName?: string; page?: string };
  priorityTier?: string;
  phiHandles?: boolean;
  clinicalContext?: string;
}

export interface CemDeclaration {
  kind: string;
  tagName?: string;
  name?: string;
  description?: string;
  attributes?: CemAttribute[];
  slots?: CemSlot[];
  cssProperties?: CemCssProperty[];
  cssParts?: CemCssPart[];
  events?: CemEvent[];
  members?: CemMember[];
  superclass?: CemSuperclass;
  // Phase B.1 (helix-metadata plugin) — back-compat top-level + structured.
  aaaCertified?: boolean;
  aaaCertifiedDate?: string;
  helixMeta?: CemHelixMeta;
}

export interface CemModule {
  kind?: string;
  path: string;
  declarations?: CemDeclaration[];
}

export interface Cem {
  schemaVersion?: string;
  modules?: CemModule[];
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type VariantAxisType = 'enum' | 'boolean';

export interface VariantAxis {
  figmaAxisName: string;
  cemAttribute: string;
  cemFieldName: string | null;
  type: VariantAxisType;
  values: string[];
  default: string;
}

export interface TextProperty {
  figmaPropertyName: string;
  cemAttribute: string;
  type: 'text';
  defaultValue: string;
  hint?: 'numeric' | 'href';
}

export type SlotSwapType = 'instance-swap';

export interface Slot {
  figmaPropertyName: string;
  cemSlot: string | null;
  type: SlotSwapType;
  default: string | null;
  description?: string;
}

export interface FigmaBinding {
  target:
    | 'Fill'
    | 'Stroke'
    | 'CornerRadius'
    | 'Gap'
    | 'Padding'
    | 'FontSize'
    | 'FontWeight'
    | 'LineHeight'
    | 'Effect'
    | 'Opacity'
    | null;
  layerSelector: string;
  semanticToken: string | null;
  fallbackPrimitive: string | null;
  literalFallback: string | null;
}

export interface ResolvedCssProperty extends CemCssProperty {
  figmaBinding: FigmaBinding | null;
}

export type Tier = 'atom' | 'molecule' | 'organism';

/**
 * Inventory-side mirror of the Phase B.1 helix-metadata fields figgy and
 * downstream consumers care about. A strict subset of the CEM `helixMeta`
 * schema — kept narrow so the inventory stays a "what figma needs"
 * artifact rather than a duplicate of the manifest.
 */
export interface InventoryAaa {
  certified: boolean;
  certifiedDate: string | null;
  criteria: string[];
  auditUrl: string | null;
}

export interface InventoryKeyboardContract {
  activate: string[];
  navigate: string[];
  dismiss: string[];
  disabledSuppresses: boolean | null;
}

export interface ComponentEntry {
  tag: string;
  className: string;
  modulePath: string;
  figmaEligible: true;
  figmaComponentName: string;
  figmaPagePlacement: '4a';
  description: string;
  tier: Tier;
  variantAxes: VariantAxis[];
  textProperties: TextProperty[];
  slots: Slot[];
  cssParts: CemCssPart[];
  events: CemEvent[];
  cssProperties: ResolvedCssProperty[];
  dependsOn: string[];
  excludedAttributes: string[];
  // ── Phase B helix-metadata mirror ─────────────────────────────────────
  // Always emitted. Fields fall back to neutral defaults when the source
  // CEM declaration carries no helixMeta block (e.g. legacy components
  // before the cert sweep populates them) so the inventory schema stays
  // stable for figgy.
  aaa: InventoryAaa;
  keyboardContract: InventoryKeyboardContract | null;
  ariaPattern: string | null;
  themeAware: boolean | null;
  brandAware: boolean | null;
  formAssociated: boolean | null;
  priorityTier: string | null;
}

export interface ExclusionDetail {
  tag: string;
  reason: 'hipaa-adjacent' | 'pending-review';
  policy: 'never-in-figma' | 'review-required';
  detectedBy: string[];
  cemPath?: string;
  guidance?: string;
}

export interface Inventory {
  schemaVersion: '1.0.0';
  generatedAt: string;
  sourceCem: string;
  helixVersion: string;
  tokensVersion: string;
  components: ComponentEntry[];
  excluded: ExclusionDetail[];
}

// ---------------------------------------------------------------------------
// §5 — HIPAA exclusion
// ---------------------------------------------------------------------------

const HIPAA_TAG_REGEX = /(phi|pii|protected|sensitive)/i;
const HIPAA_ATTR_REGEX = /(phi|pii|ssn|mrn|dob|insurance|protected)/i;
const PHI_ENUM_TOKEN_REGEX = /^(ssn|mrn|dob|insurance)$/i;
const HIPAA_DIR_REGEX = /(phi|protected|sensitive)/i;

/**
 * Returns the list of detection signals hit, or empty if the component is clean.
 */
export function hipaaDetectors(decl: CemDeclaration, modulePath: string): string[] {
  const hits: string[] = [];
  const tag = decl.tagName ?? '';

  // §5.1 tag regex
  if (HIPAA_TAG_REGEX.test(tag)) {
    hits.push('tag-regex');
  }

  // §5.2 JSDoc marker (prospective — checks description for @hipaa)
  const desc = decl.description ?? '';
  if (/@hipaa/i.test(desc)) {
    hits.push('jsdoc-hipaa-marker');
  }

  // §5.3 attribute-surface signals
  const attrs = decl.attributes ?? [];
  for (const attr of attrs) {
    if (!attr.name) continue;
    if (HIPAA_ATTR_REGEX.test(attr.name)) {
      hits.push('attribute-name-signal');
      break;
    }
  }
  // Enum values that are PHI format identifiers
  for (const attr of attrs) {
    const typeText = attr.type?.text ?? '';
    const enumValues = parseLiteralUnion(typeText);
    if (
      enumValues &&
      enumValues.length > 0 &&
      enumValues.every((v) => PHI_ENUM_TOKEN_REGEX.test(v))
    ) {
      hits.push('attribute-enum-signal');
      break;
    }
  }

  // §5.4 directory location
  if (HIPAA_DIR_REGEX.test(modulePath)) {
    hits.push('directory-location');
  }

  // dedupe while preserving order
  return Array.from(new Set(hits));
}

// ---------------------------------------------------------------------------
// §6 — Variant axis derivation
// ---------------------------------------------------------------------------

/**
 * Parses a literal-union type text like "'a' | 'b' | 'c'" into a value list.
 * Returns null if fewer than 2 quoted literals are found.
 */
export function parseLiteralUnion(typeText: string | undefined | null): string[] | null {
  if (!typeText) return null;
  const parts = Array.from(typeText.matchAll(/'([^']+)'/g)).map((m) => m[1]);
  return parts.length >= 2 ? parts : null;
}

const TEXT_CONTENT_REGEX = /label|heading|title|placeholder|helper|hint|error/i;
const INFRA_ATTR_PREFIXES = ['aria-'];
const INFRA_ATTR_NAMES = new Set(['id', 'form', 'formmethod', 'formnovalidate']);

function stripQuotes(s: string | undefined | null): string {
  if (s == null) return '';
  return s.replace(/^['"]|['"]$/g, '');
}

function figmaAxisNameFor(attr: CemAttribute): string {
  return attr.fieldName || attr.name;
}

function isNamedAttribute(attr: CemAttribute): attr is CemAttribute & { name: string } {
  return typeof attr.name === 'string' && attr.name.length > 0;
}

function isInfraAttribute(attr: CemAttribute): boolean {
  if (!isNamedAttribute(attr)) return true;
  if (INFRA_ATTR_NAMES.has(attr.name)) return true;
  for (const prefix of INFRA_ATTR_PREFIXES) {
    if (attr.name.startsWith(prefix)) return true;
  }
  return false;
}

export function extractVariantAxes(decl: CemDeclaration): VariantAxis[] {
  const attrs = decl.attributes ?? [];
  const axes: VariantAxis[] = [];
  for (const attr of attrs) {
    if (!isNamedAttribute(attr)) continue;
    if (isInfraAttribute(attr)) continue;
    const typeText = attr.type?.text ?? '';
    const enumValues = parseLiteralUnion(typeText);
    if (enumValues) {
      const defaultValue = stripQuotes(attr.default) || enumValues[0];
      axes.push({
        figmaAxisName: figmaAxisNameFor(attr),
        cemAttribute: attr.name,
        cemFieldName: attr.fieldName ?? null,
        type: 'enum',
        values: enumValues,
        default: defaultValue,
      });
      continue;
    }
    if (typeText === 'boolean') {
      const defaultValue = attr.default === 'true' ? 'true' : 'false';
      axes.push({
        figmaAxisName: figmaAxisNameFor(attr),
        cemAttribute: attr.name,
        cemFieldName: attr.fieldName ?? null,
        type: 'boolean',
        values: ['false', 'true'],
        default: defaultValue,
      });
    }
  }
  return axes;
}

export function extractTextProperties(decl: CemDeclaration): TextProperty[] {
  const attrs = decl.attributes ?? [];
  const props: TextProperty[] = [];
  for (const attr of attrs) {
    if (!isNamedAttribute(attr)) continue;
    if (isInfraAttribute(attr)) continue;
    const typeText = attr.type?.text ?? '';
    // Skip anything that would have been a variant axis.
    if (parseLiteralUnion(typeText)) continue;
    if (typeText === 'boolean') continue;

    const isString = typeText === 'string' || /^string\b/.test(typeText);
    const isNumber = typeText === 'number' || /^number\b/.test(typeText);
    if (!isString && !isNumber) continue;

    const name = attr.fieldName || attr.name;
    const property: TextProperty = {
      figmaPropertyName: name,
      cemAttribute: attr.name,
      type: 'text',
      defaultValue: stripQuotes(attr.default),
    };
    if (isNumber) property.hint = 'numeric';
    else if (/^href$/i.test(name)) property.hint = 'href';
    else if (!TEXT_CONTENT_REGEX.test(name) && !isString) {
      // string that doesn't smell like content — still emit (per §6.3 fallback)
    }
    props.push(property);
  }
  return props;
}

export function excludedAttributeNames(decl: CemDeclaration): string[] {
  const attrs = decl.attributes ?? [];
  return attrs
    .filter(isNamedAttribute)
    .filter(isInfraAttribute)
    .map((a) => a.name);
}

// ---------------------------------------------------------------------------
// §7 — Tier classification
// ---------------------------------------------------------------------------

/**
 * Heuristic tier classifier. Default to `molecule` when ambiguous.
 *
 * @param decl CEM declaration
 * @param templateDependencies tags discovered in html`` templates (optional —
 *   the full-file scan lives in the CLI wrapper; tests pass this explicitly).
 */
export function classifyTier(
  decl: CemDeclaration,
  templateDependencies: string[] = [],
  tierOverride?: Tier,
): Tier {
  if (tierOverride) return tierOverride;

  const ownTag = decl.tagName;
  const externalDeps = templateDependencies.filter((t) => t.startsWith('hx-') && t !== ownTag);

  // §7.1: an atom does not embed any other hx-* component in its template.
  // Slot count is not a signal — `hx-button` has 3 slots and is still an atom.
  if (externalDeps.length === 0) return 'atom';
  if (externalDeps.length <= 3) return 'molecule';
  return 'organism';
}

// ---------------------------------------------------------------------------
// §8 — Slot handling
// ---------------------------------------------------------------------------

const DEFAULT_SLOT_FALLBACK = 'Label';

export function extractSlots(decl: CemDeclaration): Slot[] {
  const rawSlots = decl.slots ?? [];
  const result: Slot[] = [];
  for (const slot of rawSlots) {
    const cemSlot = slot.name && slot.name.length > 0 ? slot.name : null;
    result.push({
      figmaPropertyName: cemSlot ?? 'content',
      cemSlot,
      type: 'instance-swap',
      default: cemSlot ? null : DEFAULT_SLOT_FALLBACK,
      description: slot.description,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// §9 — Token binding resolution
// ---------------------------------------------------------------------------

const VAR_PATTERN = /var\(\s*--hx-([a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/i;

/**
 * Convert a `--hx-*` token name (as it appears inside `var(--hx-NAME)`)
 * into a figma-inventory semantic-token path (e.g. `color/primary`).
 *
 * Rules (§9.2):
 *   color-primary-500          → primitive   color/primary/500
 *   color-primary              → semantic    color/primary
 *   color-neutral-0            → primitive   color/neutral/0
 *   space-4                    → primitive   space/4
 *   space-sm                   → semantic    space/sm
 *   border-radius-md           → primitive   border-radius/md
 *   font-weight-semibold       → primitive   font-weight/semibold
 *   focus-ring-color           → semantic    focus-ring/color
 */
export function tokenNameToPath(hxName: string): { path: string; kind: 'primitive' | 'semantic' } {
  // Compound namespaces that must survive the kebab-to-slash split as a single
  // path segment (not split on their internal hyphens).
  const compoundNamespaces = ['border-radius', 'font-size', 'font-weight', 'line-height'];

  let remainder = hxName;
  const segments: string[] = [];
  for (const ns of compoundNamespaces) {
    if (hxName === ns || hxName.startsWith(ns + '-')) {
      segments.push(ns);
      remainder = hxName.slice(ns.length).replace(/^-/, '');
      break;
    }
  }
  if (remainder) {
    segments.push(...remainder.split('-'));
  }

  const last = segments[segments.length - 1];
  const isIntegerScale = /^[0-9]+$/.test(last);
  const primitiveNamespaces = new Set(compoundNamespaces);
  const firstSegment = segments[0];

  if (isIntegerScale) {
    return { path: segments.join('/'), kind: 'primitive' };
  }
  if (primitiveNamespaces.has(firstSegment)) {
    return { path: segments.join('/'), kind: 'primitive' };
  }
  return { path: segments.join('/'), kind: 'semantic' };
}

/**
 * Infer a Figma binding target from a CSS custom property name.
 * Returns null if the suffix is unknown — in that case the binding still
 * carries a semantic/primitive token but no target, so humans (or the
 * plugin) pick a sensible layer property.
 */
export function inferTarget(cssPropName: string): FigmaBinding['target'] {
  // Ordered suffix matches, longest-first.
  const rules: Array<[RegExp, FigmaBinding['target']]> = [
    [/-border-color$/, 'Stroke'],
    [/-border-radius$/, 'CornerRadius'],
    [/-border-width$/, 'Stroke'],
    [/-bg$/, 'Fill'],
    [/-background$/, 'Fill'],
    [/-color$/, 'Fill'],
    [/-padding(-x|-y|-top|-right|-bottom|-left)?$/, 'Padding'],
    [/-gap$/, 'Gap'],
    [/-font-size$/, 'FontSize'],
    [/-font-weight$/, 'FontWeight'],
    [/-line-height$/, 'LineHeight'],
    [/-shadow$/, 'Effect'],
    [/-opacity$/, 'Opacity'],
  ];
  for (const [re, target] of rules) {
    if (re.test(cssPropName)) return target;
  }
  return null;
}

/**
 * Extract the "part" layer selector for a css property, e.g.
 *   --hx-button-label-color → ::part(label)
 *   --hx-button-bg          → root
 *
 * Strategy: strip the component prefix (`--hx-{tag-without-hx}-`) and drop
 * a recognized trailing property suffix (`-bg`, `-color`, `-border-color`, …).
 * Whatever remains, if it matches one of the declared cssParts, becomes the
 * layer selector.
 */
export function inferLayerSelector(
  cssPropName: string,
  componentTag: string,
  cssParts: CemCssPart[],
): string {
  const tagRoot = componentTag.replace(/^hx-/, '');
  const prefix = `--hx-${tagRoot}-`;
  if (!cssPropName.startsWith(prefix)) return 'root';

  const remainder = cssPropName.slice(prefix.length);
  // Strip a known target suffix.
  const withoutSuffix = remainder
    .replace(/-border-color$/, '')
    .replace(/-border-radius$/, '')
    .replace(/-border-width$/, '')
    .replace(/-bg$/, '')
    .replace(/-background$/, '')
    .replace(/-color$/, '')
    .replace(/-padding(-x|-y|-top|-right|-bottom|-left)?$/, '')
    .replace(/-gap$/, '')
    .replace(/-font-size$/, '')
    .replace(/-font-weight$/, '')
    .replace(/-line-height$/, '')
    .replace(/-shadow$/, '')
    .replace(/-opacity$/, '');

  if (!withoutSuffix) return 'root';

  const partNames = new Set(cssParts.map((p) => p.name));
  if (partNames.has(withoutSuffix)) return `::part(${withoutSuffix})`;
  return 'root';
}

export function resolveBinding(
  cssProp: CemCssProperty,
  componentTag: string,
  cssParts: CemCssPart[],
): FigmaBinding | null {
  const target = inferTarget(cssProp.name);
  const layerSelector = inferLayerSelector(cssProp.name, componentTag, cssParts);
  const defaultExpr = (cssProp.default ?? '').trim();

  if (!defaultExpr) {
    // §9.1 Case E — no default; consumer overrides only.
    return null;
  }

  const varMatch = defaultExpr.match(VAR_PATTERN);
  if (varMatch) {
    const tokenHxName = varMatch[1];
    const fallback = varMatch[2]?.trim() ?? null;
    const { path, kind } = tokenNameToPath(tokenHxName);

    let semanticToken: string | null = null;
    let fallbackPrimitive: string | null = null;
    if (kind === 'semantic') {
      semanticToken = path;
    } else {
      fallbackPrimitive = path;
      // §9 example: primitive paths like `color/primary/500` imply a semantic
      // family `color/primary`. Emit the implied semantic so the Figma plugin
      // can prefer the Semantic collection and fall back to the primitive only
      // when no semantic Variable exists yet.
      const segments = path.split('/');
      const last = segments[segments.length - 1];
      if (/^[0-9]+$/.test(last) && segments.length >= 2) {
        semanticToken = segments.slice(0, -1).join('/');
      }
    }

    return {
      target,
      layerSelector,
      semanticToken,
      fallbackPrimitive,
      literalFallback: fallback,
    };
  }

  // §9.6 Literal value — no token mapping.
  return {
    target,
    layerSelector,
    semanticToken: null,
    fallbackPrimitive: null,
    literalFallback: defaultExpr,
  };
}

// ---------------------------------------------------------------------------
// §11 — Dependency extraction
// ---------------------------------------------------------------------------

/**
 * Parse html`…` template blocks in a TypeScript source string and return
 * the set of `hx-*` tags referenced. Only looks inside template literals
 * that follow an `html` tag.
 */
export function extractHxTagsFromSource(source: string, ownTag?: string): string[] {
  const tags = new Set<string>();
  // Match html`…` (handles nested backticks poorly, but that's fine for our CEM
  // source style which doesn't nest html`` blocks). We use a lax non-greedy match.
  const blockRegex = /html`([\s\S]*?)`/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(source)) !== null) {
    const block = match[1];
    const tagRegex = /<\s*(hx-[a-z0-9-]+)\b/g;
    let tagMatch: RegExpExecArray | null;
    while ((tagMatch = tagRegex.exec(block)) !== null) {
      const t = tagMatch[1];
      if (t === ownTag) continue;
      tags.add(t);
    }
  }
  return Array.from(tags).sort();
}

// ---------------------------------------------------------------------------
// Description truncation
// ---------------------------------------------------------------------------

export function truncateDescription(raw: string, maxChars = 200): string {
  if (!raw) return '';
  const firstPara = raw
    .split(/\n\s*\n/)[0]
    .replace(/\s+/g, ' ')
    .trim();
  if (firstPara.length <= maxChars) return firstPara;
  return (
    firstPara
      .slice(0, maxChars - 1)
      .replace(/\s+\S*$/, '')
      .trim() + '…'
  );
}

// ---------------------------------------------------------------------------
// Component-entry builder
// ---------------------------------------------------------------------------

export interface BuildComponentInput {
  decl: CemDeclaration;
  module: CemModule;
  templateDependencies: string[];
  tierOverride?: Tier;
}

/**
 * Mirror the relevant subset of `helixMeta` (Phase B.1 plugin output) into
 * the inventory shape figgy reads. Falls back to neutral defaults when the
 * declaration carries no helixMeta — keeps the schema stable so consumers
 * never have to null-check the inventory entry itself.
 */
export function mirrorHelixMeta(decl: CemDeclaration): {
  aaa: InventoryAaa;
  keyboardContract: InventoryKeyboardContract | null;
  ariaPattern: string | null;
  themeAware: boolean | null;
  brandAware: boolean | null;
  formAssociated: boolean | null;
  priorityTier: string | null;
} {
  const meta = decl.helixMeta ?? {};
  const aaaRaw = meta.aaa ?? {};
  const aaa: InventoryAaa = {
    certified: aaaRaw.certified === true || decl.aaaCertified === true,
    certifiedDate: aaaRaw.certifiedDate ?? decl.aaaCertifiedDate ?? null,
    criteria: Array.isArray(aaaRaw.criteria) ? [...aaaRaw.criteria] : [],
    auditUrl: typeof aaaRaw.auditUrl === 'string' ? aaaRaw.auditUrl : null,
  };

  let keyboardContract: InventoryKeyboardContract | null = null;
  if (meta.keyboardContract) {
    const kc = meta.keyboardContract;
    keyboardContract = {
      activate: Array.isArray(kc.activate) ? [...kc.activate] : [],
      navigate: Array.isArray(kc.navigate) ? [...kc.navigate] : [],
      dismiss: Array.isArray(kc.dismiss) ? [...kc.dismiss] : [],
      disabledSuppresses: typeof kc.disabledSuppresses === 'boolean' ? kc.disabledSuppresses : null,
    };
  }

  return {
    aaa,
    keyboardContract,
    ariaPattern: typeof meta.ariaPattern === 'string' ? meta.ariaPattern : null,
    themeAware: typeof meta.themeAware === 'boolean' ? meta.themeAware : null,
    brandAware: typeof meta.brandAware === 'boolean' ? meta.brandAware : null,
    formAssociated: typeof meta.formAssociated === 'boolean' ? meta.formAssociated : null,
    priorityTier: typeof meta.priorityTier === 'string' ? meta.priorityTier : null,
  };
}

export function buildComponentEntry(input: BuildComponentInput): ComponentEntry {
  const { decl, module: mod, templateDependencies, tierOverride } = input;
  if (!decl.tagName) {
    throw new Error(
      `buildComponentEntry: declaration "${decl.name ?? '<anonymous>'}" is missing tagName`,
    );
  }
  const tag = decl.tagName;
  const cssParts = decl.cssParts ?? [];
  const cssProperties = (decl.cssProperties ?? []).map(
    (cp): ResolvedCssProperty => ({
      ...cp,
      figmaBinding: resolveBinding(cp, tag, cssParts),
    }),
  );
  const helixMirror = mirrorHelixMeta(decl);
  return {
    tag,
    className: decl.name ?? '',
    modulePath: mod.path,
    figmaEligible: true,
    figmaComponentName: tag,
    figmaPagePlacement: '4a',
    description: truncateDescription(decl.description ?? ''),
    tier: classifyTier(decl, templateDependencies, tierOverride),
    variantAxes: extractVariantAxes(decl),
    textProperties: extractTextProperties(decl),
    slots: extractSlots(decl),
    cssParts,
    events: decl.events ?? [],
    cssProperties,
    dependsOn: templateDependencies.filter((t) => t !== tag),
    excludedAttributes: excludedAttributeNames(decl),
    ...helixMirror,
  };
}
