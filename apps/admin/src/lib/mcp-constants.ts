/**
 * Shared constants for MCP (wc-tools) integration.
 * Used by mcp-probe.ts and mcp-client.ts.
 */
import { resolve } from 'node:path';

export const WC_TOOLS_ROOT = '/Volumes/Development/booked/wc-tools';
export const WC_TOOLS_BINARY = resolve(WC_TOOLS_ROOT, 'build/index.js');
export const CEM_PATH = resolve(
  '/Volumes/Development/booked/helix/packages/hx-library/custom-elements.json',
);

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
