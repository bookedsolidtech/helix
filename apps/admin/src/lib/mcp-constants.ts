/**
 * Shared constants for MCP (helixir) integration.
 * Used by mcp-probe.ts and mcp-client.ts.
 *
 * Resolves the helixir MCP server binary from the npm package.
 * CEM_PATH is resolved relative to the monorepo root.
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = resolve(__dirname, '../../../../');

const require = createRequire(import.meta.url);
const HELIXIR_BINARY = require.resolve('helixir');
const HELIXIR_ROOT = resolve(HELIXIR_BINARY, '../../..');

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
