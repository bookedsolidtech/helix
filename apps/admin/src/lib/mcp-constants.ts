/**
 * Shared constants for MCP (helixir) integration.
 * Used by mcp-probe.ts and mcp-client.ts.
 *
 * Resolves the helixir MCP server binary from the npm package.
 * CEM_PATH is resolved relative to the monorepo root.
 *
 * NOTE: This file is bundled by Next.js webpack which transforms
 * import.meta.url into a numeric module ID. We use process.cwd()
 * and direct node_modules resolution instead.
 */
import { resolve } from 'node:path';

// In turborepo + npm workspaces, process.cwd() is the app directory (apps/admin)
const MONOREPO_ROOT = resolve(process.cwd(), '../..');

// Resolve helixir binary from the hoisted node_modules
const HELIXIR_ROOT = resolve(MONOREPO_ROOT, 'node_modules/helixir');
const HELIXIR_BINARY = resolve(HELIXIR_ROOT, 'build/src/index.js');

export const WC_TOOLS_ROOT = process.env.WC_TOOLS_ROOT ?? HELIXIR_ROOT;
export const WC_TOOLS_BINARY = process.env.WC_TOOLS_ROOT
  ? resolve(process.env.WC_TOOLS_ROOT, 'build/src/index.js')
  : HELIXIR_BINARY;
export const CEM_PATH = resolve(MONOREPO_ROOT, 'packages/hx-library/custom-elements.json');

/** Directory where helixir stores per-component health history files. */
export const MCP_HEALTH_HISTORY_DIR = resolve(CEM_PATH, '../../.mcp-wc/health');

/** Environment variables passed to the helixir MCP server process. */
export function getMcpProcessEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MCP_WC_CEM_PATH: CEM_PATH,
    MCP_WC_PROJECT_ROOT: resolve(CEM_PATH, '../..'),
  };
}
