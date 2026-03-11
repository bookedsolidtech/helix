/**
 * Custom Elements Manifest (CEM) parser utility.
 * Runs in Astro's server context (Node) at build time — never shipped to browser.
 */
import cemJson from '@helixui/library/custom-elements.json';

// ── CEM type interfaces ──────────────────────────────────────────────

interface CemType {
  text: string;
}

interface CemMember {
  kind: string;
  name: string;
  type?: CemType;
  default?: string;
  description?: string;
  attribute?: string;
  reflects?: boolean;
  privacy?: string;
  static?: boolean;
  readonly?: boolean;
}

interface CemEvent {
  name: string;
  type?: CemType;
  description?: string;
}

interface CemSlot {
  name: string;
  description?: string;
}

interface CemCssPart {
  name: string;
  description?: string;
}

interface CemCssProperty {
  name: string;
  description?: string;
  default?: string;
}

interface CemAttribute {
  name: string;
  type?: CemType;
  default?: string;
  description?: string;
  fieldName?: string;
}

interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  customElement?: boolean;
  description?: string;
  summary?: string;
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssParts?: CemCssPart[];
  cssProperties?: CemCssProperty[];
  attributes?: CemAttribute[];
}

interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
}

interface CemManifest {
  schemaVersion: string;
  modules: CemModule[];
}

// ── Public data shape returned by getComponentData() ─────────────────

export interface ComponentProperty {
  name: string;
  attribute: string;
  type: string;
  default: string;
  description: string;
  reflects: boolean;
}

export interface ComponentEvent {
  name: string;
  type: string;
  description: string;
}

export interface ComponentSlot {
  name: string;
  description: string;
}

export interface ComponentCssPart {
  name: string;
  description: string;
}

export interface ComponentCssProperty {
  name: string;
  description: string;
  default: string;
}

export interface ComponentData {
  tagName: string;
  className: string;
  description: string;
  summary: string;
  properties: ComponentProperty[];
  events: ComponentEvent[];
  slots: ComponentSlot[];
  cssParts: ComponentCssPart[];
  cssProperties: ComponentCssProperty[];
}

// ── Implementation ───────────────────────────────────────────────────

const manifest = cemJson as CemManifest;

/** Find the declaration for a custom element by its tag name. */
function findDeclaration(tagName: string): CemDeclaration | undefined {
  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;
    for (const decl of mod.declarations) {
      if (decl.customElement && decl.tagName === tagName) {
        return decl;
      }
    }
  }
  return undefined;
}

/** Get structured component data for a given tag name. */
export function getComponentData(tagName: string): ComponentData | undefined {
  const decl = findDeclaration(tagName);
  if (!decl) return undefined;

  // Filter members: only public fields that have an `attribute`
  const properties: ComponentProperty[] = (decl.members ?? [])
    .filter(
      (m) =>
        m.kind === 'field' && m.attribute && m.privacy !== 'private' && !m.static && !m.readonly,
    )
    .map((m) => ({
      name: m.name,
      attribute: m.attribute ?? '',
      type: m.type?.text ?? 'unknown',
      default: m.default ?? '—',
      description: m.description ?? '',
      reflects: m.reflects ?? false,
    }));

  const events: ComponentEvent[] = (decl.events ?? []).map((e) => ({
    name: e.name,
    type: e.type?.text ?? 'CustomEvent',
    description: e.description ?? '',
  }));

  const slots: ComponentSlot[] = (decl.slots ?? []).map((s) => ({
    name: s.name || '(default)',
    description: s.description ?? '',
  }));

  const cssParts: ComponentCssPart[] = (decl.cssParts ?? []).map((p) => ({
    name: p.name,
    description: p.description ?? '',
  }));

  const cssProperties: ComponentCssProperty[] = (decl.cssProperties ?? []).map((p) => ({
    name: p.name,
    description: p.description ?? '',
    default: p.default ?? '—',
  }));

  return {
    tagName: decl.tagName ?? '',
    className: decl.name,
    description: decl.description ?? '',
    summary: decl.summary ?? '',
    properties,
    events,
    slots,
    cssParts,
    cssProperties,
  };
}

/** Get all custom-element tag names in the manifest. */
export function getAllComponentNames(): string[] {
  const names: string[] = [];
  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;
    for (const decl of mod.declarations) {
      if (decl.customElement && decl.tagName) {
        names.push(decl.tagName);
      }
    }
  }
  return names;
}
