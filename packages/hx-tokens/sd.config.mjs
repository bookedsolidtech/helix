/**
 * Style Dictionary 4.x configuration for @helix/tokens
 *
 * DTCG (W3C Design Token Community Group) format source files.
 * Outputs:
 *   dist/tokens.css           — :root light-mode variables
 *   dist/tokens-dark-auto.css — @media prefers-color-scheme: dark auto override
 *   dist/tokens-dark-manual.css — [data-theme="dark"] manual override
 *   dist/tokens-lit.js        — Lit CSS tagged template (tokenStyles export)
 *
 * Three-tier token cascade:
 *   Primitive → Semantic → Component
 *
 * Dark-mode tokens live under the `dark.*` namespace in semantic/dark.json.
 * When outputting dark CSS the `dark.` prefix is stripped from property names
 * so `dark.color.text.primary` becomes `--hx-color-text-primary`.
 */

import StyleDictionary from 'style-dictionary';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Custom name transform: strips leading "dark." segment and joins with dashes
// StyleDictionary 4 name transforms receive (token, options)
// ---------------------------------------------------------------------------
StyleDictionary.registerTransform({
  name: 'name/hx/kebab',
  type: 'name',
  transform(token) {
    // token.path is the full path array, e.g. ['color', 'primary', '500']
    // or ['dark', 'color', 'text', 'primary'] for dark-mode overrides.
    // We always strip the leading 'dark' segment for name generation so that
    // dark-mode tokens share the same CSS custom property name as their
    // light-mode counterparts (they are overrides in different selectors).
    // The 'hx-' prefix is embedded here so css/variables format produces --hx-* variables.
    const path = token.path[0] === 'dark' ? token.path.slice(1) : token.path;
    return `hx-${path.join('-')}`;
  },
});

// ---------------------------------------------------------------------------
// Custom formatter: produces the dark-mode @media block
// ---------------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: 'css/dark-media',
  format({ dictionary, options }) {
    const selector = options?.selector ?? ':root';
    const props = dictionary.allTokens
      .map((token) => {
        const value = token.$value ?? token.value;
        return `  --${token.name}: ${value};`;
      })
      .join('\n');

    return `@media (prefers-color-scheme: dark) {\n  ${selector} {\n${props}\n  }\n}\n`;
  },
});

// ---------------------------------------------------------------------------
// Custom formatter: produces a Lit css`` tagged template export
// ---------------------------------------------------------------------------
StyleDictionary.registerFormat({
  name: 'js/lit-css',
  format({ dictionary }) {
    const lightTokens = dictionary.allTokens.filter((t) => t.path[0] !== 'dark');
    const darkTokens = dictionary.allTokens.filter((t) => t.path[0] === 'dark');

    const lightProps = lightTokens
      .map((token) => {
        const value = token.$value ?? token.value;
        return `  --${token.name}: ${value};`;
      })
      .join('\n');

    const darkProps = darkTokens
      .map((token) => {
        const value = token.$value ?? token.value;
        return `  --${token.name}: ${value};`;
      })
      .join('\n');

    const darkBlock =
      darkProps.length > 0
        ? `\n\n/** Dark-mode overrides applied to :host when data-theme="dark" */\nexport const darkTokenStyles = css\`\n:host([data-theme="dark"]) {\n${darkProps}\n}\n@media (prefers-color-scheme: dark) {\n  :host(:not([data-theme="light"])) {\n${darkProps}\n  }\n}\n\`;\n`
        : `\nexport const darkTokenStyles = css\`\`;\n`;

    return `import { css } from 'lit';\n\n/** Light-mode design tokens as Lit :host custom properties */\nexport const tokenStyles = css\`\n:host {\n${lightProps}\n}\n\`;${darkBlock}`;
  },
});

// ---------------------------------------------------------------------------
// Helper: build a StyleDictionary instance filtered to a token subset
// ---------------------------------------------------------------------------
function buildFilteredSD(filter, additionalConfig = {}) {
  return new StyleDictionary(
    {
      usesDtcg: true,
      source: [
        `${__dirname}/tokens/primitive/**/*.json`,
        `${__dirname}/tokens/semantic/**/*.json`,
      ],
      log: { warnings: 'warn', verbosity: 'default' },
      ...additionalConfig,
    },
    { verbosity: 'default' },
  );
}

