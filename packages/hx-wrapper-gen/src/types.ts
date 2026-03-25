/**
 * Custom Elements Manifest (CEM) type definitions.
 * Based on the CEM schema: https://github.com/webcomponents/custom-elements-manifest
 */

export interface CemAttribute {
  name: string;
  type?: { text: string };
  description?: string;
  default?: string;
  reflects?: boolean;
}

export interface CemProperty {
  name: string;
  type?: { text: string };
  description?: string;
  default?: string;
  attribute?: string;
  reflects?: boolean;
}

export interface CemEvent {
  name: string;
  type?: { text: string };
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
  description?: string;
  default?: string;
}

export interface CemMember extends CemProperty {
  kind: string;
}

export interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  customElement?: boolean;
  description?: string;
  attributes?: CemAttribute[];
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssProperties?: CemCssProperty[];
  cssParts?: CemCssPart[];
}

export interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
}

export interface Cem {
  schemaVersion: string;
  readme?: string;
  modules?: CemModule[];
}

export interface ComponentEntry {
  decl: CemDeclaration;
  modulePath: string;
}
