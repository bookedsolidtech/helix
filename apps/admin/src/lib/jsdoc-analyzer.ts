/**
 * JSDoc Coverage Analyzer.
 * Reads component .ts source files and extracts JSDoc coverage.
 * Compares against CEM data to detect drift.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getComponentData, getComponentDirectory } from "./cem-parser";

export interface JsDocCoverage {
  tagName: string;
  sourceFile: string;
  totalJsDocBlocks: number;
  propertyDocs: number;
  eventDocs: number;
  slotDocs: number;
  cssPropDocs: number;
  cssPartDocs: number;
  classDescription: boolean;
  classSummary: boolean;
  coveragePercent: number;
}

export interface DriftItem {
  type: "property" | "event" | "slot" | "cssprop" | "csspart";
  name: string;
  inJsDoc: boolean;
  inCem: boolean;
}

export interface DriftReport {
  tagName: string;
  driftItems: DriftItem[];
  hasDrift: boolean;
  driftCount: number;
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), "../../packages/hx-library");
}

function readSourceFile(componentTag: string): string | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(componentTag);
  const sourcePath = resolve(libRoot, `src/components/${dir}/${componentTag}.ts`);
  try {
    return readFileSync(sourcePath, "utf-8");
  } catch {
    return null;
  }
}

function countJsDocTag(source: string, tag: string): string[] {
  const regex = new RegExp(`@${tag}\\s+(?:\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}\\s+)?([\\w-]+|\\[[\\w-]*\\])`, "g");
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    matches.push(match[1].replace(/^\[|\]$/g, ""));
  }
  return matches;
}

function countCssPropTags(source: string): string[] {
  const regex = /@cssprop\s+\[?(--[\w-]+)\]?/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function hasJsDocTag(source: string, tag: string): boolean {
  return new RegExp(`@${tag}\\b`).test(source);
}

export function analyzeJsDoc(tagName: string): JsDocCoverage | null {
  const source = readSourceFile(tagName);
  if (!source) return null;

  const dir = getComponentDirectory(tagName);
  const data = getComponentData(tagName);
  if (!data) return null;

  // Count JSDoc blocks
  const jsDocBlocks = (source.match(/\/\*\*[\s\S]*?\*\//g) ?? []).length;

  // Count documented items in JSDoc
  const propertyTags = countJsDocTag(source, "attr");
  const eventTags = countJsDocTag(source, "fires");
  const slotTags = countJsDocTag(source, "slot");
  const cssPropTags = countCssPropTags(source);
  const cssPartTags = countJsDocTag(source, "csspart");

  const classDescription = hasJsDocTag(source, "tag") || /\/\*\*\s*\n\s*\*\s+\w/.test(source);
  const classSummary = hasJsDocTag(source, "summary");

  // Calculate coverage against CEM expectations
  const expectedItems =
    data.properties.length +
    data.events.length +
    data.slots.length +
    data.cssProperties.length +
    data.cssParts.length +
    2; // class description + summary

  const documentedItems =
    propertyTags.length +
    eventTags.length +
    slotTags.length +
    cssPropTags.length +
    cssPartTags.length +
    (classDescription ? 1 : 0) +
    (classSummary ? 1 : 0);

  const coveragePercent = expectedItems > 0 ? Math.round((documentedItems / expectedItems) * 100) : 100;

  return {
    tagName,
    sourceFile: `src/components/${dir}/${tagName}.ts`,
    totalJsDocBlocks: jsDocBlocks,
    propertyDocs: propertyTags.length,
    eventDocs: eventTags.length,
    slotDocs: slotTags.length,
    cssPropDocs: cssPropTags.length,
    cssPartDocs: cssPartTags.length,
    classDescription,
    classSummary,
    coveragePercent: Math.min(coveragePercent, 100),
  };
}

export function detectDrift(tagName: string): DriftReport | null {
  const source = readSourceFile(tagName);
  if (!source) return null;

  const data = getComponentData(tagName);
  if (!data) return null;

  const driftItems: DriftItem[] = [];

  // Compare properties
  const jsDocAttrs = new Set(countJsDocTag(source, "attr"));
  for (const prop of data.properties) {
    if (!jsDocAttrs.has(prop.attribute)) {
      driftItems.push({ type: "property", name: prop.attribute, inJsDoc: false, inCem: true });
    }
  }
  for (const attr of jsDocAttrs) {
    if (!data.properties.some((p) => p.attribute === attr)) {
      driftItems.push({ type: "property", name: attr, inJsDoc: true, inCem: false });
    }
  }

  // Compare events
  const jsDocEvents = new Set(countJsDocTag(source, "fires"));
  for (const event of data.events) {
    if (!jsDocEvents.has(event.name)) {
      driftItems.push({ type: "event", name: event.name, inJsDoc: false, inCem: true });
    }
  }

  // Compare CSS properties
  const jsDocCssProps = new Set(countCssPropTags(source));
  for (const cssProp of data.cssProperties) {
    if (!jsDocCssProps.has(cssProp.name)) {
      driftItems.push({ type: "cssprop", name: cssProp.name, inJsDoc: false, inCem: true });
    }
  }

  // Compare CSS parts
  const jsDocCssParts = new Set(countJsDocTag(source, "csspart"));
  for (const cssPart of data.cssParts) {
    if (!jsDocCssParts.has(cssPart.name)) {
      driftItems.push({ type: "csspart", name: cssPart.name, inJsDoc: false, inCem: true });
    }
  }

  // Compare slots
  const jsDocSlots = new Set(countJsDocTag(source, "slot"));
  // Handle default slot: JSDoc uses empty string or "-"
  for (const slot of data.slots) {
    const slotName = slot.name === "(default)" ? "" : slot.name;
    if (slotName && !jsDocSlots.has(slotName)) {
      driftItems.push({ type: "slot", name: slot.name, inJsDoc: false, inCem: true });
    }
  }

  return {
    tagName,
    driftItems,
    hasDrift: driftItems.length > 0,
    driftCount: driftItems.length,
  };
}

export async function analyzeAllJsDoc(): Promise<JsDocCoverage[]> {
  const { getAllComponentNames } = await import("./cem-parser");
  const names = getAllComponentNames();
  const results: JsDocCoverage[] = [];
  for (const name of names) {
    const coverage = analyzeJsDoc(name);
    if (coverage) results.push(coverage);
  }
  return results;
}