// ---------------------------------------------------------------------------
// Build 1: Light-mode tokens (:root)
// Excludes dark.* tokens, uses outputReferences so semantic tokens reference
// primitive var() names instead of emitting resolved hex values.
// ---------------------------------------------------------------------------
async function buildLight() {
  const sd = new StyleDictionary(
    {
      usesDtcg: true,
      source: [
        `${__dirname}/tokens/primitive/**/*.json`,
        `${__dirname}/tokens/semantic/**/*.json`,
      ],
      log: { warnings: 'warn', verbosity: 'default' },
      platforms: {
        css: {
          transforms: ['name/hx/kebab'],
          buildPath: `${__dirname}/dist/`,
          files: [
            {
              destination: 'tokens.css',
              format: 'css/variables',
              filter: (token) => token.path[0] !== 'dark',
              options: {
                outputReferences: true,
                selector: ':root',
              },
            },
          ],
        },
      },
    },
    { verbosity: 'default' },
  );

  await sd.buildAllPlatforms();
}

// ---------------------------------------------------------------------------
// Build 2: Dark auto-mode (@media prefers-color-scheme: dark)
// ---------------------------------------------------------------------------
async function buildDarkAuto() {
  const sd = new StyleDictionary(
    {
      usesDtcg: true,
      source: [
        `${__dirname}/tokens/primitive/**/*.json`,
        `${__dirname}/tokens/semantic/**/*.json`,
      ],
      log: { warnings: 'warn', verbosity: 'default' },
      platforms: {
        css: {
          transforms: ['name/hx/kebab'],
          buildPath: `${__dirname}/dist/`,
          files: [
            {
              destination: 'tokens-dark-auto.css',
              format: 'css/dark-media',
              filter: (token) => token.path[0] === 'dark',
              options: {
                outputReferences: false,
                selector: ':root:not([data-theme="light"])',
              },
            },
          ],
        },
      },
    },
    { verbosity: 'default' },
  );

  await sd.buildAllPlatforms();
}

// ---------------------------------------------------------------------------
// Build 3: Dark manual override ([data-theme="dark"])
// ---------------------------------------------------------------------------
async function buildDarkManual() {
  const sd = new StyleDictionary(
    {
      usesDtcg: true,
      source: [
        `${__dirname}/tokens/primitive/**/*.json`,
        `${__dirname}/tokens/semantic/**/*.json`,
      ],
      log: { warnings: 'warn', verbosity: 'default' },
      platforms: {
        css: {
          transforms: ['name/hx/kebab'],
          buildPath: `${__dirname}/dist/`,
          files: [
            {
              destination: 'tokens-dark-manual.css',
              format: 'css/variables',
              filter: (token) => token.path[0] === 'dark',
              options: {
                outputReferences: false,
                selector: ':root[data-theme="dark"]',
              },
            },
          ],
        },
      },
    },
    { verbosity: 'default' },
  );

  await sd.buildAllPlatforms();
}

// ---------------------------------------------------------------------------
// Build 4: Lit CSS tagged template
// ---------------------------------------------------------------------------
async function buildLit() {
  const sd = new StyleDictionary(
    {
      usesDtcg: true,
      source: [
        `${__dirname}/tokens/primitive/**/*.json`,
        `${__dirname}/tokens/semantic/**/*.json`,
      ],
      log: { warnings: 'warn', verbosity: 'default' },
      platforms: {
        js: {
          transforms: ['name/hx/kebab'],
          buildPath: `${__dirname}/dist/`,
          files: [
            {
              destination: 'tokens-lit.js',
              format: 'js/lit-css',
            },
          ],
        },
      },
    },
    { verbosity: 'default' },
  );

  await sd.buildAllPlatforms();
}

// ---------------------------------------------------------------------------
// Main: ensure dist exists then run all builds sequentially
// ---------------------------------------------------------------------------
export async function buildTokens() {
  mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
  await buildLight();
  await buildDarkAuto();
  await buildDarkManual();
  await buildLit();
}

// When invoked directly (node sd.config.mjs) run the build immediately
if (import.meta.url === `file://${process.argv[1]}`) {
  buildTokens().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
