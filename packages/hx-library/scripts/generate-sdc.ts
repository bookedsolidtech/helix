#!/usr/bin/env node
/**
 * generate-sdc.ts
 *
 * Reads the HELiX Custom Elements Manifest (custom-elements.json) and generates
 * complete Drupal Single Directory Component (SDC) directories for each component.
 *
 * Usage:
 *   tsx scripts/generate-sdc.ts [options]
 *
 * Options:
 *   --cem <path>         Path to custom-elements.json (default: ./custom-elements.json)
 *   --output <path>      Output directory (default: ./drupal/components)
 *   --component <name>   Generate only a specific component by tag name (optional)
 *   --help               Show help
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// CEM type definitions
// ---------------------------------------------------------------------------

export interface CemTypeRef {
  text: string;
}

export interface CemMember {
  kind: 'field' | 'method';
  name: string;
  type?: CemTypeRef;
  default?: string;
  description?: string;
  attribute?: string;
  reflects?: boolean;
  deprecated?: boolean | string;
  privacy?: 'private' | 'protected' | 'public';
  static?: boolean;
}

export interface CemSlot {
  name: string;
  description?: string;
}

export interface CemEvent {
  name: string;
  description?: string;
  type?: CemTypeRef;
}

export interface CemCssProperty {
  name: string;
  description?: string;
  default?: string;
}

export interface CemCssPart {
  name: string;
  description?: string;
}

export interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  description?: string;
  summary?: string;
  members?: CemMember[];
  slots?: CemSlot[];
  events?: CemEvent[];
  cssProperties?: CemCssProperty[];
  cssParts?: CemCssPart[];
  deprecated?: boolean | string;
}

export interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
}

export interface Cem {
  schemaVersion: string;
  modules: CemModule[];
}

// ---------------------------------------------------------------------------
// SDC intermediate representation
// ---------------------------------------------------------------------------

export interface SdcProp {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'object';
  title: string;
  description: string;
  default: string | boolean | number | null;
}

export interface SdcSlot {
  name: string;
  title: string;
  description: string;
}

export interface SdcComponent {
  tagName: string;
  name: string;
  description: string;
  deprecated: boolean | string;
  props: SdcProp[];
  slots: SdcSlot[];
  events: CemEvent[];
  cssProperties: CemCssProperty[];
  cssParts: CemCssPart[];
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

export interface CliArgs {
  cem: string;
  output: string;
  component: string | null;
  help: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    cem: './custom-elements.json',
    output: './drupal/components',
    component: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--cem' && argv[i + 1]) {
      args.cem = argv[++i];
    } else if (arg === '--output' && argv[i + 1]) {
      args.output = argv[++i];
    } else if (arg === '--component' && argv[i + 1]) {
      args.component = argv[++i];
    }
  }

  return args;
}

// ---------------------------------------------------------------------------
// CEM parsing
// ---------------------------------------------------------------------------

export function loadCem(cemPath: string): Cem {
  const raw = readFileSync(cemPath, 'utf-8');
  return JSON.parse(raw) as Cem;
}

export function extractComponents(cem: Cem): CemDeclaration[] {
  const components: CemDeclaration[] = [];

  for (const module of cem.modules) {
    if (module.kind !== 'javascript-module') continue;
    if (!module.declarations) continue;

    for (const decl of module.declarations) {
      if (decl.kind !== 'class') continue;
      if (!decl.tagName) continue;
      components.push(decl);
    }
  }

  return components;
}

// ---------------------------------------------------------------------------
// Type mapping
// ---------------------------------------------------------------------------

export function mapCemTypeToJsonSchema(
  typeText: string,
): 'string' | 'boolean' | 'number' | 'object' {
  const t = typeText.trim().toLowerCase();
  if (t === 'boolean') return 'boolean';
  if (t === 'number') return 'number';
  if (t === 'string') return 'string';
  return 'object';
}

// ---------------------------------------------------------------------------
// Component → SdcComponent transformation
// ---------------------------------------------------------------------------

export function transformDeclaration(decl: CemDeclaration): SdcComponent {
  const tagName = decl.tagName!;

  // Build props from members that are public fields with an attribute binding.
  const props: SdcProp[] = [];
  for (const member of decl.members ?? []) {
    if (member.kind !== 'field') continue;
    if (!member.attribute) continue;
    if (member.name === 'internals') continue;
    if (member.name.startsWith('_')) continue;
    if (member.privacy === 'private' || member.privacy === 'protected') continue;
    if (member.static) continue;

    const jsonSchemaType = mapCemTypeToJsonSchema(member.type?.text ?? 'string');
    const rawDefault = member.default ?? null;

    let parsedDefault: string | boolean | number | null = null;
    if (rawDefault !== null) {
      if (jsonSchemaType === 'boolean') {
        parsedDefault = rawDefault === 'true';
      } else if (jsonSchemaType === 'number') {
        const n = parseFloat(rawDefault);
        parsedDefault = isNaN(n) ? null : n;
      } else if (jsonSchemaType === 'string') {
        // Strip surrounding quotes if present
        parsedDefault = rawDefault.replace(/^['"]|['"]$/g, '');
      } else {
        // object — keep as string representation
        parsedDefault = rawDefault.replace(/^['"]|['"]$/g, '');
      }
    }

    props.push({
      name: member.name,
      type: jsonSchemaType,
      title: toTitleCase(member.name),
      description: member.description ?? '',
      default: parsedDefault,
    });
  }

  // Build slots
  const slots: SdcSlot[] = (decl.slots ?? []).map((slot) => ({
    name: slot.name,
    title: slot.name === '' ? 'Default' : toTitleCase(slot.name),
    description: slot.description ?? '',
  }));

  return {
    tagName,
    name: toHumanName(tagName),
    description: decl.description ?? decl.summary ?? '',
    deprecated: decl.deprecated ?? false,
    props,
    slots,
    events: decl.events ?? [],
    cssProperties: decl.cssProperties ?? [],
    cssParts: decl.cssParts ?? [],
  };
}

// ---------------------------------------------------------------------------
// File generators
// ---------------------------------------------------------------------------

export function generateComponentYml(component: SdcComponent): string {
  const lines: string[] = [];

  lines.push(
    `$schema: 'https://git.drupalcode.org/project/drupal/-/raw/HEAD/core/assets/schemas/v1/metadata.schema.json'`,
  );
  lines.push(`name: ${component.name}`);
  lines.push(`status: experimental`);
  lines.push(`group: HELiX`);

  if (component.deprecated) {
    const msg =
      typeof component.deprecated === 'string'
        ? component.deprecated
        : 'This component is deprecated.';
    lines.push(`deprecated: '${escapeYamlString(msg)}'`);
  }

  if (component.description) {
    lines.push(`description: '${escapeYamlString(component.description)}'`);
  }

  // Props
  if (component.props.length > 0) {
    lines.push(`props:`);
    lines.push(`  type: object`);
    lines.push(`  properties:`);

    for (const prop of component.props) {
      lines.push(`    ${prop.name}:`);
      lines.push(`      type: ${prop.type}`);
      lines.push(`      title: ${prop.title}`);
      if (prop.description) {
        lines.push(`      description: '${escapeYamlString(prop.description)}'`);
      }
      if (prop.default !== null) {
        if (prop.type === 'boolean') {
          lines.push(`      default: ${prop.default}`);
        } else if (prop.type === 'number') {
          lines.push(`      default: ${prop.default}`);
        } else {
          lines.push(`      default: '${escapeYamlString(String(prop.default))}'`);
        }
      }
    }
  }

  // Slots
  if (component.slots.length > 0) {
    lines.push(`slots:`);
    for (const slot of component.slots) {
      const slotKey = slot.name === '' ? 'default' : slot.name;
      lines.push(`  ${slotKey}:`);
      lines.push(`    title: ${slot.title}`);
      if (slot.description) {
        lines.push(`    description: '${escapeYamlString(slot.description)}'`);
      }
    }
  }

  lines.push(`libraryOverrides: {}`);
  lines.push('');

  return lines.join('\n');
}

export function generateTwig(component: SdcComponent): string {
  const lines: string[] = [];

  // File docblock
  lines.push(`{#`);
  lines.push(` /**`);
  lines.push(` * @file`);
  lines.push(` * ${component.name} component template.`);
  if (component.description) {
    lines.push(` *`);
    const descLines = component.description.split('\n');
    for (const dl of descLines) {
      lines.push(` * ${dl}`);
    }
  }
  if (component.props.length > 0) {
    lines.push(` *`);
    lines.push(` * Available variables:`);
    for (const prop of component.props) {
      const singleLineDesc = prop.description.replace(/\n/g, ' ').trim();
      lines.push(` * - ${prop.name}: ${prop.type} - ${singleLineDesc}`);
    }
  }
  lines.push(` */`);
  lines.push(`#}`);

  // Deprecation notice
  if (component.deprecated) {
    const msg =
      typeof component.deprecated === 'string'
        ? component.deprecated
        : 'This component is deprecated and will be removed in a future release.';
    lines.push(`{# DEPRECATED: ${msg} #}`);
  }

  // Opening tag with attributes
  const hasMultipleProps = component.props.length > 1;
  if (hasMultipleProps) {
    lines.push(`<${component.tagName}`);
    for (const prop of component.props) {
      if (prop.type === 'boolean') {
        lines.push(`  {% if ${prop.name} %}${toKebabCase(prop.name)}{% endif %}`);
      } else {
        lines.push(
          `  {% if ${prop.name} is defined and ${prop.name} is not empty %}${toKebabCase(prop.name)}="{{ ${prop.name} }}"{% endif %}`,
        );
      }
    }
    lines.push(`>`);
  } else if (component.props.length === 1) {
    const prop = component.props[0];
    if (prop.type === 'boolean') {
      lines.push(
        `<${component.tagName} {% if ${prop.name} %}${toKebabCase(prop.name)}{% endif %}>`,
      );
    } else {
      lines.push(
        `<${component.tagName} {% if ${prop.name} is defined and ${prop.name} is not empty %}${toKebabCase(prop.name)}="{{ ${prop.name} }}"{% endif %}>`,
      );
    }
  } else {
    lines.push(`<${component.tagName}>`);
  }

  // Named slots
  const namedSlots = component.slots.filter((s) => s.name !== '');
  for (const slot of namedSlots) {
    lines.push(`  {% if slots.${slot.name} is defined %}`);
    lines.push(`    <slot name="${slot.name}">{{ slots.${slot.name} }}</slot>`);
    lines.push(`  {% endif %}`);
  }

  // Default slot / content
  const hasDefaultSlot = component.slots.some((s) => s.name === '');
  if (hasDefaultSlot) {
    lines.push(`  {% if content is defined %}{{ content }}{% else %}<slot></slot>{% endif %}`);
  }

  lines.push(`</${component.tagName}>`);
  lines.push('');

  return lines.join('\n');
}

