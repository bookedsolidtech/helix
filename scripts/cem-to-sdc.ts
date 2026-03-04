#!/usr/bin/env tsx
/**
 * Generate Drupal Single Directory Component (SDC) .component.yml files from
 * the Custom Elements Manifest (CEM).
 *
 * Reads packages/hx-library/custom-elements.json and writes one
 * .component.yml per component into packages/hx-library/drupal/{tagName}/.
 *
 * Usage:
 *   npm run cem-to-sdc              # generate SDC files (skip existing)
 *   npm run cem-to-sdc -- --dry-run # preview without writing files
 *   npm run cem-to-sdc -- --force   # overwrite existing files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Types
// ============================================================================

interface CemTypeRef {
  text: string;
}

interface CemMember {
  kind: 'field' | 'method';
  name: string;
  attribute?: string;
  type?: CemTypeRef;
  default?: string;
  description?: string;
  privacy?: 'private' | 'protected' | 'public';
  readonly?: boolean;
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
  default?: string;
  description?: string;
}

interface CemDeclaration {
  kind: 'class';
  name: string;
  tagName?: string;
  description?: string;
  summary?: string;
  members?: CemMember[];
  slots?: CemSlot[];
  cssParts?: CemCssPart[];
  cssProperties?: CemCssProperty[];
}

interface CemModule {
  kind: 'javascript-module';
  path: string;
  declarations?: CemDeclaration[];
}

interface CustomElementsManifest {
  schemaVersion: string;
  modules: CemModule[];
}

// Structured representation of a single public attribute for SDC output
interface SdcProp {
  attribute: string;
  jsonType: 'string' | 'boolean' | 'number';
  description: string;
  defaultValue: string | undefined;
  enumValues: string[] | undefined;
}

// Structured representation of a single slot for SDC output
interface SdcSlot {
  key: string;
  title: string;
  description: string;
}

// All data needed to render one .component.yml
interface SdcComponent {
  tagName: string;
  description: string;
  props: SdcProp[];
  slots: SdcSlot[];
}

// ============================================================================
// Paths
// ============================================================================

const REPO_ROOT = path.resolve(__dirname, '..');
const CEM_PATH = path.join(REPO_ROOT, 'packages/hx-library/custom-elements.json');
const DRUPAL_DIR = path.join(REPO_ROOT, 'packages/hx-library/drupal');

// ============================================================================
// Type resolution helpers
// ============================================================================

/**
 * Capitalise the first character of a string and leave the rest untouched.
 * Matches the task spec: "variant" -> "Variant", "button-label" -> "Button-label".
 */
