/**
 * CEM-to-Vue codegen script for @helixds/vue
 *
 * Reads packages/hx-library/custom-elements.json (Custom Elements Manifest)
 * and generates Vue 3 SFC wrapper files for each discovered custom element.
 *
 * Usage:
 *   npm run generate
 *   # or directly:
 *   tsx scripts/generate-wrappers.ts
 *
 * The script is intentionally standalone (no Vite/build involvement).
 * Run it after hx-library components change to regenerate wrappers.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------------------
// CEM type definitions (subset we care about)
// ---------------------------------------------------------------------------

interface CemAttribute {
  name: string
  type?: { text: string }
  default?: string
  description?: string
}

interface CemProperty {
  name: string
  attribute?: string
  type?: { text: string }
  default?: string
  description?: string
  readonly?: boolean
}

interface CemEvent {
  name: string
  type?: { text: string }
  description?: string
}

interface CemSlot {
  name: string
  description?: string
}

interface CemDeclaration {
  kind: string
  name: string
  tagName?: string
  attributes?: CemAttribute[]
  members?: CemProperty[]
  events?: CemEvent[]
  slots?: CemSlot[]
}

interface CemModule {
  kind: string
  path: string
  declarations?: CemDeclaration[]
}

interface CemManifest {
  schemaVersion: string
  readme?: string
  modules: CemModule[]
}

// ---------------------------------------------------------------------------
// Form component configuration
// ---------------------------------------------------------------------------

/** Components that need v-model support and how they map */
interface FormConfig {
  modelType: 'string' | 'boolean' | 'number'
  modelDefault: string
  /** Name of the wc property that carries the model value */
  wcProp: 'value' | 'checked'
  /** hx-* event that fires on change */
  changeEvent: string
  /** Optional separate input event (text-like components) */
  inputEvent?: string
  /** Property on event.detail that holds the new value */
  detailProp: 'value' | 'checked'
}

