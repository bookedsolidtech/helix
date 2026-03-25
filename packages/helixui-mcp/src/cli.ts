#!/usr/bin/env node
import { getConfig } from './config.js';
import { existsSync } from 'node:fs';
import { healthCheck, formatHealthReport } from './tools/health-check.js';

// ─── ANSI color helpers ───────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY === true;

const c = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  red: isTTY ? '\x1b[31m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  green: isTTY ? '\x1b[32m' : '',
  dim: isTTY ? '\x1b[2m' : '',
};

// ─── CLI routing ──────────────────────────────────────────────────────────────

const [, , command = 'help', ...rest] = process.argv;

switch (command) {
  case 'health-check': {
    const projectPath = rest.find((a) => !a.startsWith('--')) ?? '.';

    // Parse --extension <file> flag
    let extensionFile: string | undefined;
    const extIdx = rest.indexOf('--extension');
    if (extIdx !== -1 && rest[extIdx + 1] !== undefined) {
      extensionFile = rest[extIdx + 1];
    }

    let report;
    try {
      const opts = extensionFile !== undefined ? { projectPath, extensionFile } : { projectPath };
      report = healthCheck(opts);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`${c.red}Error: ${message}${c.reset}`);
      process.exit(1);
    }

    // ── Terminal-formatted output ─────────────────────────────────────────────

    const scoreColor = report.score >= 80 ? c.green : report.score >= 50 ? c.yellow : c.red;

    console.log('');
    console.log(`${c.bold}HELiX Health Check${c.reset}`);
    console.log(`${c.dim}  Project: ${report.projectPath}${c.reset}`);
    console.log(`  Score:   ${scoreColor}${c.bold}${report.score}/100${c.reset}`);
    console.log('');
    console.log(report.summary);

    if (report.findings.critical.length > 0) {
      console.log('');
      console.log(`${c.red}${c.bold}Critical (${report.findings.critical.length}):${c.reset}`);
      for (const f of report.findings.critical) {
        console.log(
          `  ${c.red}[CRITICAL]${c.reset} ${c.bold}${f.type}${c.reset} ${c.dim}— ${f.source}${c.reset}`,
        );
        console.log(`    ${f.message}`);
        if (f.location !== undefined) console.log(`    ${c.dim}Location: ${f.location}${c.reset}`);
      }
    }

    if (report.findings.warning.length > 0) {
      console.log('');
      console.log(`${c.yellow}${c.bold}Warnings (${report.findings.warning.length}):${c.reset}`);
      for (const f of report.findings.warning) {
        console.log(
          `  ${c.yellow}[WARNING]${c.reset} ${c.bold}${f.type}${c.reset} ${c.dim}— ${f.source}${c.reset}`,
        );
        console.log(`    ${f.message}`);
        if (f.location !== undefined) console.log(`    ${c.dim}Location: ${f.location}${c.reset}`);
      }
    }

    if (report.findings.info.length > 0) {
      console.log('');
      console.log(`${c.cyan}${c.bold}Info (${report.findings.info.length}):${c.reset}`);
      for (const f of report.findings.info) {
        console.log(
          `  ${c.cyan}[INFO]${c.reset} ${c.bold}${f.type}${c.reset} ${c.dim}— ${f.source}${c.reset}`,
        );
        console.log(`    ${f.message}`);
        if (f.location !== undefined) console.log(`    ${c.dim}Location: ${f.location}${c.reset}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log('');
      console.log(`${c.bold}Recommendations:${c.reset}`);
      for (let i = 0; i < report.recommendations.length; i++) {
        console.log(`  ${c.bold}${i + 1}.${c.reset} ${report.recommendations[i]}`);
      }
    }

    console.log('');

    // Exit 1 if any critical findings (for CI gating)
    if (report.findings.critical.length > 0) {
      process.exit(1);
    }
    break;
  }

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
        'Usage: helixui <command> [options]',
        '       helixui-mcp-cli <command> [options]',
        '',
        'Commands:',
        '  health-check [path]  — run full health check on a consumer project (default: .)',
        '  check                — verify CEM and tokens paths are resolvable',
        '  config               — print resolved configuration as JSON',
        '',
        'Health check options:',
        '  --extension <file>   — also analyze a TypeScript file extending a HELiX component',
        '',
        'Environment variables:',
        '  HELIXUI_MCP_PROJECT_ROOT   — project root (default: cwd)',
        '  HELIXUI_MCP_CEM_PATH       — path to custom-elements.json',
        '  HELIXUI_MCP_TOKENS_PATH    — path to tokens.json',
        '',
        'MCP server:',
        '  helixui-mcp                — start MCP stdio server',
        '',
        'Examples:',
        '  npx @helixui/mcp health-check ./my-project',
        '  npx @helixui/mcp health-check . --extension src/components/MyCard.ts',
      ].join('\n'),
    );
  }
}

// Re-export for programmatic use
export { formatHealthReport };