function capitalizeFirst(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Parse a CEM type text string and return the JSON Schema scalar type plus,
 * when the type is a string union of quoted literals, an array of enum values.
 *
 * Handles:
 *   'primary' | 'secondary'          -> string + enum
 *   | 'a'\n    | 'b'                 -> string + enum  (multiline leading-pipe style)
 *   boolean                          -> boolean
 *   number                           -> number
 *   string | undefined               -> string
 *   number | undefined               -> number
 *   string | null                    -> string
 *   AlertVariant (named alias)       -> string
 */
function resolveType(typeText: string): {
  jsonType: 'string' | 'boolean' | 'number';
  enumValues: string[] | undefined;
} {
  const normalized = typeText.trim();

  // Pure boolean
  if (normalized === 'boolean') {
    return { jsonType: 'boolean', enumValues: undefined };
  }

  // Pure number
  if (normalized === 'number') {
    return { jsonType: 'number', enumValues: undefined };
  }

  // Nullable / optional primitives — strip the | null / | undefined arm
  if (normalized === 'string | undefined' || normalized === 'string | null') {
    return { jsonType: 'string', enumValues: undefined };
  }
  if (normalized === 'number | undefined' || normalized === 'number | null') {
    return { jsonType: 'number', enumValues: undefined };
  }
  if (normalized === 'boolean | undefined' || normalized === 'boolean | null') {
    return { jsonType: 'boolean', enumValues: undefined };
  }

  // Detect quoted-literal unions: every pipe-separated arm must be a quoted string.
  // Supports both inline and multiline (leading-pipe) CEM formats.
  //   'primary' | 'secondary' | 'tertiary'
  //   | 'primary'\n    | 'secondary'
  const arms = normalized
    .split('|')
    .map((arm) => arm.trim())
    .filter((arm) => arm.length > 0);

  const allQuoted = arms.every((arm) => /^'[^']*'$/.test(arm) || /^"[^"]*"$/.test(arm));

  if (arms.length >= 2 && allQuoted) {
    const enumValues = arms.map((arm) => arm.slice(1, -1)); // strip surrounding quotes
    return { jsonType: 'string', enumValues };
  }

  // Everything else (named type aliases like AlertVariant, complex generics, etc.)
  return { jsonType: 'string', enumValues: undefined };
}

/**
 * Strip surrounding single or double quotes from a CEM default value string.
 * e.g. "'info'" -> "info", '"raised"' -> "raised", "true" -> "true"
 */
function stripStringDefault(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

// ============================================================================
// CEM Parser
// ============================================================================

function extractComponentsFromCEM(cemPath: string): SdcComponent[] {
  if (!fs.existsSync(cemPath)) {
    console.error(`ERROR: CEM file not found at: ${cemPath}`);
    console.error('       Run "npm run cem" to generate it first.');
    process.exit(1);
  }

  const cemContent = fs.readFileSync(cemPath, 'utf-8');
  const cem: CustomElementsManifest = JSON.parse(cemContent) as CustomElementsManifest;

  const components: SdcComponent[] = [];

  for (const module of cem.modules) {
    if (!module.declarations) continue;

    for (const declaration of module.declarations) {
      if (declaration.kind !== 'class' || !declaration.tagName) continue;

      const description =
        declaration.description || declaration.summary || `${declaration.name} component.`;

      // --- Props: public HTML attributes only ---
      const props: SdcProp[] = [];
      for (const member of declaration.members ?? []) {
        // Only include members that are exposed as HTML attributes
        if (!member.attribute) continue;
        // Exclude private members
        if (member.privacy === 'private' || member.privacy === 'protected') continue;

        const typeText = member.type?.text ?? 'string';
        const { jsonType, enumValues } = resolveType(typeText);

        // Resolve default value — strip string quotes, leave booleans/numbers as-is
        let defaultValue: string | undefined;
        if (member.default !== undefined) {
          defaultValue = stripStringDefault(member.default);
        }

        props.push({
          attribute: member.attribute,
          jsonType,
          description: member.description ?? '',
          defaultValue,
          enumValues,
        });
      }

      // --- Slots ---
      const slots: SdcSlot[] = [];
      for (const slot of declaration.slots ?? []) {
        // Empty string name is the default slot
        const key = slot.name === '' ? 'default' : slot.name;
        slots.push({
          key,
          title: capitalizeFirst(key),
          description: slot.description ?? `${capitalizeFirst(key)} slot.`,
        });
      }

      components.push({
        tagName: declaration.tagName,
        description,
        props,
        slots,
      });
    }
  }

  return components.sort((a, b) => a.tagName.localeCompare(b.tagName));
}

// ============================================================================
// YAML Generator
// ============================================================================

/**
 * Escape a string for safe embedding in a single-quoted YAML scalar.
 * Single quotes inside the value must be doubled.
 */
function yamlSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Hand-generate a .component.yml string from an SdcComponent.
 * Uses 2-space indentation throughout, matching Drupal SDC conventions.
 */
function generateComponentYml(component: SdcComponent): string {
  const { tagName, description, props, slots } = component;

  // Derive a human-readable display name: "hx-alert" -> "Helix Alert"
  const displayName =
    'Helix ' +
    tagName
      .replace(/^hx-/, '')
      .split('-')
      .map(capitalizeFirst)
      .join(' ');

  const lines: string[] = [];

  // --- Header ---
  lines.push(
    `$schema: 'https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/modules/sdc/src/metadata.schema.json'`,
  );
  lines.push(`name: ${displayName}`);
  lines.push(`description: ${yamlSingleQuote(description.replace(/\n/g, ' ').trim())}`);
  lines.push(`status: experimental`);
  lines.push(`group: helix`);

  // --- Props ---
  if (props.length > 0) {
    lines.push(``);
    lines.push(`props:`);
    lines.push(`  type: object`);
    lines.push(`  properties:`);

    for (const prop of props) {
      lines.push(`    ${prop.attribute}:`);
      lines.push(`      type: ${prop.jsonType}`);
      lines.push(`      title: ${capitalizeFirst(prop.attribute)}`);

      if (prop.description) {
        lines.push(
          `      description: ${yamlSingleQuote(prop.description.replace(/\n/g, ' ').trim())}`,
        );
      }

      if (prop.defaultValue !== undefined) {
        // Booleans and numbers go unquoted; strings get single-quoted
        if (prop.jsonType === 'boolean' || prop.jsonType === 'number') {
          lines.push(`      default: ${prop.defaultValue}`);
        } else {
          lines.push(`      default: ${yamlSingleQuote(prop.defaultValue)}`);
        }
      }

      if (prop.enumValues && prop.enumValues.length > 0) {
        lines.push(`      enum:`);
        for (const enumVal of prop.enumValues) {
          lines.push(`        - ${yamlSingleQuote(enumVal)}`);
        }
      }
    }
  }

  // --- Slots ---
  if (slots.length > 0) {
    lines.push(``);
    lines.push(`slots:`);

    for (const slot of slots) {
      lines.push(`  ${slot.key}:`);
      lines.push(`    title: ${slot.title}`);
      lines.push(`    description: ${yamlSingleQuote(slot.description.replace(/\n/g, ' ').trim())}`);
    }
  }

  lines.push(``);
  return lines.join('\n');
}

// ============================================================================
// File Writer
// ============================================================================

function writeSdcFiles(
  components: SdcComponent[],
  options: { dryRun?: boolean; force?: boolean } = {},
): void {
  const { dryRun = false, force = false } = options;

  if (!dryRun && !fs.existsSync(DRUPAL_DIR)) {
    fs.mkdirSync(DRUPAL_DIR, { recursive: true });
  }

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const component of components) {
    const componentDir = path.join(DRUPAL_DIR, component.tagName);
    const filePath = path.join(componentDir, `${component.tagName}.component.yml`);
    const ymlContent = generateComponentYml(component);

    const exists = fs.existsSync(filePath);

    if (dryRun) {
      if (exists && !force) {
        skipped++;
        console.log(
          `WOULD SKIP:   ${component.tagName}.component.yml (already exists, use --force to overwrite)`,
        );
      } else if (exists && force) {
        console.log(`WOULD UPDATE: ${component.tagName}.component.yml`);
      } else {
        console.log(`WOULD CREATE: ${component.tagName}.component.yml`);
      }
      continue;
    }

    // Skip existing files unless --force
    if (exists && !force) {
      skipped++;
      console.log(
        `Skipped:  ${component.tagName}.component.yml (already exists, use --force to overwrite)`,
      );
      continue;
    }

    // Ensure the per-component directory exists
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }

    fs.writeFileSync(filePath, ymlContent, 'utf-8');

    if (exists) {
      updated++;
      console.log(`Updated:  ${component.tagName}/${component.tagName}.component.yml`);
    } else {
      created++;
      console.log(`Created:  ${component.tagName}/${component.tagName}.component.yml`);
    }
  }

  if (dryRun) {
    console.log('\nDry run completed. No files were written.');
    console.log('Run without --dry-run to create files.');
  } else {
    console.log(`\nDone!`);
    console.log(`  Created: ${created} files`);
    console.log(`  Updated: ${updated} files`);
    console.log(`  Skipped: ${skipped} files`);
    console.log(`  Total:   ${created + updated} SDC component files`);
  }
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  console.log('Generating Drupal SDC .component.yml files from CEM...\n');

  const components = extractComponentsFromCEM(CEM_PATH);

  console.log(`Found ${components.length} components in CEM:\n`);
  components.forEach((c) => {
    console.log(`  - ${c.tagName}`);
  });
  console.log('');

  if (force) {
    console.log('--force flag enabled: will overwrite existing files\n');
  }

  if (dryRun) {
    console.log('--dry-run flag enabled: previewing without writing files\n');
  }

  writeSdcFiles(components, { dryRun, force });
}

main();