const FORM_COMPONENTS: Record<string, FormConfig> = {
  'hx-text-input': {
    modelType: 'string',
    modelDefault: "''",
    wcProp: 'value',
    changeEvent: 'hx-change',
    inputEvent: 'hx-input',
    detailProp: 'value',
  },
  'hx-textarea': {
    modelType: 'string',
    modelDefault: "''",
    wcProp: 'value',
    changeEvent: 'hx-change',
    inputEvent: 'hx-input',
    detailProp: 'value',
  },
  'hx-select': {
    modelType: 'string',
    modelDefault: "''",
    wcProp: 'value',
    changeEvent: 'hx-change',
    detailProp: 'value',
  },
  'hx-radio-group': {
    modelType: 'string',
    modelDefault: "''",
    wcProp: 'value',
    changeEvent: 'hx-change',
    detailProp: 'value',
  },
  'hx-slider': {
    modelType: 'number',
    modelDefault: '0',
    wcProp: 'value',
    changeEvent: 'hx-change',
    detailProp: 'value',
  },
  'hx-checkbox': {
    modelType: 'boolean',
    modelDefault: 'false',
    wcProp: 'checked',
    changeEvent: 'hx-change',
    detailProp: 'checked',
  },
  'hx-switch': {
    modelType: 'boolean',
    modelDefault: 'false',
    wcProp: 'checked',
    changeEvent: 'hx-change',
    detailProp: 'checked',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a kebab-case tag name to PascalCase component name.
 * e.g. "hx-text-input" -> "HxTextInput"
 */
function toPascalCase(tag: string): string {
  return tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Converts a kebab-case attribute name to camelCase prop name.
 * e.g. "hx-size" -> "hxSize", "help-text" -> "helpText"
 */
function toCamelCase(attr: string): string {
  return attr.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
}

/**
 * Resolves a CEM type text to a TypeScript type string.
 * Falls back to `string` for unknown named types that aren't resolvable
 * in the generated SFC scope.
 */
function resolveType(typeText: string | undefined): string {
  if (!typeText) return 'string'
  // Normalize whitespace (CEM sometimes emits multi-line type unions)
  const cleaned = typeText.trim().replace(/\s+/g, ' ')
  if (cleaned === 'boolean') return 'boolean'
  if (cleaned === 'number') return 'number'
  if (cleaned === 'string') return 'string'
  // Pass through types that contain quotes (string literals) or pipes
  // These are inline union types that are valid TypeScript
  if (cleaned.includes("'") || cleaned.includes('"')) return cleaned
  // Handle primitives with undefined: "string | undefined" etc.
  if (/^(string|number|boolean)(\s*\|\s*undefined)?$/.test(cleaned)) return cleaned
  // Plain identifier (e.g. "AlertVariant") — not resolvable in SFC scope;
  // fall back to string to keep the generated file compilable
  return 'string'
}

/**
 * Builds the TypeScript interface block for component props.
 */
function buildPropsInterface(
  attrs: CemAttribute[],
  formConfig: FormConfig | undefined,
): string {
  const lines: string[] = ['interface Props {']

  for (const attr of attrs) {
    // Skip the model-bound prop from the Props interface (handled via defineModel)
    if (formConfig && attr.name === formConfig.wcProp) continue

    const camel = toCamelCase(attr.name)
    const tsType = resolveType(attr.type?.text)
    const optional = '?'
    if (attr.description) {
      lines.push(`  /** ${attr.description} */`)
    }
    lines.push(`  ${camel}${optional}: ${tsType}`)
  }

  lines.push('}')
  return lines.join('\n')
}

/**
 * Builds the template attribute bindings for the host custom element.
 */
function buildTemplateBindings(
  attrs: CemAttribute[],
  formConfig: FormConfig | undefined,
): string {
  const lines: string[] = []

  // Model binding
  if (formConfig) {
    lines.push(`    :${formConfig.wcProp}="model"`)
  }

  for (const attr of attrs) {
    if (formConfig && attr.name === formConfig.wcProp) continue
    const camel = toCamelCase(attr.name)
    // Attribute names with uppercase letters need :kebab-case binding
    lines.push(`    :${attr.name}="props.${camel}"`)
  }

  return lines.join('\n')
}

/**
 * Builds the event bindings for the template.
 */
function buildEventBindings(
  events: CemEvent[],
  formConfig: FormConfig | undefined,
): string {
  const lines: string[] = []

  if (formConfig) {
    if (formConfig.inputEvent) {
      lines.push(`    @${formConfig.inputEvent}="handleInput"`)
    }
    lines.push(`    @${formConfig.changeEvent}="handleChange"`)
    // Passthrough for remaining non-model events
    const nonModelEvents = events.filter(
      (e) =>
        e.name !== formConfig.changeEvent && e.name !== formConfig.inputEvent,
    )
    for (const ev of nonModelEvents) {
      lines.push(`    @${ev.name}="emit('${ev.name}', $event as CustomEvent)"`)
    }
  } else {
    for (const ev of events) {
      lines.push(`    @${ev.name}="emit('${ev.name}', $event as CustomEvent)"`)
    }
  }

  return lines.join('\n')
}

/**
 * Builds the slot elements for the template.
 */
function buildSlots(slots: CemSlot[]): string {
  const lines: string[] = []
  for (const slot of slots) {
    if (!slot.name) {
      lines.push('    <slot />')
    } else {
      lines.push(`    <slot name="${slot.name}" slot="${slot.name}" />`)
    }
  }
  // Always ensure a default slot exists
  if (!slots.find((s) => !s.name)) {
    lines.push('    <slot />')
  }
  return lines.join('\n')
}

/**
 * Generates the complete Vue SFC source for a custom element.
 */
function generateSfc(decl: CemDeclaration): string {
  const tag = decl.tagName ?? ''
  const componentName = toPascalCase(tag)
  const formConfig = FORM_COMPONENTS[tag]

  // Collect attributes (prefer attributes over members for template bindings)
  const attrs: CemAttribute[] = decl.attributes ?? []
  const events: CemEvent[] = decl.events ?? []
  const slots: CemSlot[] = decl.slots ?? []

  const propsInterface = buildPropsInterface(attrs, formConfig)
  const templateBindings = buildTemplateBindings(attrs, formConfig)
  const eventBindings = buildEventBindings(events, formConfig)
  const slotMarkup = buildSlots(slots)

  // Build emit declarations
  const emitLines: string[] = []
  const passedEvents = formConfig
    ? events.filter(
        (e) =>
          e.name !== formConfig.changeEvent &&
          e.name !== formConfig.inputEvent,
      )
    : events
  for (const ev of passedEvents) {
    emitLines.push(`  '${ev.name}': [event: CustomEvent]`)
  }

  // Build handler functions for form components
  const handlerLines: string[] = []
  if (formConfig) {
    const detailType =
      formConfig.modelType === 'boolean'
        ? '{ checked: boolean; value: string }'
        : formConfig.modelType === 'number'
          ? '{ value: number }'
          : '{ value: string }'

    if (formConfig.inputEvent) {
      handlerLines.push(
        `function handleInput(e: Event): void {`,
        `  const detail = (e as CustomEvent<${detailType}>).detail`,
        `  model.value = detail.${formConfig.detailProp} as ${formConfig.modelType}`,
        `  emit('${formConfig.inputEvent}', e as CustomEvent)`,
        `}`,
      )
    }

    handlerLines.push(
      `function handleChange(e: Event): void {`,
      `  const detail = (e as CustomEvent<${detailType}>).detail`,
      `  model.value = detail.${formConfig.detailProp} as ${formConfig.modelType}`,
      `  emit('${formConfig.changeEvent}', e as CustomEvent)`,
      `}`,
    )
  }

  // Assemble script block
  const scriptParts: string[] = [
    `import '@helix/library/components/${tag}'`,
    '',
    propsInterface,
    '',
  ]

  if (formConfig) {
    scriptParts.push(
      `const model = defineModel<${formConfig.modelType}>({ default: ${formConfig.modelDefault} })`,
      '',
    )
  }

  if (attrs.length > 0) {
    scriptParts.push(`const props = defineProps<Props>()`, '')
  }

  if (emitLines.length > 0 || (formConfig && events.length > 0)) {
    const allEmitLines = [...emitLines]
    if (formConfig) {
      if (formConfig.inputEvent) {
        allEmitLines.push(`  '${formConfig.inputEvent}': [event: CustomEvent]`)
      }
      allEmitLines.push(`  '${formConfig.changeEvent}': [event: CustomEvent]`)
    }
    scriptParts.push(
      `const emit = defineEmits<{`,
      allEmitLines.join('\n'),
      `}>()`,
      '',
    )
  }

  if (handlerLines.length > 0) {
    scriptParts.push(...handlerLines, '')
  }

  const templateBindingStr = templateBindings ? `\n${templateBindings}` : ''
  const eventBindingStr = eventBindings ? `\n${eventBindings}` : ''

  const sfc = `<script setup lang="ts">
${scriptParts.join('\n').trimEnd()}
</script>

<template>
  <${tag}${templateBindingStr}${eventBindingStr}
  >
${slotMarkup}
  </${tag}>
</template>
`

  return sfc
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const cemPath = resolve(
    __dirname,
    '../../hx-library/custom-elements.json',
  )
  const outputDir = resolve(__dirname, '../src/components')

  // Read and parse the CEM manifest
  let manifest: CemManifest
  try {
    const raw = readFileSync(cemPath, 'utf-8')
    manifest = JSON.parse(raw) as CemManifest
  } catch (err) {
    console.error(`Failed to read CEM at ${cemPath}:`, err)
    process.exit(1)
  }

  // Collect all custom element declarations
  const elements: CemDeclaration[] = []
  for (const mod of manifest.modules) {
    for (const decl of mod.declarations ?? []) {
      if (decl.kind === 'class' && decl.tagName) {
        elements.push(decl)
      }
    }
  }

  if (elements.length === 0) {
    console.warn('No custom element declarations found in CEM manifest.')
    return
  }

  mkdirSync(outputDir, { recursive: true })

  let generated = 0
  for (const decl of elements) {
    const componentName = toPascalCase(decl.tagName ?? '')
    const sfc = generateSfc(decl)
    const outPath = resolve(outputDir, `${componentName}.vue`)
    writeFileSync(outPath, sfc, 'utf-8')
    console.log(`  Generated ${outPath}`)
    generated++
  }

  console.log(`\nDone. Generated ${generated} Vue wrapper(s) from CEM.`)
}

main()
