/**
 * Shared Twig test helpers for drupal-starter SDC integration tests.
 *
 * Registers Drupal-specific Twig extensions so templates can be rendered
 * in a Node.js test context without a live Drupal instance.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// @ts-expect-error — twig does not ship TypeScript declarations
import Twig from 'twig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Absolute path to the drupal-starter package root. */
export const PACKAGE_ROOT = resolve(__dirname, '..', '..');

/** Absolute path to the SDC components directory. */
export const COMPONENTS_DIR = resolve(PACKAGE_ROOT, 'components');

/** Absolute path to the standalone templates directory. */
export const TEMPLATES_DIR = resolve(PACKAGE_ROOT, 'templates');

let _twigConfigured = false;

/**
 * Configure twig.js with Drupal-specific extensions.
 * Safe to call multiple times — idempotent.
 */
function configureTwig(): void {
  if (_twigConfigured) return;
  _twigConfigured = true;

  // `attach_library` is a Drupal-only function.  In tests it is a no-op
  // that returns an empty string so templates render without errors.
  Twig.extendFunction('attach_library', () => '');

  // `t()` is Drupal's translation filter.  Return the input unchanged.
  Twig.extendFilter('t', (value: string) => value);

  // `url_encode` filter — encode a string for use in a URL.
  Twig.extendFilter('url_encode', (value: string) => encodeURIComponent(String(value ?? '')));

  // `render` filter — in Drupal this renders a render array. In tests,
  // just return the value as-is (it will be a string in test context).
  Twig.extendFilter('render', (value: unknown) => String(value ?? ''));

  // `striptags` filter — strip HTML tags from a string.
  Twig.extendFilter('striptags', (value: string) => String(value ?? '').replace(/<[^>]*>/g, ''));
}

/**
 * Build a mock Drupal `attributes` object.
 *
 * In Drupal, `{{ attributes.addClass('foo') }}` is used inline inside an HTML
 * tag: `<div{{ attributes.addClass('foo') }}>`.  The method returns a string
 * that twig.js interpolates directly into the tag, so it must begin with a
 * space character.
 */
export function makeAttributes(initialClasses: string[] = []): {
  addClass: (...classes: string[]) => string;
  toString: () => string;
} {
  const classes = [...initialClasses];
  return {
    addClass(...newClasses: string[]) {
      classes.push(...newClasses.filter(Boolean));
      return ` class="${classes.join(' ')}"`;
    },
    toString() {
      return classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    },
  };
}

/** Counter used to generate unique template IDs for each render call. */
let _renderCounter = 0;

/**
 * Render a Twig template file with the given variables.
 *
 * Each call uses a unique template ID to prevent twig.js from throwing
 * "There is already a template with the ID" when the same file is rendered
 * multiple times with different variables.
 *
 * @param templatePath - Absolute path to the `.twig` file.
 * @param vars         - Template variables (props, slots, etc.).
 * @returns Rendered HTML string.
 */
export function renderTwig(templatePath: string, vars: Record<string, unknown> = {}): string {
  configureTwig();

  const rawSource = readFileSync(templatePath, 'utf-8');

  // Strip all {# ... #} Twig block comments before compilation.
  // twig.js does not support nested {# #} blocks (e.g. a {# ... #} comment
  // inside a larger {# ... #} doc block), which causes parse errors on
  // templates that contain JSDoc-style inline examples.
  // Stripping them is safe for tests — comments carry no runtime semantics.
  const source = rawSource.replace(/\{#[\s\S]*?#\}/g, '');

  // Use a unique ID per render call so the same template file can be
  // rendered multiple times in the same process with different variables.
  const uniqueId = `${templatePath}#${++_renderCounter}`;

  const template = Twig.twig({ id: uniqueId, data: source, rethrow: true });

  // Always inject a default attributes mock so templates that call
  // `{{ attributes.addClass(...) }}` don't throw.
  const mergedVars: Record<string, unknown> = {
    attributes: makeAttributes(),
    ...vars,
  };

  return template.render(mergedVars);
}

/**
 * Render an SDC template by component name.
 *
 * @param name - SDC name, e.g. `'article-teaser'`.
 * @param vars - Template variables.
 */
export function renderSdc(name: string, vars: Record<string, unknown> = {}): string {
  const path = resolve(COMPONENTS_DIR, name, `${name}.twig`);
  return renderTwig(path, vars);
}

/**
 * Render a standalone template by filename (without `.html.twig`).
 *
 * @param name - Template name, e.g. `'hx-button'`.
 * @param vars - Template variables.
 */
export function renderTemplate(name: string, vars: Record<string, unknown> = {}): string {
  const path = resolve(TEMPLATES_DIR, `${name}.html.twig`);
  return renderTwig(path, vars);
}