export function generateCss(component: SdcComponent): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${component.name} component styles.`);
  lines.push(` *`);
  lines.push(` * This component uses the @helixui/adopted-stylesheets pattern.`);
  lines.push(` * The JS file initializes AdoptedStylesheetsController which`);
  lines.push(` * handles stylesheet adoption into the shadow DOM.`);

  if (component.cssProperties.length > 0) {
    lines.push(` *`);
    lines.push(` * CSS Custom Properties:`);
    for (const prop of component.cssProperties) {
      const defaultNote = prop.default ? ` (default: ${prop.default})` : '';
      lines.push(` * ${prop.name}: ${prop.description ?? ''}${defaultNote}`);
    }
  }

  lines.push(` */`);
  lines.push('');
  lines.push(`/* Component host styles */`);
  lines.push(`${component.tagName} {`);
  lines.push(`  display: block;`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}

export function generateJs(component: SdcComponent): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * ${component.name} - Drupal SDC integration.`);
  lines.push(` * Registers the custom element and initializes adopted stylesheets.`);
  lines.push(` */`);
  lines.push(`import '@helixui/library/components/${component.tagName}';`);
  lines.push('');
  lines.push(`// Initialize adopted stylesheets for shadow DOM style injection`);
  lines.push(`// @see https://www.drupal.org/project/adopted_stylesheets`);
  lines.push(`if (typeof window !== 'undefined' && window.AdoptedStylesheetsController) {`);
  lines.push(`  new window.AdoptedStylesheetsController('${component.tagName}');`);
  lines.push(`}`);
  lines.push('');

  return lines.join('\n');
}

