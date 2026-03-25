#!/usr/bin/env node
/**
 * hx-wrapper-gen CLI
 *
 * CEM-driven wrapper generator for HELiX web components.
 * Reads custom-elements.json and generates framework-specific wrappers
 * for React, Vue, Angular, and Svelte.
 *
 * Usage:
 *   hx-wrapper-gen [options]
 *
 * Options:
 *   --cem <path>        Path to custom-elements.json
 *                       (default: packages/hx-library/custom-elements.json)
 *   --out <dir>         Base output directory (default: packages)
 *   --framework <name>  Framework(s) to generate: react, vue, angular, svelte, all
 *                       Comma-separated for multiple: react,vue
 *                       (default: all)
 *   --help              Show this help message
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Cem, ComponentEntry } from './types.js';
import { generateAngular } from './generators/angular.js';
import { generateReact } from './generators/react.js';
import { generateSvelte } from './generators/svelte.js';
import { generateVue } from './generators/vue.js';

const SUPPORTED_FRAMEWORKS = ['react', 'vue', 'angular', 'svelte'] as const;
type Framework = (typeof SUPPORTED_FRAMEWORKS)[number];

function parseArgs(args: string[]): {
  cem: string;
  out: string;
  frameworks: Framework[];
  help: boolean;
} {
  const defaults = {
    cem: 'packages/hx-library/custom-elements.json',
    out: 'packages',
    frameworks: [...SUPPORTED_FRAMEWORKS] as Framework[],
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      defaults.help = true;
    } else if (arg === '--cem' && args[i + 1]) {
      defaults.cem = args[++i]!;
    } else if (arg === '--out' && args[i + 1]) {
      defaults.out = args[++i]!;
    } else if (arg === '--framework' && args[i + 1]) {
      const raw = args[++i]!;
      if (raw === 'all') {
        defaults.frameworks = [...SUPPORTED_FRAMEWORKS];
      } else {
        const requested = raw.split(',').map((f) => f.trim().toLowerCase());
        const valid = requested.filter((f): f is Framework =>
          SUPPORTED_FRAMEWORKS.includes(f as Framework),
        );
        const invalid = requested.filter((f) => !SUPPORTED_FRAMEWORKS.includes(f as Framework));
        if (invalid.length > 0) {
          console.error(`Unknown framework(s): ${invalid.join(', ')}`);
          console.error(`Supported: ${SUPPORTED_FRAMEWORKS.join(', ')}`);
          process.exit(1);
        }
        defaults.frameworks = valid;
      }
    }
  }

  return defaults;
}

function printHelp(): void {
  console.log(`
hx-wrapper-gen — CEM-driven wrapper generator for HELiX web components

Usage:
  hx-wrapper-gen [options]

Options:
  --cem <path>        Path to custom-elements.json
                      (default: packages/hx-library/custom-elements.json)
  --out <dir>         Base output directory (default: packages)
  --framework <name>  react | vue | angular | svelte | all
                      Comma-separated for multiple: react,vue
                      (default: all)
  --help              Show this help message

Examples:
  hx-wrapper-gen
  hx-wrapper-gen --framework react
  hx-wrapper-gen --framework react,vue --cem ./custom-elements.json
  hx-wrapper-gen --out ./generated --framework angular
`);
}

function loadCem(cemPath: string): Cem {
  if (!existsSync(cemPath)) {
    console.error(`ERROR: CEM not found at ${cemPath}`);
    console.error('Run: pnpm run cem');
    process.exit(1);
  }

  const raw = readFileSync(cemPath, 'utf-8');
  return JSON.parse(raw) as Cem;
}

function extractComponents(cem: Cem): ComponentEntry[] {
  const components: ComponentEntry[] = [];

  for (const module of cem.modules ?? []) {
    for (const decl of module.declarations ?? []) {
      if (decl.customElement && decl.tagName && decl.kind === 'class') {
        components.push({ decl, modulePath: module.path });
      }
    }
  }

  // Sort deterministically by tag name for reproducible output
  return components.sort((a, b) => (a.decl.tagName ?? '').localeCompare(b.decl.tagName ?? ''));
}

function main(): void {
  const args = process.argv.slice(2);
  const { cem: cemArg, out: outArg, frameworks, help } = parseArgs(args);

  if (help) {
    printHelp();
    process.exit(0);
  }

  const cwd = process.cwd();
  const cemPath = resolve(cwd, cemArg);
  const outBase = resolve(cwd, outArg);

  console.log('hx-wrapper-gen');
  console.log(`  CEM:        ${cemPath}`);
  console.log(`  Output:     ${outBase}`);
  console.log(`  Frameworks: ${frameworks.join(', ')}`);
  console.log('');

  const cem = loadCem(cemPath);
  const components = extractComponents(cem);

  console.log(`Found ${components.length} custom elements\n`);

  const frameworkOutputs: Record<Framework, string> = {
    react: resolve(outBase, 'hx-react'),
    vue: resolve(outBase, 'hx-vue'),
    angular: resolve(outBase, 'hx-angular'),
    svelte: resolve(outBase, 'hx-svelte'),
  };

  for (const framework of frameworks) {
    const outDir = frameworkOutputs[framework];
    switch (framework) {
      case 'react':
        generateReact(components, outDir);
        break;
      case 'vue':
        generateVue(components, outDir);
        break;
      case 'angular':
        generateAngular(components, outDir);
        break;
      case 'svelte':
        generateSvelte(components, outDir);
        break;
    }
  }

  console.log(`\nDone. Generated wrappers for ${frameworks.length} framework(s).`);
}

main();
