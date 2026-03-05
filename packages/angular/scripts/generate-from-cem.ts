#!/usr/bin/env tsx
/**
 * generate-from-cem.ts
 *
 * CEM-to-Angular codegen script for @helixds/angular.
 *
 * Reads the Custom Elements Manifest (CEM) from packages/hx-library and
 * generates Angular directive and ControlValueAccessor files for each
 * custom element declaration.
 *
 * Usage:
 *   npm run generate          # from packages/angular/
 *   npx tsx scripts/generate-from-cem.ts
 *
 * Output:
 *   src/lib/directives/  — one directive file per custom element
 *   src/lib/value-accessors/  — one CVA file per form element
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── CEM Type Definitions ─────────────────────────────────────────────────────

interface CemAttributeOrProperty {
  name: string;
  type?: { text?: string };
  default?: string;
  description?: string;
  attribute?: string;
  reflects?: boolean;
}

interface CemEvent {
  name: string;
  type?: { text?: string };
  description?: string;
}

interface CemClassDeclaration {
  kind: 'class';
  name: string;
  tagName?: string;
  description?: string;
  attributes?: CemAttributeOrProperty[];
  members?: Array<
    (CemAttributeOrProperty & { kind: 'field' | 'method' }) | { kind: 'method'; name: string }
  >;
  events?: CemEvent[];
}

interface CemModule {
  kind: 'javascript-module';
  path: string;
  declarations?: CemClassDeclaration[];
}

interface Cem {
  schemaVersion: string;
  readme?: string;
  modules: CemModule[];
}

// ─── Form element detection ───────────────────────────────────────────────────

/**
 * Form elements that need a ControlValueAccessor.
 * The model type is 'boolean' for checkbox/switch, 'number' for slider,
 * 'string' for everything else.
 */
const FORM_ELEMENT_CONFIG: Record<
  string,
  {
    modelType: 'string' | 'boolean' | 'number';
    /**
     * The property on the web component that carries the model value.
     * Used in writeValue to set the correct DOM property.
     */
    domProperty: string;
    /** Events that trigger onChange (value sync). */
    changeEvents: string[];
    /** Events that trigger onTouched only. */
    touchedEvents: string[];
  }
> = {
  'hx-text-input': {
    modelType: 'string',
    domProperty: 'value',
    changeEvents: ['hx-input'],
    touchedEvents: ['hx-change'],
  },
  'hx-textarea': {
    modelType: 'string',
    domProperty: 'value',
    changeEvents: ['hx-input'],
    touchedEvents: ['hx-change'],
  },
  'hx-select': {
    modelType: 'string',
    domProperty: 'value',
    changeEvents: ['hx-change'],
    touchedEvents: [],
  },
  'hx-checkbox': {
    modelType: 'boolean',
    domProperty: 'checked',
    changeEvents: ['hx-change'],
    touchedEvents: [],
  },
  'hx-switch': {
    modelType: 'boolean',
    domProperty: 'checked',
    changeEvents: ['hx-change'],
    touchedEvents: [],
  },
  'hx-slider': {
    modelType: 'number',
    domProperty: 'value',
    changeEvents: ['hx-input'],
    touchedEvents: ['hx-change'],
  },
  'hx-radio-group': {
    modelType: 'string',
    domProperty: 'value',
    changeEvents: ['hx-change'],
    touchedEvents: [],
  },
};

function isFormElement(tagName: string): boolean {
  return tagName in FORM_ELEMENT_CONFIG;
}

// ─── Type mapping helpers ─────────────────────────────────────────────────────

/**
 * Maps a CEM type text to a TypeScript type suitable for an `@Input()`.
 * Returns `string` for unrecognised types to stay safe.
 */
function mapCemTypeToTs(cemType: string | undefined): string {
  if (!cemType) return 'string';

  const t = cemType.trim();

  // Boolean
  if (t === 'boolean' || t === 'Boolean') return 'boolean';

  // Number
  if (t === 'number' || t === 'Number') return 'number';

  // Union types like "'sm' | 'md' | 'lg'" — keep as-is if they look like string unions.
  if (t.startsWith("'") || t.includes(' | ')) return t;

  // Primitive aliases
  if (t === 'string' || t === 'String') return 'string';

  return 'string';
}

/**
 * Derives a sensible default value string for an `@Input()` property.
 */
