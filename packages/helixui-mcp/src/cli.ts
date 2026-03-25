#!/usr/bin/env node
import { getConfig } from './config.js';
import { existsSync } from 'node:fs';

const [, , command = 'help'] = process.argv;

switch (command) {
  case 'check': {
    const config = getConfig();
    console.log('[@helixui/mcp] Configuration check');
    console.log('  Project root:', config.projectRoot);
    console.log(
      '  CEM path:    ',
      config.cemPath,
      existsSync(config.cemPath) ? '✓' : '✗ not found',
    );
    console.log(
      '  Tokens path: ',
      config.tokensPath,
      existsSync(config.tokensPath) ? '✓' : '✗ not found',
    );
    break;
  }

  case 'config': {
    const config = getConfig();
    console.log(JSON.stringify(config, null, 2));
    break;
  }

  default: {
    console.log(
      [
        '[@helixui/mcp] CLI',
        '',
        'Usage: helixui-mcp-cli <command>',
        '',
        'Commands:',
        '  check   — verify CEM and tokens paths are resolvable',
        '  config  — print resolved configuration as JSON',
        '',
        'Environment variables:',
        '  HELIXUI_MCP_PROJECT_ROOT   — project root (default: cwd)',
        '  HELIXUI_MCP_CEM_PATH       — path to custom-elements.json',
        '  HELIXUI_MCP_TOKENS_PATH    — path to tokens.json',
        '',
        'MCP server:',
        '  helixui-mcp                — start MCP stdio server',
      ].join('\n'),
    );
  }
}
