#!/usr/bin/env node
/**
 * Helix CLI
 *
 * Commands:
 *   helix theme generate  — Generate a full token override package from brand colors
 */

import { themeGenerate } from './commands/theme.js';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg !== undefined && arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function usage(): void {
  process.stdout.write(`
Helix CLI — Enterprise design system tooling

Usage:
  helix <command> [subcommand] [options]

Commands:
  theme generate    Generate a token override package from brand colors

Options for "theme generate":
  --name <name>         Theme/brand name (required), e.g. "acme"
  --primary <hex>       Primary brand color hex (required), e.g. "#1a73e8"
  --secondary <hex>     Secondary brand color hex (optional)
  --accent <hex>        Accent color hex (optional)
  --preview             Print generated CSS to stdout instead of writing files
  --output <dir>        Output directory (default: ./<name>-theme)
  --version <semver>    Package version (default: "1.0.0")

Examples:
  helix theme generate --name acme --primary "#1a73e8"
  helix theme generate --name acme --primary "#1a73e8" --secondary "#34a853" --preview
  helix theme generate --name acme --primary "#1a73e8" --output ./dist/theme
`);
}

async function main(): Promise<void> {
  const [, , command, subcommand, ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    usage();
    process.exit(0);
  }

  if (command === 'theme' && subcommand === 'generate') {
    const args = parseArgs(rest);

    const generateOpts: Parameters<typeof themeGenerate>[0] = {
      name: String(args['name'] ?? ''),
      primary: String(args['primary'] ?? ''),
      preview: args['preview'] === true,
    };
    if (args['secondary'] !== undefined) generateOpts.secondary = String(args['secondary']);
    if (args['accent'] !== undefined) generateOpts.accent = String(args['accent']);
    if (args['output'] !== undefined) generateOpts.output = String(args['output']);
    if (args['version'] !== undefined) generateOpts.version = String(args['version']);

    await themeGenerate(generateOpts);
    return;
  }

  process.stderr.write(`Unknown command: ${command} ${subcommand ?? ''}\n`);
  usage();
  process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
});