function defaultForType(tsType: string, cemDefault: string | undefined): string {
  if (cemDefault !== undefined && cemDefault !== '') {
    // Strip surrounding quotes to get the raw value.
    const stripped = cemDefault.replace(/^['"]|['"]$/g, '');

    // Sentinel values — preserve as JS keywords, not string literals.
    if (stripped === 'undefined') return 'undefined';
    if (stripped === 'null') return 'null';

    // CEM stores defaults as stringified values.
    // Boolean and number defaults should not be quoted.
    if (tsType === 'boolean') {
      return stripped === 'true' ? 'true' : 'false';
    }
    if (tsType === 'number') {
      const n = parseFloat(stripped);
      return isNaN(n) ? '0' : String(n);
    }
    // String or union — use the CEM default, ensuring it is quoted.
    return `'${stripped}'`;
  }

  // If the type allows undefined (e.g. `number | undefined`), default to undefined.
  if (tsType.includes('undefined')) return 'undefined';
  if (tsType === 'boolean') return 'false';
  if (tsType === 'number') return '0';
  return "''";
}

// ─── Capitalisation helpers ───────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** hx-text-input → HxTextInput */
function tagNameToClassName(tagName: string): string {
  return toPascalCase(tagName);
}

/** hx-text-input → hx-text-input.directive.ts */
function tagNameToDirectiveFile(tagName: string): string {
  return `${tagName}.directive.ts`;
}

/** hx-text-input → helix-text-input-value-accessor.ts */
function tagNameToCvaFile(tagName: string): string {
  // Strip the 'hx-' prefix and prefix with 'helix-'.
  const withoutPrefix = tagName.replace(/^hx-/, '');
  return `helix-${withoutPrefix}-value-accessor.ts`;
}

// ─── Code generation ──────────────────────────────────────────────────────────

interface InputBinding {
  inputName: string;
  attributeName: string | undefined;
  tsType: string;
  defaultValue: string;
  description: string;
}

interface OutputBinding {
  outputName: string;
  angularOutputAlias: string;
  detailType: string;
  description: string;
}

function collectInputs(decl: CemClassDeclaration): InputBinding[] {
  const inputs: InputBinding[] = [];
  const seenNames = new Set<string>();
  const seenAliases = new Set<string>();

  // From attributes.
  for (const attr of decl.attributes ?? []) {
    if (seenNames.has(attr.name)) continue;
    seenNames.add(attr.name);

    const tsType = mapCemTypeToTs(attr.type?.text);
    const inputName = camelCase(attr.name);
    const attributeName = attr.name !== inputName ? attr.name : undefined;
    if (attributeName) seenAliases.add(attributeName);

    inputs.push({
      inputName,
      attributeName,
      tsType,
      defaultValue: defaultForType(tsType, attr.default),
      description: attr.description ?? '',
    });
  }

  // From class fields that have an `attribute` mapping (property bindings
  // where the attribute name differs from the property name, e.g. hx-size).
  for (const member of decl.members ?? []) {
    if (member.kind !== 'field') continue;
    const field = member as CemAttributeOrProperty & { kind: 'field' };
    if (seenNames.has(field.name)) continue;

    // Only include fields that are reflected as attributes.
    if (!field.attribute && !field.reflects) continue;

    // Skip if the attribute alias is already bound via an attribute entry.
    const alias = field.attribute !== field.name ? field.attribute : undefined;
    if (alias && seenAliases.has(alias)) continue;

    seenNames.add(field.name);
    if (alias) seenAliases.add(alias);

    const tsType = mapCemTypeToTs(field.type?.text);
    inputs.push({
      inputName: field.name,
      attributeName: alias,
      tsType,
      defaultValue: defaultForType(tsType, field.default),
      description: field.description ?? '',
    });
  }

  return inputs;
}

function collectOutputs(decl: CemClassDeclaration): OutputBinding[] {
  return (decl.events ?? []).map((event) => {
    // Convert event name to a camelCase Angular output property name.
    // hx-click → hxClick, hx-radio-select → hxRadioSelect
    const propName = camelCase(event.name);

    // Try to extract a detail type from the CEM event type text.
    // e.g. "CustomEvent<{value: string}>" → "{value: string}"
    const detailType = extractDetailType(event.type?.text);

    return {
      outputName: propName,
      angularOutputAlias: event.name,
      detailType,
      description: event.description ?? '',
    };
  });
}

/** Extracts the inner detail type from a CustomEvent<T> annotation. */
function extractDetailType(typeText: string | undefined): string {
  if (!typeText) return 'Record<string, unknown>';
  const match = /CustomEvent<(.+)>/.exec(typeText);
  if (match?.[1]) return match[1].trim();
  return 'Record<string, unknown>';
}

/** Converts a hyphenated or attribute name to camelCase. */
function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

// ─── Directive file generation ────────────────────────────────────────────────

function generateDirectiveFile(
  tagName: string,
  className: string,
  decl: CemClassDeclaration,
): string {
  const inputs = collectInputs(decl);
  const outputs = collectOutputs(decl);
  const isForm = isFormElement(tagName);

  const lines: string[] = [];

  // Imports
  const angularImports = ['Directive'];
  if (inputs.length > 0) angularImports.push('Input');
  if (outputs.length > 0) angularImports.push('Output', 'EventEmitter');
  if (!isForm && outputs.length > 0) {
    // Non-form directives may need ElementRef for future extension.
  }

  lines.push(`import { ${angularImports.join(', ')} } from '@angular/core';`);
  lines.push('');

  // Event detail type aliases
  for (const output of outputs) {
    const typeName = `${className}${toPascalCase(output.outputName)}EventDetail`;
    lines.push(
      `/** Detail shape for the \`${output.angularOutputAlias}\` event from \`${tagName}\`. */`,
    );
    // Use `type` alias (not `interface`) so it works for both object literals and
    // mapped types like `Record<string, unknown>`.
    lines.push(`export type ${typeName} = ${output.detailType};`);
    lines.push('');
  }

  // JSDoc
  const description =
    decl.description ?? `Angular directive wrapper for the \`<${tagName}>\` web component.`;
  lines.push(`/**`);
  lines.push(` * ${description.split('\n')[0]}`);
  if (isForm) {
    lines.push(` *`);
    lines.push(` * For two-way binding with Angular forms, pair this directive with`);
    lines.push(` * \`Helix${className.replace('Hx', '')}ValueAccessor\`.`);
  }
  lines.push(` */`);

  // Class declaration
  lines.push(`@Directive({`);
  lines.push(`  selector: '${tagName}',`);
  lines.push(`  standalone: true,`);
  lines.push(`})`);
  lines.push(`export class ${className}Directive {`);

  // Inputs
  for (const input of inputs) {
    if (input.description) {
      lines.push(`  /** ${input.description.split('\n')[0]} */`);
    }
    const decorator = input.attributeName ? `@Input('${input.attributeName}')` : '@Input()';
    lines.push(`  ${decorator} ${input.inputName}: ${input.tsType} = ${input.defaultValue};`);
    lines.push('');
  }

  // Outputs
  for (const output of outputs) {
    const typeName = `${className}${toPascalCase(output.outputName)}EventDetail`;
    if (output.description) {
      lines.push(`  /** ${output.description.split('\n')[0]} */`);
    }
    lines.push(
      `  @Output('${output.angularOutputAlias}') ${output.outputName} = new EventEmitter<CustomEvent<${typeName}>>();`,
    );
    lines.push('');
  }

  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── Value accessor file generation ──────────────────────────────────────────

function generateCvaFile(tagName: string, className: string): string {
  const config = FORM_ELEMENT_CONFIG[tagName];
  if (!config) {
    throw new Error(`No CVA config for ${tagName}`);
  }

  const { modelType, domProperty, changeEvents, touchedEvents } = config;
  const strippedName = className.replace(/^Hx/, '');
  const cvaClassName = `Helix${strippedName}ValueAccessor`;

  // Build selector — matches any of: formControlName, formControl, ngModel
  // Join on comma without newlines to produce a valid single-quoted string literal.
  const selector = [
    `${tagName}[formControlName]`,
    `${tagName}[formControl]`,
    `${tagName}[ngModel]`,
  ].join(', ');

  // Determine event detail type for @HostListener args
  const changeFnReturn =
    modelType === 'boolean'
      ? 'event.detail.checked'
      : modelType === 'number'
        ? 'event.detail.value'
        : 'event.detail.value';

  const writeValueBody =
    modelType === 'boolean'
      ? `this.renderer.setProperty(this.el.nativeElement, '${domProperty}', Boolean(value));`
      : modelType === 'number'
        ? `this.renderer.setProperty(\n      this.el.nativeElement,\n      '${domProperty}',\n      value !== null && value !== undefined ? value : 0,\n    );`
        : `this.renderer.setProperty(this.el.nativeElement, '${domProperty}', value ?? '');`;

  const lines: string[] = [];

  lines.push(`import {`);
  lines.push(`  Directive,`);
  lines.push(`  ElementRef,`);
  lines.push(`  HostListener,`);
  lines.push(`  PLATFORM_ID,`);
  lines.push(`  Renderer2,`);
  lines.push(`  forwardRef,`);
  lines.push(`  inject,`);
  lines.push(`} from '@angular/core';`);
  lines.push(`import { isPlatformBrowser } from '@angular/common';`);
  lines.push(`import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';`);
  lines.push('');
  lines.push(`/**`);
  lines.push(` * \`ControlValueAccessor\` for the \`<${tagName}>\` web component.`);
  lines.push(` *`);
  lines.push(` * Bridges Angular reactive/template-driven forms with \`${tagName}\`.`);
  lines.push(` * The model value is a \`${modelType}\`.`);
  lines.push(` * Activate by adding \`formControlName\`, \`formControl\`, or \`ngModel\`.`);
  lines.push(` *`);
  lines.push(` * SSR-safe: DOM property writes are guarded with \`isPlatformBrowser\`.`);
  lines.push(` */`);
  lines.push(`@Directive({`);
  lines.push(`  selector: '${selector}',`);
  lines.push(`  standalone: true,`);
  lines.push(`  providers: [`);
  lines.push(`    {`);
  lines.push(`      provide: NG_VALUE_ACCESSOR,`);
  lines.push(`      useExisting: forwardRef(() => ${cvaClassName}),`);
  lines.push(`      multi: true,`);
  lines.push(`    },`);
  lines.push(`  ],`);
  lines.push(`})`);
  lines.push(`export class ${cvaClassName} implements ControlValueAccessor {`);
  lines.push(`  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);`);
  lines.push(`  private readonly renderer = inject(Renderer2);`);
  lines.push(`  private readonly platformId = inject(PLATFORM_ID);`);
  lines.push('');
  // Use _onChange/_onTouched to avoid name collision with @HostListener methods.
  lines.push(`  private _onChange: (value: ${modelType}) => void = () => {};`);
  lines.push(`  private _onTouched: () => void = () => {};`);
  lines.push('');

  // onChange HostListeners
  for (const eventName of changeEvents) {
    const listenerMethodName = `on${toPascalCase(eventName.replace(/^hx-/, ''))}`;
    const detailType =
      modelType === 'boolean'
        ? `{ checked: boolean; value: string }`
        : modelType === 'number'
          ? `{ value: number }`
          : `{ value: string }`;
    lines.push(`  @HostListener('${eventName}', ['$event'])`);
    lines.push(`  ${listenerMethodName}(event: CustomEvent<${detailType}>): void {`);
    lines.push(`    this._onChange(${changeFnReturn});`);
    // Select and radio: also call onTouched on change
    if ((tagName === 'hx-select' || tagName === 'hx-radio-group') && touchedEvents.length === 0) {
      lines.push(`    this._onTouched();`);
    }
    // Checkbox and switch: also call onTouched on change
    if ((tagName === 'hx-checkbox' || tagName === 'hx-switch') && touchedEvents.length === 0) {
      lines.push(`    this._onTouched();`);
    }
    lines.push(`  }`);
    lines.push('');
  }

  // onTouched HostListeners
  for (const eventName of touchedEvents) {
    const listenerMethodName = `on${toPascalCase(eventName.replace(/^hx-/, ''))}Touched`;
    lines.push(`  @HostListener('${eventName}')`);
    lines.push(`  ${listenerMethodName}(): void {`);
    lines.push(`    this._onTouched();`);
    lines.push(`  }`);
    lines.push('');
  }

  lines.push(`  writeValue(value: ${modelType}): void {`);
  lines.push(`    if (isPlatformBrowser(this.platformId)) {`);
  lines.push(`      ${writeValueBody}`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  registerOnChange(fn: (value: ${modelType}) => void): void {`);
  lines.push(`    this._onChange = fn;`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  registerOnTouched(fn: () => void): void {`);
  lines.push(`    this._onTouched = fn;`);
  lines.push(`  }`);
  lines.push('');
  lines.push(`  setDisabledState(isDisabled: boolean): void {`);
  lines.push(`    if (isPlatformBrowser(this.platformId)) {`);
  lines.push(`      this.renderer.setProperty(this.el.nativeElement, 'disabled', isDisabled);`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

// ─── Index barrel regeneration ────────────────────────────────────────────────

function generateDirectiveIndex(
  entries: Array<{ tagName: string; decl: CemClassDeclaration }>,
): string {
  const lines: string[] = [];
  for (const { tagName, decl } of entries) {
    const fileName = tagNameToDirectiveFile(tagName).replace('.ts', '.js');
    const className = tagNameToClassName(tagName);
    const outputs = collectOutputs(decl);
    const typeNames = outputs.map((o) => `${className}${toPascalCase(o.outputName)}EventDetail`);

    if (typeNames.length > 0) {
      lines.push(`export { ${className}Directive } from './${fileName}';`);
      lines.push(`export type { ${typeNames.join(', ')} } from './${fileName}';`);
    } else {
      lines.push(`export { ${className}Directive } from './${fileName}';`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function generateCvaIndex(formTagNames: string[]): string {
  const lines: string[] = [];
  for (const tag of formTagNames) {
    const fileName = tagNameToCvaFile(tag).replace('.ts', '.js');
    const strippedName = tagNameToClassName(tag).replace(/^Hx/, '');
    const cvaClassName = `Helix${strippedName}ValueAccessor`;
    lines.push(`export { ${cvaClassName} } from './${fileName}';`);
  }
  lines.push('');
  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const packageRoot = path.resolve(scriptDir, '..');
  const cemPath = path.resolve(packageRoot, '../../packages/hx-library/custom-elements.json');

  if (!fs.existsSync(cemPath)) {
    console.error(`ERROR: CEM not found at ${cemPath}`);
    console.error('Run `npm run cem` in the hx-library package first.');
    process.exit(1);
  }

  const cemRaw = fs.readFileSync(cemPath, 'utf-8');
  const cem = JSON.parse(cemRaw) as Cem;

  const directivesDir = path.join(packageRoot, 'src', 'lib', 'directives');
  const cvaDir = path.join(packageRoot, 'src', 'lib', 'value-accessors');

  fs.mkdirSync(directivesDir, { recursive: true });
  fs.mkdirSync(cvaDir, { recursive: true });

  const generatedEntries: Array<{ tagName: string; decl: CemClassDeclaration }> = [];
  const formTagNames: string[] = [];

  for (const mod of cem.modules) {
    for (const decl of mod.declarations ?? []) {
      if (decl.kind !== 'class' || !decl.tagName) continue;

      const tagName = decl.tagName;
      const className = tagNameToClassName(tagName);

      console.log(`Generating directive for <${tagName}>...`);

      // Generate directive file.
      const directiveContent = generateDirectiveFile(tagName, className, decl);
      const directiveFilePath = path.join(directivesDir, tagNameToDirectiveFile(tagName));
      fs.writeFileSync(directiveFilePath, directiveContent, 'utf-8');

      generatedEntries.push({ tagName, decl });

      // Generate CVA file if this is a form element.
      if (isFormElement(tagName)) {
        console.log(`  -> Generating ControlValueAccessor for <${tagName}>...`);
        const cvaContent = generateCvaFile(tagName, className);
        const cvaFilePath = path.join(cvaDir, tagNameToCvaFile(tagName));
        fs.writeFileSync(cvaFilePath, cvaContent, 'utf-8');
        formTagNames.push(tagName);
      }
    }
  }

  // Regenerate barrel index files.
  const directiveIndexPath = path.join(directivesDir, 'index.ts');
  fs.writeFileSync(directiveIndexPath, generateDirectiveIndex(generatedEntries), 'utf-8');
  console.log(`Updated ${directiveIndexPath}`);

  const cvaIndexPath = path.join(cvaDir, 'index.ts');
  fs.writeFileSync(cvaIndexPath, generateCvaIndex(formTagNames), 'utf-8');
  console.log(`Updated ${cvaIndexPath}`);

  console.log('');
  console.log(
    `Done. Generated ${generatedEntries.length} directives, ${formTagNames.length} value accessors.`,
  );
}

main();
