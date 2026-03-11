/**
 * CEM (Custom Elements Manifest) parser for the admin dashboard.
 * Reads custom-elements.json from the wc-library package at runtime.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── CEM Type Interfaces ──────────────────────────────────────────────

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
  parameters?: Array<{ name: string; type?: CemType; optional?: boolean; description?: string }>;
  return?: { type?: CemType };
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
  superclass?: { name: string; package: string };
}

interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
  exports?: Array<{ kind: string; name: string; declaration?: { name: string; module?: string } }>;
}

interface CemManifest {
  schemaVersion: string;
  readme: string;
  modules: CemModule[];
}

// ── Public Data Types ────────────────────────────────────────────────

export interface ComponentProperty {
  name: string;
  attribute: string;
  type: string;
  default: string;
  description: string;
  reflects: boolean;
}

export interface ComponentMethod {
  name: string;
  description: string;
  parameters: Array<{ name: string; type: string; optional: boolean; description: string }>;
  returnType: string;
  privacy: string;
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
  superclass: string;
  modulePath: string;
  properties: ComponentProperty[];
  methods: ComponentMethod[];
  events: ComponentEvent[];
  slots: ComponentSlot[];
  cssParts: ComponentCssPart[];
  cssProperties: ComponentCssProperty[];
  attributes: CemAttribute[];
  // Counts for analysis
  totalMembers: number;
  publicMembers: number;
  privateMembers: number;
  staticMembers: number;
  formAssociated: boolean;
}

export interface ManifestStats {
  totalComponents: number;
  totalProperties: number;
  totalEvents: number;
  totalSlots: number;
  totalCssParts: number;
  totalCssProperties: number;
  totalMethods: number;
  schemaVersion: string;
}

// ── Implementation ───────────────────────────────────────────────────

function getManifest(): CemManifest {
  const cemPath = resolve(process.cwd(), '../../packages/hx-library/custom-elements.json');
  if (!existsSync(cemPath)) {
    return { schemaVersion: '', modules: [] } as unknown as CemManifest;
  }
  const raw = readFileSync(cemPath, 'utf-8');
  return JSON.parse(raw) as CemManifest;
}

function findDeclaration(tagName: string): { decl: CemDeclaration; mod: CemModule } | undefined {
  const manifest = getManifest();
  for (const mod of manifest.modules) {
    if (!mod.declarations) continue;
    for (const decl of mod.declarations) {
      if (decl.customElement && decl.tagName === tagName) {
        return { decl, mod };
      }
    }
  }
  return undefined;
}

export function getComponentData(tagName: string): ComponentData | undefined {
  const found = findDeclaration(tagName);
  if (!found) return undefined;
  const { decl, mod } = found;

  const members = decl.members ?? [];

  const properties: ComponentProperty[] = members
    .filter(
      (m) =>
        m.kind === 'field' && m.attribute && m.privacy !== 'private' && !m.static && !m.readonly,
    )
    .map((m) => ({
      name: m.name,
      attribute: m.attribute ?? '',
      type: m.type?.text ?? 'unknown',
      default: m.default ?? '\u2014',
      description: m.description ?? '',
      reflects: m.reflects ?? false,
    }));

  const methods: ComponentMethod[] = members
    .filter((m) => m.kind === 'method')
    .map((m) => ({
      name: m.name,
      description: m.description ?? '',
      parameters: (m.parameters ?? []).map((p) => ({
        name: p.name,
        type: p.type?.text ?? 'unknown',
        optional: p.optional ?? false,
        description: p.description ?? '',
      })),
      returnType: m.return?.type?.text ?? 'void',
      privacy: m.privacy ?? 'public',
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
    default: p.default ?? '\u2014',
  }));

  const formAssociated = members.some(
    (m) => m.name === 'formAssociated' && m.static && m.default === 'true',
  );

  const publicMembers = members.filter((m) => m.privacy !== 'private').length;
  const privateMembers = members.filter((m) => m.privacy === 'private').length;
  const staticMembers = members.filter((m) => m.static).length;

  return {
    tagName: decl.tagName ?? '',
    className: decl.name,
    description: decl.description ?? '',
    summary: decl.summary ?? '',
    superclass: decl.superclass
      ? `${decl.superclass.name} (${decl.superclass.package})`
      : 'unknown',
    modulePath: mod.path,
    properties,
    methods,
    events,
    slots,
    cssParts,
    cssProperties,
    attributes: decl.attributes ?? [],
    totalMembers: members.length,
    publicMembers,
    privateMembers,
    staticMembers,
    formAssociated,
  };
}

export function getAllComponents(): ComponentData[] {
  const names = getAllComponentNames();
  const components: ComponentData[] = [];
  for (const name of names) {
    const data = getComponentData(name);
    if (data) components.push(data);
  }
  return components;
}

export function getAllComponentNames(): string[] {
  const manifest = getManifest();
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

/**
 * Returns the directory name where a component lives based on its CEM module path.
 * For most components this matches the tagName (e.g., hx-button → hx-button).
 * For companion components like hx-radio, the CEM module path reveals it lives
 * inside hx-radio-group/, so this returns "hx-radio-group".
 */
export function getComponentDirectory(tagName: string): string {
  const found = findDeclaration(tagName);
  if (found) {
    const match = found.mod.path.match(/components\/(hx-[^/]+)\//);
    if (match) return match[1];
  }
  return tagName;
}

export function getManifestStats(): ManifestStats {
  const components = getAllComponents();
  const manifest = getManifest();

  return {
    totalComponents: components.length,
    totalProperties: components.reduce((sum, c) => sum + c.properties.length, 0),
    totalEvents: components.reduce((sum, c) => sum + c.events.length, 0),
    totalSlots: components.reduce((sum, c) => sum + c.slots.length, 0),
    totalCssParts: components.reduce((sum, c) => sum + c.cssParts.length, 0),
    totalCssProperties: components.reduce((sum, c) => sum + c.cssProperties.length, 0),
    totalMethods: components.reduce((sum, c) => sum + c.methods.length, 0),
    schemaVersion: manifest.schemaVersion,
  };
}
