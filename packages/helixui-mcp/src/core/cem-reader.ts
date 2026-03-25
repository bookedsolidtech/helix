import { readFileSync, existsSync } from 'node:fs';
import { getConfig } from '../config.js';

// ─── CEM Types ────────────────────────────────────────────────────────────────

export interface CemTypeRef {
  text?: string;
}

export interface CemField {
  kind: 'field';
  name: string;
  type?: CemTypeRef;
  description?: string;
  default?: string;
  attribute?: string;
  reflects?: boolean;
  privacy?: string;
  static?: boolean;
  readonly?: boolean;
}

export interface CemMethod {
  kind: 'method';
  name: string;
  description?: string;
  privacy?: string;
  static?: boolean;
  return?: CemTypeRef;
  parameters?: Array<{ name: string; type?: CemTypeRef; description?: string }>;
}

export type CemMember = CemField | CemMethod;

export interface CemEvent {
  name: string;
  type?: CemTypeRef;
  description?: string;
}

export interface CemSlot {
  name: string;
  description?: string;
}

export interface CemCssPart {
  name: string;
  description?: string;
}

export interface CemCssProperty {
  name: string;
  default?: string;
  description?: string;
}

export interface CemDeclaration {
  kind?: string;
  name: string;
  tagName?: string;
  description?: string;
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssParts?: CemCssPart[];
  cssProperties?: CemCssProperty[];
}

export type ComponentDeclaration = CemDeclaration & { tagName: string };

export interface CemModule {
  kind?: string;
  path?: string;
  declarations?: CemDeclaration[];
}

export interface Cem {
  schemaVersion?: string;
  modules: CemModule[];
}

// ─── CemReader ────────────────────────────────────────────────────────────────

export class CemReader {
  private readonly cemPath: string;

  constructor(cemPath?: string) {
    this.cemPath = cemPath ?? getConfig().cemPath;
  }

  load(): Cem {
    if (!existsSync(this.cemPath)) {
      throw new Error(
        `CEM file not found at ${this.cemPath}. ` +
          `Run 'pnpm run cem' in the library package, or set HELIXUI_MCP_CEM_PATH.`,
      );
    }
    return JSON.parse(readFileSync(this.cemPath, 'utf8')) as Cem;
  }

  loadSafe(): Cem | null {
    if (!existsSync(this.cemPath)) {
      return null;
    }
    try {
      return JSON.parse(readFileSync(this.cemPath, 'utf8')) as Cem;
    } catch {
      return null;
    }
  }

  getComponents(): ComponentDeclaration[] {
    const cem = this.load();
    return cem.modules
      .flatMap((m) => m.declarations ?? [])
      .filter((d): d is ComponentDeclaration => typeof d.tagName === 'string');
  }

  getComponent(tagName: string): ComponentDeclaration | undefined {
    return this.getComponents().find((c) => c.tagName === tagName);
  }

  getProperties(tagName: string): CemField[] {
    const component = this.getComponent(tagName);
    if (!component) return [];
    return (component.members ?? []).filter((m): m is CemField => m.kind === 'field');
  }

  getMethods(tagName: string): CemMethod[] {
    const component = this.getComponent(tagName);
    if (!component) return [];
    return (component.members ?? []).filter((m): m is CemMethod => m.kind === 'method');
  }

  getEvents(tagName: string): CemEvent[] {
    const component = this.getComponent(tagName);
    if (!component) return [];
    return component.events ?? [];
  }

  getSlots(tagName: string): CemSlot[] {
    const component = this.getComponent(tagName);
    if (!component) return [];
    return component.slots ?? [];
  }

  getCssParts(tagName: string): CemCssPart[] {
    const component = this.getComponent(tagName);
    if (!component) return [];
    return component.cssParts ?? [];
  }

  getCssProperties(tagName: string): CemCssProperty[] {
    const component = this.getComponent(tagName);
    if (!component) return [];
    return component.cssProperties ?? [];
  }

  search(query: string): ComponentDeclaration[] {
    const q = query.toLowerCase();
    return this.getComponents().filter(
      (c) =>
        c.tagName.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.description !== undefined && c.description.toLowerCase().includes(q)),
    );
  }
}
