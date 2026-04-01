import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';
import { describe, it, expect, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

interface PropDef {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
}

interface ComponentYml {
  $schema?: string;
  name: string;
  description?: string;
  status: string;
  group?: string;
  props?: {
    type: string;
    properties?: Record<string, PropDef>;
  };
  slots?: Record<string, { title?: string; description?: string }>;
}

interface CemMember {
  kind: string;
  name: string;
  type?: { text: string };
  description?: string;
  attribute?: string;
}

interface CemDeclaration {
  tagName?: string;
  members?: CemMember[];
}

interface CemModule {
  declarations?: CemDeclaration[];
}

interface Cem {
  schemaVersion: string;
  modules: CemModule[];
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

const worktreeRoot = fileURLToPath(new URL('../../../', import.meta.url));
const componentsDir = resolve(worktreeRoot, 'packages/drupal-starter/components');
const cemPath = fileURLToPath(
  new URL('../../../node_modules/@helixui/library/custom-elements.json', import.meta.url),
);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateComponentYml(doc: Partial<ComponentYml>): string[] {
  const errors: string[] = [];
  if (!('name' in doc) || !doc.name) errors.push('missing required field: name');
  if (!('status' in doc) || !doc.status) errors.push('missing required field: status');
  if (doc.props !== undefined) {
    if (doc.props.type !== 'object') errors.push(`props.type must be 'object', got '${doc.props.type}'`);
    if (!doc.props.properties) errors.push('props.properties is missing');
  }
  return errors;
}

/**
 * Map a CEM type text string to the canonical JSON Schema type used in
 * component.yml files.  Rules:
 *
 * - Strip nullable/optional suffixes (`| undefined`, `| null`) before
 *   classifying so that `number | undefined` is treated as numeric.
 * - `boolean`  → 'boolean'
 * - `number`   → 'number'  (also matches yml 'integer', a JSON-Schema subtype)
 * - anything else (union string literals, `string`, …) → 'string'
 */
function mapCemType(typeText: string): string {
  // Normalise: remove `| undefined` and `| null` qualifiers then trim.
  const normalised = typeText
    .replace(/\|\s*undefined/g, '')
    .replace(/\|\s*null/g, '')
    .trim();

  if (normalised === 'boolean') return 'boolean';
  if (normalised === 'number') return 'number';
  return 'string';
}

/**
 * Return true when the yml prop type is compatible with the CEM-derived type.
 * JSON Schema `integer` is a subtype of `number`, so both are accepted when
 * the CEM declares a numeric field.
 */
function typesAreCompatible(ymlType: string, cemType: string): boolean {
  if (ymlType === cemType) return true;
  if (cemType === 'number' && ymlType === 'integer') return true;
  return false;
}

// ---------------------------------------------------------------------------
// Fixture data — loaded once
// ---------------------------------------------------------------------------

let componentDirs: string[] = [];
let cem: Cem;
let cemDeclarations: CemDeclaration[];

// ---------------------------------------------------------------------------
// Primary test suite
// ---------------------------------------------------------------------------

describe('SDC component.yml validation', () => {
  beforeAll(() => {
    componentDirs = readdirSync(componentsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    cem = JSON.parse(readFileSync(cemPath, 'utf8')) as Cem;
    cemDeclarations = cem.modules.flatMap((m) => m.declarations ?? []);
  });

  // Test 1 — component directories are discovered
  it('discovers all component directories', () => {
    expect(componentDirs.length).toBeGreaterThan(0);
  });

  // Test 2 — required fields present in every component.yml
  it('has required fields (name, status) in every component.yml', () => {
    const failures: string[] = [];

    for (const dirName of componentDirs) {
      const ymlPath = join(componentsDir, dirName, `${dirName}.component.yml`);
      if (!existsSync(ymlPath)) {
        failures.push(`${dirName}: component.yml not found`);
        continue;
      }
      const doc = load(readFileSync(ymlPath, 'utf8')) as ComponentYml;
      const errors = validateComponentYml(doc);
      for (const err of errors) {
        failures.push(`${dirName}: ${err}`);
      }
    }

    expect(failures).toEqual([]);
  });

  // Test 3 — Twig template exists for each component
  it('has a .twig file for every component directory', () => {
    const missing: string[] = [];

    for (const dirName of componentDirs) {
      const twigPath = join(componentsDir, dirName, `${dirName}.twig`);
      if (!existsSync(twigPath)) {
        missing.push(dirName);
      }
    }

    expect(missing).toEqual([]);
  });

  // Test 4 — CSS file exists for each component
  it('has a .css file for every component directory', () => {
    const missing: string[] = [];

    for (const dirName of componentDirs) {
      const cssPath = join(componentsDir, dirName, `${dirName}.css`);
      if (!existsSync(cssPath)) {
        missing.push(dirName);
      }
    }

    expect(missing).toEqual([]);
  });

  // Test 5 — props.type is 'object' when props block is present
  it("sets props.type to 'object' whenever a props block is present", () => {
    const failures: string[] = [];

    for (const dirName of componentDirs) {
      const ymlPath = join(componentsDir, dirName, `${dirName}.component.yml`);
      if (!existsSync(ymlPath)) continue;
      const doc = load(readFileSync(ymlPath, 'utf8')) as ComponentYml;
      if (doc.props !== undefined && doc.props.type !== 'object') {
        failures.push(`${dirName}: props.type is '${doc.props.type}' (expected 'object')`);
      }
    }

    expect(failures).toEqual([]);
  });

  // Test 6 — props.properties exists when props block is present
  it('has props.properties whenever a props block is present', () => {
    const failures: string[] = [];

    for (const dirName of componentDirs) {
      const ymlPath = join(componentsDir, dirName, `${dirName}.component.yml`);
      if (!existsSync(ymlPath)) continue;
      const doc = load(readFileSync(ymlPath, 'utf8')) as ComponentYml;
      if (doc.props !== undefined && !doc.props.properties) {
        failures.push(`${dirName}: props.properties is missing`);
      }
    }

    expect(failures).toEqual([]);
  });

  // Test 7 — hx-* components appear in the CEM
  //
  // A small number of hx-* SDC directories are Drupal-domain-only extensions
  // (e.g. healthcare-specific components not yet promoted to the shared
  // library).  These are listed as known exceptions so that the test stays
  // deterministic while still catching genuinely unregistered tag names.
  it('finds every hx-* component directory in the CEM (excluding known Drupal-only extensions)', () => {
    const drupalOnlyExtensions = new Set([
      'hx-clinical-status',
      'hx-patient-banner',
      'hx-phi-field',
    ]);

    const hxDirs = componentDirs.filter(
      (d) => d.startsWith('hx-') && !drupalOnlyExtensions.has(d),
    );
    const cemTagNames = new Set(cemDeclarations.map((d) => d.tagName).filter(Boolean));

    const missing = hxDirs.filter((dirName) => !cemTagNames.has(dirName));

    expect(missing).toEqual([]);
  });

  // Test 8 — prop types in component.yml match CEM definitions
  //
  // Only checks hx-* components that exist in the CEM.  Drupal-only
  // extensions are skipped because they have no CEM counterpart.
  // JSON Schema `integer` is treated as compatible with a CEM `number` type.
  it('aligns component.yml prop types with CEM member types for hx-* components', () => {
    const failures: string[] = [];
    const cemTagNames = new Set(cemDeclarations.map((d) => d.tagName).filter(Boolean));
    const hxDirs = componentDirs.filter(
      (d) => d.startsWith('hx-') && cemTagNames.has(d),
    );

    for (const dirName of hxDirs) {
      const ymlPath = join(componentsDir, dirName, `${dirName}.component.yml`);
      if (!existsSync(ymlPath)) continue;

      const doc = load(readFileSync(ymlPath, 'utf8')) as ComponentYml;
      if (!doc.props?.properties) continue;

      const cemDecl = cemDeclarations.find((d) => d.tagName === dirName);
      if (!cemDecl?.members) continue;

      // Index CEM members by their attribute name (prefer attribute, fall back to name)
      const cemByAttr = new Map<string, CemMember>();
      for (const member of cemDecl.members) {
        if (member.kind === 'field' && member.type) {
          const key = member.attribute ?? member.name;
          cemByAttr.set(key, member);
        }
      }

      for (const [propKey, propDef] of Object.entries(doc.props.properties)) {
        const cemMember = cemByAttr.get(propKey);
        if (!cemMember?.type) continue; // prop only in yml — skip

        const cemMapped = mapCemType(cemMember.type.text);
        if (!typesAreCompatible(propDef.type, cemMapped)) {
          failures.push(
            `${dirName}.${propKey}: yml type is '${propDef.type}', CEM maps to '${cemMapped}' (raw: '${cemMember.type.text}')`,
          );
        }
      }
    }

    expect(failures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Negative test cases — inline mocks, no real files
// ---------------------------------------------------------------------------

describe('negative test cases', () => {
  // Test 9 — validation catches missing required name field
  it('catches a component.yml missing the required name field', () => {
    const broken: Partial<ComponentYml> = { status: 'experimental' };
    const errors = validateComponentYml(broken);
    expect(errors).toContain('missing required field: name');
  });

  // Test 10 — validation catches wrong props.type value
  it("catches a props block whose type is not 'object'", () => {
    const broken: Partial<ComponentYml> = {
      name: 'Broken',
      status: 'experimental',
      props: { type: 'array', properties: {} },
    };
    const errors = validateComponentYml(broken);
    expect(errors).toContain("props.type must be 'object', got 'array'");
  });
});
