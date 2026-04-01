/**
 * Bundled breaking-changes manifest for @helixui/mcp.
 *
 * This manifest is generated from changesets during each HELiX release and
 * bundled into the package. The migrate-version MCP tool reads this manifest
 * to produce version-specific migration plans for consumer projects.
 *
 * Schema version: 1
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BreakingChangeType =
  | 'renamed-property'
  | 'renamed-event'
  | 'renamed-slot'
  | 'renamed-csspart'
  | 'renamed-token'
  | 'renamed-import'
  | 'removed-property'
  | 'behavior-change';

export interface BreakingChange {
  /** Unique ID for this breaking change. */
  id: string;
  /** The library version that introduced this breaking change. */
  version: string;
  /** Category of the breaking change. */
  type: BreakingChangeType;
  /** The component this change applies to, or undefined for package-level changes. */
  component?: string;
  /** Human-readable explanation of what changed and why. */
  description: string;
  /** Code example showing the old (pre-migration) usage. */
  before: string;
  /** Code example showing the new (post-migration) usage. */
  after: string;
  /**
   * Regular expression pattern (as a string) to search for affected code.
   * Used to locate occurrences in consumer project files.
   */
  searchPattern: string;
  /** Regex flags for the search pattern (default: 'g'). */
  searchFlags?: string;
  /**
   * Replacement string to apply when searchPattern matches.
   * Supports $1, $2, etc. back-references from searchPattern capture groups.
   * Undefined for changes that cannot be automatically migrated.
   */
  replacePattern?: string;
  /**
   * File extensions to include in the scan (without the leading dot).
   * e.g. ['ts', 'tsx', 'js', 'jsx', 'html', 'twig']
   */
  fileExtensions: string[];
}

export interface BreakingChangesManifest {
  schemaVersion: '1';
  generatedAt: string;
  changes: BreakingChange[];
}

// ─── Manifest data ─────────────────────────────────────────────────────────────

