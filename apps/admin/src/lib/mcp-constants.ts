/**
 * Shared constants for MCP (wc-tools) integration.
 * Used by mcp-probe.ts and mcp-client.ts.
 *
 * WC_TOOLS_ROOT must be set via environment variable or defaults to a
 * sibling directory. CEM_PATH is resolved relative to the monorepo root.
 */
import { resolve } from 'node:path';

const MONOREPO_ROOT = resolve(import.meta.dirname, '../../../../');
export const WC_TOOLS_ROOT = process.env.WC_TOOLS_ROOT ?? resolve(MONOREPO_ROOT, '../wc-tools');
export const WC_TOOLS_BINARY = resolve(WC_TOOLS_ROOT, 'build/index.js');
export const CEM_PATH = resolve(MONOREPO_ROOT, 'packages/hx-library/custom-elements.json');

/** Directory where wc-tools stores per-component health history files. */
export const MCP_HEALTH_HISTORY_DIR = resolve(CEM_PATH, '../../.mcp-wc/health');

/** Environment variables passed to the wc-tools MCP server process. */
export function getMcpProcessEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MCP_WC_CEM_PATH: CEM_PATH,
    MCP_WC_PROJECT_ROOT: resolve(CEM_PATH, '../..'),
  };
}
