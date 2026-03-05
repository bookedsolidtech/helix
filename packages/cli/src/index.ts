#!/usr/bin/env node
/**
 * helix — Helix CLI entry point
 *
 * Commands:
 *   migrate   Migrate from Shoelace, Carbon, or Material UI to Helix
 */

import { parseMigrateArgs, runMigrate } from './commands/migrate.js';

const [, , command, ...args] = process.argv;

switch (command) {
  case 'migrate': {
    const options = parseMigrateArgs(args);
    if (!options) process.exit(1);
    runMigrate(options);
    break;
  }

  case '--help':
  case '-h':
  case undefined: {
    console.log(`
helix — Helix enterprise component library CLI

Usage:
  helix <command> [options]

Commands:
  migrate   Migrate from Shoelace, Carbon, or Material UI to Helix

Run \`helix <command> --help\` for command-specific help.
`);
    break;
  }

  default: {
    console.error(`Unknown command: ${command}`);
    console.error('Run `helix --help` for available commands.');
    process.exit(1);
  }
}