export const BREAKING_CHANGES_MANIFEST: BreakingChangesManifest = {
  schemaVersion: '1',
  generatedAt: '2026-03-01T00:00:00.000Z',
  changes: [
    // ── v0.2.0 breaking changes ───────────────────────────────────────────────

    {
      id: 'v0.2.0-token-color-accent-renamed',
      version: '0.2.0',
      type: 'renamed-token',
      description:
        'The early prototype token --hx-color-accent was consolidated into the primary color ' +
        'palette as --hx-color-primary-500 during the 0.2.0 design token audit. Consumers ' +
        'overriding this token must update their CSS to use the new name.',
      before: '/* Before */\n:root {\n  --hx-color-accent: #2563eb;\n}',
      after: '/* After */\n:root {\n  --hx-color-primary-500: #2563eb;\n}',
      searchPattern: '--hx-color-accent',
      replacePattern: '--hx-color-primary-500',
      fileExtensions: ['css', 'scss', 'sass', 'less', 'html', 'twig', 'ts', 'js'],
    },

    {
      id: 'v0.2.0-button-event-renamed',
      version: '0.2.0',
      type: 'renamed-event',
      component: 'hx-button',
      description:
        "hx-button's custom click event was renamed from 'hx-button-click' to 'hx-click' " +
        'to align with the short-form hx- event prefix convention adopted across all ' +
        'components in 0.2.0. Update all addEventListener calls and framework event bindings.',
      before:
        "// Before\nbutton.addEventListener('hx-button-click', handler);\n\n" +
        '// Twig\n{# @listen hx-button-click #}',
      after:
        "// After\nbutton.addEventListener('hx-click', handler);\n\n" +
        '// Twig\n{# @listen hx-click #}',
      searchPattern: "'hx-button-click'",
      replacePattern: "'hx-click'",
      fileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'html', 'twig', 'vue', 'svelte'],
    },

    {
      id: 'v0.2.0-button-event-renamed-dquote',
      version: '0.2.0',
      type: 'renamed-event',
      component: 'hx-button',
      description:
        'Companion pattern for the hx-button-click → hx-click rename covering double-quoted ' +
        'string usages (HTML attribute bindings, template literals with double quotes).',
      before: 'button.addEventListener("hx-button-click", handler);',
      after: 'button.addEventListener("hx-click", handler);',
      searchPattern: '"hx-button-click"',
      replacePattern: '"hx-click"',
      fileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'html', 'twig', 'vue', 'svelte'],
    },

    {
      id: 'v0.2.0-text-input-helper-text-renamed',
      version: '0.2.0',
      type: 'renamed-property',
      component: 'hx-text-input',
      description:
        "hx-text-input's 'helper-text' attribute was shortened to 'hint' in 0.2.0 to match " +
        'the terse naming convention used by hx-select, hx-checkbox, and hx-radio. ' +
        "Update all HTML templates and TypeScript code that sets the 'helper-text' attribute.",
      before: '<hx-text-input helper-text="Enter your full name"></hx-text-input>',
      after: '<hx-text-input hint="Enter your full name"></hx-text-input>',
      searchPattern: '\\bhelper-text=',
      replacePattern: 'hint=',
      fileExtensions: ['html', 'twig', 'tsx', 'jsx', 'vue', 'svelte'],
    },

    {
      id: 'v0.2.0-text-input-helper-text-prop-renamed',
      version: '0.2.0',
      type: 'renamed-property',
      component: 'hx-text-input',
      description:
        'TypeScript property access companion for the helperText → hint rename on hx-text-input. ' +
        'Covers camelCase property access and assignment in TypeScript/JavaScript.',
      before:
        "// Before\nconst input = document.querySelector('hx-text-input');\ninput.helperText = 'Enter your name';",
      after:
        "// After\nconst input = document.querySelector('hx-text-input');\ninput.hint = 'Enter your name';",
      searchPattern: '\\.helperText\\b',
      replacePattern: '.hint',
      fileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs'],
    },

    {
      id: 'v0.2.0-card-header-action-slot-renamed',
      version: '0.2.0',
      type: 'renamed-slot',
      component: 'hx-card',
      description:
        "hx-card's 'header-action' slot was renamed to 'header-trailing' in 0.2.0 to establish " +
        'a consistent spatial naming convention (leading/trailing) across all card-family ' +
        "components. Update all slot='header-action' usages in templates.",
      before: '<hx-card>\n  <button slot="header-action">Edit</button>\n</hx-card>',
      after: '<hx-card>\n  <button slot="header-trailing">Edit</button>\n</hx-card>',
      searchPattern: 'slot=["\']header-action["\']',
      replacePattern: 'slot="header-trailing"',
      fileExtensions: ['html', 'twig', 'tsx', 'jsx', 'vue', 'svelte', 'ts', 'js'],
    },

    {
      id: 'v0.2.0-import-path-updated',
      version: '0.2.0',
      type: 'renamed-import',
      description:
        'The deep import path for components changed in 0.2.0 when the library was restructured ' +
        "to support tree-shaking. The old path '@helixui/library/src/components' is no longer " +
        "valid. Use the published path '@helixui/library/components' instead.",
      before: "import '@helixui/library/src/components/hx-button/index.js';",
      after: "import '@helixui/library/components/hx-button/index.js';",
      searchPattern: '@helixui/library/src/components',
      replacePattern: '@helixui/library/components',
      fileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
    },

    {
      id: 'v0.2.0-token-spacing-base-renamed',
      version: '0.2.0',
      type: 'renamed-token',
      description:
        'The --hx-spacing-base token was renamed to --hx-spacing-md during the 0.2.0 token ' +
        'audit to align with the t-shirt sizing scale (xs/sm/md/lg/xl). Update all CSS that ' +
        'references --hx-spacing-base.',
      before: 'padding: var(--hx-spacing-base);',
      after: 'padding: var(--hx-spacing-md);',
      searchPattern: '--hx-spacing-base',
      replacePattern: '--hx-spacing-md',
      fileExtensions: ['css', 'scss', 'sass', 'less', 'html', 'twig', 'ts', 'js'],
    },

    // ── v0.3.0 breaking changes (placeholder for future releases) ─────────────

    {
      id: 'v0.3.0-button-size-attr-renamed',
      version: '0.3.0',
      type: 'renamed-property',
      component: 'hx-button',
      description:
        "hx-button's 'hx-size' attribute was shortened to 'size' in 0.3.0 since the 'hx-' " +
        'prefix on attribute names was removed from all components that had adopted it as a ' +
        'workaround for attribute name collisions. The property name was always just `size`.',
      before: '<hx-button hx-size="lg">Submit</hx-button>',
      after: '<hx-button size="lg">Submit</hx-button>',
      searchPattern: '\\bhx-size=',
      replacePattern: 'size=',
      fileExtensions: ['html', 'twig', 'tsx', 'jsx', 'vue', 'svelte'],
    },
  ],
};
