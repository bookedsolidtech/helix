/**
 * Pure identifier helpers for the tree-shake generator, extracted so they can be
 * unit-tested without running the (side-effectful) generator.
 *
 * The generated `export const <name>` declarations and barrel re-exports must be
 * valid ESM with NO duplicate exports, across ~4,300 icon ids spanning four
 * libraries. Two failure modes have to be handled:
 *   1. Ids that are reserved words (`delete`, `import`, `package`) or start with
 *      a digit (`0`, `360-degrees`) — invalid as a bare identifier.
 *   2. Distinct ids that camelCase to the SAME identifier (Lucide ships both
 *      `arrow-up-10` and `arrow-up-1-0` → `arrowUp10`) — duplicate exports.
 */

/**
 * Reserved words (strict-mode + module-context) that cannot appear as a bare
 * `export const <name>`.
 */
export const RESERVED_WORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'let',
  'static',
  'await',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
]);

/**
 * Convert kebab-case to a JS-safe camelCase identifier. Digit-leading names and
 * reserved-word collisions are prefixed with `_`.
 */
export function toIdentifier(kebab: string): string {
  const camel = kebab.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
  return /^[0-9]/.test(camel) || RESERVED_WORDS.has(camel) ? `_${camel}` : camel;
}

/**
 * Injective fallback identifier: kebab `-` → `_`, with no camelCasing. Source
 * ids never contain `_`, so this is unique across the (unique) id set. Used only
 * to break a camelCase collision.
 */
export function toUnderscoreId(kebab: string): string {
  const u = kebab.replace(/-/g, '_');
  return /^[0-9]/.test(u) || RESERVED_WORDS.has(u) ? `_${u}` : u;
}

/**
 * Assign a unique export identifier to every id. The camelCase name is kept for
 * non-colliding ids (so existing helix/fa-free export names are stable); ids
 * whose camelCase collides fall back to the injective underscore form.
 *
 * @throws if any identifier still collides after disambiguation (defensive — the
 *   underscore form is injective for the `-`/alphanumeric id charset, so this
 *   would only fire on an unexpected source id shape).
 */
export function assignIdentifiers(ids: readonly string[]): Map<string, string> {
  const preferred = new Map(ids.map((id) => [id, toIdentifier(id)] as const));
  const freq = new Map<string, number>();
  for (const ident of preferred.values()) freq.set(ident, (freq.get(ident) ?? 0) + 1);

  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const id of ids) {
    const camel = preferred.get(id) as string;
    const ident = (freq.get(camel) ?? 0) > 1 ? toUnderscoreId(id) : camel;
    if (used.has(ident)) {
      throw new Error(`[tree-shake] unresolved identifier collision on '${ident}' (id '${id}')`);
    }
    used.add(ident);
    out.set(id, ident);
  }
  return out;
}