export function generateReadme(component: SdcComponent): string {
  const lines: string[] = [];

  lines.push(`# ${component.name}`);
  lines.push('');

  if (component.deprecated) {
    const msg =
      typeof component.deprecated === 'string'
        ? component.deprecated
        : 'This component is deprecated and will be removed in a future release.';
    lines.push(`> **Deprecated:** ${msg}`);
    lines.push('');
  }

  if (component.description) {
    lines.push(component.description);
    lines.push('');
  }

  // Usage example
  lines.push(`## Usage`);
  lines.push('');
  lines.push('```twig');
  lines.push(`{% include 'helix:${component.tagName}' with {`);
  for (const prop of component.props) {
    const val =
      prop.type === 'boolean'
        ? (prop.default ?? false)
        : prop.type === 'number'
          ? (prop.default ?? 0)
          : `'${prop.default ?? ''}'`;
    lines.push(`  ${prop.name}: ${val},`);
  }
  lines.push(`} %}`);
  lines.push('```');
  lines.push('');

  // Props table
  if (component.props.length > 0) {
    lines.push(`## Props`);
    lines.push('');
    lines.push(`| Prop | Type | Default | Description |`);
    lines.push(`|------|------|---------|-------------|`);
    for (const prop of component.props) {
      const def = prop.default !== null ? String(prop.default) : '-';
      lines.push(`| ${prop.name} | ${prop.type} | ${def} | ${prop.description} |`);
    }
    lines.push('');
  }

  // Slots table
  if (component.slots.length > 0) {
    lines.push(`## Slots`);
    lines.push('');
    lines.push(`| Slot | Description |`);
    lines.push(`|------|-------------|`);
    for (const slot of component.slots) {
      const slotLabel = slot.name === '' ? '(default)' : slot.name;
      lines.push(`| ${slotLabel} | ${slot.description} |`);
    }
    lines.push('');
  }

  // Events table
  if (component.events.length > 0) {
    lines.push(`## Events`);
    lines.push('');
    lines.push(`| Event | Description |`);
    lines.push(`|-------|-------------|`);
    for (const event of component.events) {
      lines.push(`| ${event.name} | ${event.description ?? ''} |`);
    }
    lines.push('');
  }

  // CSS Custom Properties table
  if (component.cssProperties.length > 0) {
    lines.push(`## CSS Custom Properties`);
    lines.push('');
    lines.push(`| Property | Default | Description |`);
    lines.push(`|----------|---------|-------------|`);
    for (const prop of component.cssProperties) {
      lines.push(`| ${prop.name} | ${prop.default ?? '-'} | ${prop.description ?? ''} |`);
    }
    lines.push('');
  }

  // CSS Parts table
  if (component.cssParts.length > 0) {
    lines.push(`## CSS Parts`);
    lines.push('');
    lines.push(`| Part | Description |`);
    lines.push(`|------|-------------|`);
    for (const part of component.cssParts) {
      lines.push(`| ${part.name} | ${part.description ?? ''} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Directory writer
// ---------------------------------------------------------------------------

export function writeComponentFiles(outputDir: string, component: SdcComponent): void {
  const dir = join(outputDir, component.tagName);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, `${component.tagName}.component.yml`),
    generateComponentYml(component),
    'utf-8',
  );
  writeFileSync(join(dir, `${component.tagName}.twig`), generateTwig(component), 'utf-8');
  writeFileSync(join(dir, `${component.tagName}.css`), generateCss(component), 'utf-8');
  writeFileSync(join(dir, `${component.tagName}.js`), generateJs(component), 'utf-8');
  writeFileSync(join(dir, 'README.md'), generateReadme(component), 'utf-8');
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

export function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toKebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

export function toHumanName(tagName: string): string {
  // e.g. "hx-accordion-item" → "HX Accordion Item"
  return tagName
    .split('-')
    .map((part) => {
      if (part === 'hx') return 'HX';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

export function escapeYamlString(str: string): string {
  return str.replace(/'/g, "''").replace(/\n/g, ' ');
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function printHelp(): void {
  console.log(`
generate-sdc — HELiX SDC Generator

Reads the Custom Elements Manifest and generates Drupal Single Directory
Component (SDC) directories for each web component.

Usage:
  tsx scripts/generate-sdc.ts [options]

Options:
  --cem <path>         Path to custom-elements.json
                       (default: ./custom-elements.json)
  --output <path>      Output directory for generated SDC components
                       (default: ./drupal/components)
  --component <name>   Generate only the specified component by tag name
                       e.g. --component hx-button
  --help               Show this help message

Examples:
  tsx scripts/generate-sdc.ts
  tsx scripts/generate-sdc.ts --cem ./custom-elements.json --output ./drupal/components
  tsx scripts/generate-sdc.ts --component hx-button
`);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function main(): void {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Resolve CEM path relative to cwd if not absolute
  const cemPath = args.cem.startsWith('/') ? args.cem : join(process.cwd(), args.cem);
  const outputPath = args.output.startsWith('/') ? args.output : join(process.cwd(), args.output);

  if (!existsSync(cemPath)) {
    console.error(`Error: CEM file not found at ${cemPath}`);
    console.error(`Run \`pnpm run cem\` first to generate the Custom Elements Manifest.`);
    process.exit(1);
  }

  console.log(`Reading CEM from: ${cemPath}`);
  console.log(`Writing SDC components to: ${outputPath}`);

  let cem: Cem;
  try {
    cem = loadCem(cemPath);
  } catch (err) {
    console.error(
      `Error: Failed to parse CEM file: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  const allDeclarations = extractComponents(cem);

  if (allDeclarations.length === 0) {
    console.warn('Warning: No components with tagName found in CEM.');
    process.exit(0);
  }

  // Filter by --component if specified
  const declarations =
    args.component !== null
      ? allDeclarations.filter((d) => d.tagName === args.component)
      : allDeclarations;

  if (args.component !== null && declarations.length === 0) {
    console.error(`Error: Component '${args.component}' not found in CEM.`);
    console.error(`Available components: ${allDeclarations.map((d) => d.tagName).join(', ')}`);
    process.exit(1);
  }

  mkdirSync(outputPath, { recursive: true });

  let generated = 0;
  let skipped = 0;

  for (const decl of declarations) {
    try {
      const component = transformDeclaration(decl);
      writeComponentFiles(outputPath, component);
      const deprecatedNote = component.deprecated ? ' (deprecated)' : '';
      console.log(`  Generated: ${component.tagName}${deprecatedNote}`);
      generated++;
    } catch (err) {
      console.error(
        `  Error generating ${decl.tagName}: ${err instanceof Error ? err.message : String(err)}`,
      );
      skipped++;
    }
  }

  console.log('');
  console.log(
    `Done. Generated ${generated} component(s).${skipped > 0 ? ` Skipped ${skipped} due to errors.` : ''}`,
  );
}

// Run main only when executed directly (not imported for tests)
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).endsWith(process.argv[1].split('/').pop() ?? '');

if (isMain) {
  main();
}
