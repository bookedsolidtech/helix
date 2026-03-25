import type { CemDeclaration, CemMember, CemProperty } from './types.js';

/**
 * Converts hx-button -> HxButton (PascalCase component name).
 */
export function toPascalCase(tagName: string): string {
  return tagName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Converts hx-change -> onHxChange (React/Vue event callback prop name).
 */
export function toEventCallbackName(eventName: string): string {
  const camelCase = eventName
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  return 'on' + camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Converts hx-change -> hxChange (camelCase).
 */
export function toCamelCase(name: string): string {
  return name
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

/**
 * Converts hx-click -> HxClick (PascalCase for Angular @Output).
 */
export function toAngularOutputName(eventName: string): string {
  return toPascalCase(eventName);
}

/** DOM-global type names that are valid without imports. */
const DOM_GLOBAL_TYPES = new Set([
  'Element',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLDialogElement',
  'HTMLFormElement',
  'HTMLInputElement',
  'HTMLSlotElement',
  'File',
  'ValidityState',
  'ElementInternals',
  'Event',
  'CustomEvent',
  'EventTarget',
  'Node',
]);

/** Primitive and built-in TypeScript types safe to use without imports. */
const SAFE_BUILTIN_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'unknown',
  'any',
  'never',
  'void',
  'object',
  'Record',
  'Partial',
  'Set',
  'Map',
  'Array',
  'Date',
  'ReturnType',
]);

function isKnownSafeType(token: string): boolean {
  const base = token.replace(/\[\]$/, '').split('<')[0] ?? token;
  return SAFE_BUILTIN_TYPES.has(base) || DOM_GLOBAL_TYPES.has(base);
}

/**
 * Sanitizes a CEM type string for use in TypeScript source.
 * Named types from the library that cannot be imported are replaced with `string`.
 */
export function sanitizeType(typeText: string | undefined): string {
  if (!typeText) return 'unknown';

  const normalized = typeText.replace(/\s+/g, ' ').trim();

  // Handle parenthesized array types like (A | B | C)[]
  const parenArrayMatch = normalized.match(/^\((.+)\)\[\]$/);
  if (parenArrayMatch) {
    const innerSanitized = sanitizeType(parenArrayMatch[1]);
    return `(${innerSanitized})[]`;
  }

  const unionParts = normalized.split('|').map((part) => part.trim());

  const sanitizedParts = unionParts.map((part) => {
    if (part.startsWith("'") || part.startsWith('"')) return part;
    if (part === 'null' || part === 'undefined') return part;

    const baseToken = part.replace(/\[\]$/, '').split('<')[0]?.trim() ?? part;
    if (isKnownSafeType(baseToken)) return part;

    return 'string';
  });

  return sanitizedParts.join(' | ');
}

/**
 * Returns public properties from a CEM declaration (non-private, non-internal fields).
 */
export function getPublicProperties(decl: CemDeclaration): CemProperty[] {
  if (!decl.members) return [];
  return decl.members
    .filter(
      (m: CemMember) =>
        m.kind === 'field' &&
        !m.name.startsWith('_') &&
        !m.name.startsWith('#') &&
        m.name !== 'formAssociated',
    )
    .map((m: CemMember) => ({
      name: m.name,
      type: m.type,
      description: m.description,
      default: m.default,
      attribute: m.attribute,
      reflects: m.reflects,
    }));
}

/**
 * Derives the component directory name from the CEM module path.
 * e.g. "src/components/hx-button/hx-button.ts" -> "hx-button"
 */
export function getComponentDir(modulePath: string): string {
  const parts = modulePath.split('/');
  return parts[2] ?? modulePath;
}

/**
 * Escapes JSDoc comment content to avoid breaking the comment block.
 */
export function escapeJsDoc(text: string): string {
  return text.replace(/\*\//g, '*\\/');
}
