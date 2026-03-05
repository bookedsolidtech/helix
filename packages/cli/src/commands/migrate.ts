/**
 * helix migrate — CEM-driven migration from Shoelace, Carbon, or Material UI
 *
 * Usage:
 *   helix migrate --from shoelace
 *   helix migrate --from carbon
 *   helix migrate --from material-ui
 *   helix migrate --from shoelace --cem ./path/to/custom-elements.json
 *   helix migrate --from shoelace --output ./migration-report.json
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── CEM types (Custom Elements Manifest 1.0.0) ──────────────────────────────

interface CemCssProperty {
  name: string;
  description?: string;
  default?: string;
}

interface CemCssPart {
  name: string;
  description?: string;
}

interface CemSlot {
  name: string;
  description?: string;
}

interface CemEvent {
  name: string;
  type?: { text: string };
  description?: string;
}

interface CemMember {
  name: string;
  kind: 'field' | 'method';
  type?: { text: string };
  description?: string;
  default?: string;
  attribute?: string;
}

interface CemDeclaration {
  kind?: string;
  tagName?: string;
  name: string;
  description?: string;
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssProperties?: CemCssProperty[];
  cssParts?: CemCssPart[];
}

interface CemModule {
  kind: string;
  path: string;
  declarations?: CemDeclaration[];
  exports?: unknown[];
}

interface CustomElementsManifest {
  schemaVersion: string;
  readme?: string;
  modules: CemModule[];
}

// ─── Migration mapping types ─────────────────────────────────────────────────

type SourceLibrary = 'shoelace' | 'carbon' | 'material-ui';

interface ComponentMapping {
  sourceTag: string;
  helixTag: string | null;
  status: 'direct' | 'partial' | 'manual' | 'no-equivalent';
  notes: string;
  attributeMap?: Record<string, string>;
  eventMap?: Record<string, string>;
}

interface MigrationResult {
  library: SourceLibrary;
  analyzed: number;
  mapped: number;
  partial: number;
  manual: number;
  noEquivalent: number;
  components: ComponentMapping[];
}

// ─── Component mapping tables ─────────────────────────────────────────────────

const SHOELACE_MAP: Record<string, Omit<ComponentMapping, 'sourceTag'>> = {
  'sl-button': {
    helixTag: 'hx-button',
    status: 'direct',
    notes: 'Direct replacement. Map variant prop: primary→primary, default→secondary.',
    attributeMap: { variant: 'variant', size: 'size', disabled: 'disabled', loading: 'loading' },
    eventMap: { 'sl-click': 'hx-click' },
  },
  'sl-input': {
    helixTag: 'hx-text-input',
    status: 'direct',
    notes: 'Direct replacement. Use hx-text-input for text fields.',
    attributeMap: {
      value: 'value',
      placeholder: 'placeholder',
      disabled: 'disabled',
      required: 'required',
      type: 'type',
    },
    eventMap: { 'sl-input': 'hx-input', 'sl-change': 'hx-change' },
  },
  'sl-checkbox': {
    helixTag: 'hx-checkbox',
    status: 'direct',
    notes: 'Direct replacement.',
    attributeMap: { checked: 'checked', disabled: 'disabled', indeterminate: 'indeterminate' },
    eventMap: { 'sl-change': 'hx-change' },
  },
  'sl-select': {
    helixTag: 'hx-select',
    status: 'direct',
    notes: 'Direct replacement. Map sl-option children to hx-option.',
    attributeMap: { value: 'value', disabled: 'disabled', multiple: 'multiple' },
    eventMap: { 'sl-change': 'hx-change' },
  },
  'sl-card': {
    helixTag: 'hx-card',
    status: 'direct',
    notes: 'Direct replacement.',
    attributeMap: {},
    eventMap: {},
  },
  'sl-badge': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No direct Helix equivalent. Use CSS utility classes or implement custom.',
  },
  'sl-alert': {
    helixTag: null,
    status: 'manual',
    notes: 'No direct equivalent. Consider hx-field with error state for form alerts.',
  },
  'sl-dialog': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No dialog component yet. Track roadmap for hx-dialog.',
  },
  'sl-tooltip': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No tooltip component yet. Track roadmap for hx-tooltip.',
  },
  'sl-dropdown': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No dropdown yet. Compose with hx-select for option-list patterns.',
  },
};

const CARBON_MAP: Record<string, Omit<ComponentMapping, 'sourceTag'>> = {
  'bx-btn': {
    helixTag: 'hx-button',
    status: 'direct',
    notes: 'Map kind prop: primary→primary, secondary→secondary, ghost→ghost.',
    attributeMap: { kind: 'variant', disabled: 'disabled', size: 'size' },
    eventMap: { 'bx-btn-clicked': 'hx-click' },
  },
  'cds-button': {
    helixTag: 'hx-button',
    status: 'direct',
    notes: 'Carbon v11 tag. Map kind→variant.',
    attributeMap: { kind: 'variant', disabled: 'disabled', size: 'size' },
    eventMap: { 'cds-button-clicked': 'hx-click' },
  },
  'bx-text-input': {
    helixTag: 'hx-text-input',
    status: 'direct',
    notes: 'Direct replacement.',
    attributeMap: {
      value: 'value',
      placeholder: 'placeholder',
      disabled: 'disabled',
      type: 'type',
    },
    eventMap: { 'bx-text-input-changed': 'hx-change' },
  },
  'cds-text-input': {
    helixTag: 'hx-text-input',
    status: 'direct',
    notes: 'Carbon v11 tag. Direct replacement.',
    attributeMap: { value: 'value', placeholder: 'placeholder', disabled: 'disabled' },
    eventMap: { 'cds-text-input-changed': 'hx-change' },
  },
  'bx-checkbox': {
    helixTag: 'hx-checkbox',
    status: 'direct',
    notes: 'Direct replacement.',
    attributeMap: { checked: 'checked', disabled: 'disabled', indeterminate: 'indeterminate' },
    eventMap: { 'bx-checkbox-changed': 'hx-change' },
  },
  'bx-select': {
    helixTag: 'hx-select',
    status: 'partial',
    notes: 'Partial: Carbon select uses bx-select-item children; map to hx-option.',
    attributeMap: { value: 'value', disabled: 'disabled' },
    eventMap: { 'bx-select-selected': 'hx-change' },
  },
  'bx-modal': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No Helix modal yet. Track roadmap for hx-dialog.',
  },
  'bx-data-table': {
    helixTag: null,
    status: 'manual',
    notes: 'Complex component. No direct equivalent. Requires custom implementation.',
  },
  'bx-loading': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No loading spinner yet. Track roadmap for hx-spinner.',
  },
};

const MATERIAL_UI_MAP: Record<string, Omit<ComponentMapping, 'sourceTag'>> = {
  'md-filled-button': {
    helixTag: 'hx-button',
    status: 'direct',
    notes: 'Map to hx-button variant="primary".',
    attributeMap: { disabled: 'disabled', 'trailing-icon': 'icon-right', 'has-icon': 'icon' },
    eventMap: { click: 'hx-click' },
  },
  'md-outlined-button': {
    helixTag: 'hx-button',
    status: 'direct',
    notes: 'Map to hx-button variant="secondary".',
    attributeMap: { disabled: 'disabled' },
    eventMap: { click: 'hx-click' },
  },
  'md-text-button': {
    helixTag: 'hx-button',
    status: 'direct',
    notes: 'Map to hx-button variant="ghost".',
    attributeMap: { disabled: 'disabled' },
    eventMap: { click: 'hx-click' },
  },
  'md-filled-text-field': {
    helixTag: 'hx-text-input',
    status: 'direct',
    notes: 'Direct replacement.',
    attributeMap: {
      value: 'value',
      label: 'label',
      disabled: 'disabled',
      required: 'required',
      type: 'type',
    },
    eventMap: { input: 'hx-input', change: 'hx-change' },
  },
  'md-outlined-text-field': {
    helixTag: 'hx-text-input',
    status: 'direct',
    notes: 'Direct replacement. Helix uses outlined style by default.',
    attributeMap: { value: 'value', label: 'label', disabled: 'disabled', required: 'required' },
    eventMap: { input: 'hx-input', change: 'hx-change' },
  },
  'md-checkbox': {
    helixTag: 'hx-checkbox',
    status: 'direct',
    notes: 'Direct replacement.',
    attributeMap: { checked: 'checked', disabled: 'disabled', indeterminate: 'indeterminate' },
    eventMap: { change: 'hx-change' },
  },
  'md-select': {
    helixTag: 'hx-select',
    status: 'partial',
    notes: 'Partial: md-select-option children → hx-option children.',
    attributeMap: { value: 'value', disabled: 'disabled', required: 'required' },
    eventMap: { change: 'hx-change' },
  },
  'md-dialog': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No Helix dialog yet. Track roadmap for hx-dialog.',
  },
  'md-circular-progress': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No spinner yet. Track roadmap for hx-spinner.',
  },
  'md-chip': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No chip component yet.',
  },
  'md-tabs': {
    helixTag: null,
    status: 'no-equivalent',
    notes: 'No tabs component yet. Track roadmap for hx-tabs.',
  },
};

const LIBRARY_MAPS: Record<SourceLibrary, Record<string, Omit<ComponentMapping, 'sourceTag'>>> = {
  shoelace: SHOELACE_MAP,
  carbon: CARBON_MAP,
  'material-ui': MATERIAL_UI_MAP,
};

// ─── CEM analysis ─────────────────────────────────────────────────────────────

function analyzeSourceCem(cemPath: string, library: SourceLibrary): MigrationResult {
  const raw = readFileSync(cemPath, 'utf-8');
  const cem = JSON.parse(raw) as CustomElementsManifest;
  const map = LIBRARY_MAPS[library];

  const components: ComponentMapping[] = [];

  for (const mod of cem.modules) {
    for (const decl of mod.declarations ?? []) {
      if (!decl.tagName) continue;

      const tag = decl.tagName;
      const mapping = map[tag];

      if (mapping) {
        components.push({ sourceTag: tag, ...mapping });
      } else {
        components.push({
          sourceTag: tag,
          helixTag: null,
          status: 'no-equivalent',
          notes: `No mapping defined for ${tag} in the ${library} migration table.`,
        });
      }
    }
  }

  return buildResult(library, components);
}

function analyzeLibraryDefaults(library: SourceLibrary): MigrationResult {
  const map = LIBRARY_MAPS[library];
  const components: ComponentMapping[] = Object.entries(map).map(([tag, mapping]) => ({
    sourceTag: tag,
    ...mapping,
  }));
  return buildResult(library, components);
}

function buildResult(library: SourceLibrary, components: ComponentMapping[]): MigrationResult {
  return {
    library,
    analyzed: components.length,
    mapped: components.filter((c) => c.status === 'direct').length,
    partial: components.filter((c) => c.status === 'partial').length,
    manual: components.filter((c) => c.status === 'manual').length,
    noEquivalent: components.filter((c) => c.status === 'no-equivalent').length,
    components,
  };
}

// ─── Wrapper generation ───────────────────────────────────────────────────────

function generateWrapper(mapping: ComponentMapping): string {
  if (!mapping.helixTag || mapping.status === 'no-equivalent') return '';

  const attrForwards = Object.entries(mapping.attributeMap ?? {})
    .map(([src, dst]) => `  // ${src} → ${dst}`)
    .join('\n');

  const eventForwards = Object.entries(mapping.eventMap ?? {})
    .map(([src, dst]) => `  // ${src} → ${dst}`)
    .join('\n');

  return `// Auto-generated migration wrapper: ${mapping.sourceTag} → ${mapping.helixTag}
// ${mapping.notes}
//
// Attribute mappings:
${attrForwards || '  // (none)'}
//
// Event mappings:
${eventForwards || '  // (none)'}
//
// Replace:
//   <${mapping.sourceTag} ...>...</${mapping.sourceTag}>
// With:
//   <${mapping.helixTag} ...>...</${mapping.helixTag}>
`;
}

// ─── Report rendering ─────────────────────────────────────────────────────────

function renderReport(result: MigrationResult): string {
  const lines: string[] = [
    `Helix Migration Report — ${result.library}`,
    '='.repeat(50),
    '',
    `  Analyzed : ${result.analyzed}`,
    `  Direct   : ${result.mapped}`,
    `  Partial  : ${result.partial}`,
    `  Manual   : ${result.manual}`,
    `  None     : ${result.noEquivalent}`,
    '',
    'Component Mappings',
    '-'.repeat(50),
  ];

  for (const c of result.components) {
    const icon =
      c.status === 'direct'
        ? '✓'
        : c.status === 'partial'
          ? '~'
          : c.status === 'manual'
            ? '!'
            : '✗';

    lines.push(`${icon}  ${c.sourceTag} → ${c.helixTag ?? '(no equivalent)'}`);
    lines.push(`     ${c.notes}`);

    if (c.attributeMap && Object.keys(c.attributeMap).length > 0) {
      lines.push(
        `     Attributes: ${Object.entries(c.attributeMap)
          .map(([k, v]) => `${k}→${v}`)
          .join(', ')}`,
      );
    }

    if (c.eventMap && Object.keys(c.eventMap).length > 0) {
      lines.push(
        `     Events:     ${Object.entries(c.eventMap)
          .map(([k, v]) => `${k}→${v}`)
          .join(', ')}`,
      );
    }

    lines.push('');
  }

  lines.push('-'.repeat(50));
  lines.push(`Migration guide: docs/migration/migrate-from-${result.library}.md`);

  return lines.join('\n');
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

export interface MigrateOptions {
  from: SourceLibrary;
  cem?: string;
  output?: string;
  json?: boolean;
  wrappers?: boolean;
}

export function runMigrate(options: MigrateOptions): void {
  const { from, cem, output, json: jsonOutput, wrappers } = options;

  if (!LIBRARY_MAPS[from]) {
    const valid = Object.keys(LIBRARY_MAPS).join(', ');
    console.error(`Error: unknown library "${from}". Valid options: ${valid}`);
    process.exit(1);
  }

  let result: MigrationResult;

  if (cem) {
    const cemPath = resolve(process.cwd(), cem);
    if (!existsSync(cemPath)) {
      console.error(`Error: CEM file not found at ${cemPath}`);
      process.exit(1);
    }
    console.log(`Analyzing CEM: ${cemPath}`);
    result = analyzeSourceCem(cemPath, from);
  } else {
    console.log(`Using built-in ${from} component map (no --cem provided)`);
    result = analyzeLibraryDefaults(from);
  }

  if (wrappers) {
    const wrapperOutput: string[] = [];
    for (const mapping of result.components) {
      const wrapper = generateWrapper(mapping);
      if (wrapper) wrapperOutput.push(wrapper);
    }
    const wrapperContent = wrapperOutput.join('\n' + '-'.repeat(60) + '\n');
    const wrapperFile = output
      ? output.replace(/\.json$/, '-wrappers.ts')
      : `helix-migration-wrappers-${from}.ts`;
    writeFileSync(wrapperFile, wrapperContent, 'utf-8');
    console.log(`Wrapper stubs written to: ${wrapperFile}`);
  }

  if (jsonOutput) {
    const jsonContent = JSON.stringify(result, null, 2);
    const jsonFile = output ?? `helix-migration-${from}.json`;
    writeFileSync(jsonFile, jsonContent, 'utf-8');
    console.log(`JSON report written to: ${jsonFile}`);
  } else {
    const report = renderReport(result);
    if (output) {
      writeFileSync(output, report, 'utf-8');
      console.log(`Report written to: ${output}`);
    } else {
      console.log(report);
    }
  }
}

// ─── Parse CLI args ───────────────────────────────────────────────────────────

export function parseMigrateArgs(args: string[]): MigrateOptions | null {
  let from: string | undefined;
  let cem: string | undefined;
  let output: string | undefined;
  let json = false;
  let wrappers = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--from' && args[i + 1]) {
      from = args[++i];
    } else if (arg === '--cem' && args[i + 1]) {
      cem = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      output = args[++i];
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--wrappers') {
      wrappers = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!from) {
    console.error('Error: --from is required. Example: helix migrate --from shoelace');
    printHelp();
    return null;
  }

  const result: MigrateOptions = { from: from as SourceLibrary, json, wrappers };
  if (cem !== undefined) result.cem = cem;
  if (output !== undefined) result.output = output;
  return result;
}

function printHelp(): void {
  console.log(`
helix migrate — CEM-driven migration from third-party component libraries

Usage:
  helix migrate --from <library> [options]

Libraries:
  shoelace      Shoelace (shoelace.style) → Helix
  carbon        IBM Carbon Design System → Helix
  material-ui   Google Material Web (MWC v3) → Helix

Options:
  --from <lib>       Source library to migrate from (required)
  --cem <path>       Path to source library's custom-elements.json for CEM analysis
  --output <path>    Write report to file (default: stdout)
  --json             Output JSON instead of text report
  --wrappers         Generate migration wrapper stub files
  --help, -h         Show this help

Examples:
  helix migrate --from shoelace
  helix migrate --from carbon --cem ./node_modules/@carbon/web-components/custom-elements.json
  helix migrate --from material-ui --json --output migration-report.json
  helix migrate --from shoelace --wrappers --output ./migration/
`);
}
