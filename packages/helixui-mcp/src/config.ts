import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

function resolveProjectRoot(): string {
  const envRoot = process.env['HELIXUI_MCP_PROJECT_ROOT'];
  if (envRoot) return envRoot;
  return process.cwd();
}

function resolveCemPath(projectRoot: string): string {
  const envPath = process.env['HELIXUI_MCP_CEM_PATH'];
  if (envPath) return envPath;

  // Auto-discover from installed library package
  const discovered = resolve(projectRoot, 'node_modules/@helixui/library/custom-elements.json');
  if (existsSync(discovered)) return discovered;

  // Fallback: monorepo development path
  return resolve(projectRoot, 'packages/hx-library/custom-elements.json');
}

function resolveTokensPath(projectRoot: string): string {
  const envPath = process.env['HELIXUI_MCP_TOKENS_PATH'];
  if (envPath) return envPath;

  // Auto-discover from installed tokens package
  const discovered = resolve(projectRoot, 'node_modules/@helixui/tokens/dist/tokens.json');
  if (existsSync(discovered)) return discovered;

  // Fallback: monorepo development path
  return resolve(projectRoot, 'packages/hx-tokens/src/tokens.json');
}

export interface Config {
  projectRoot: string;
  cemPath: string;
  tokensPath: string;
}

export function getConfig(): Config {
  const projectRoot = resolveProjectRoot();
  return {
    projectRoot,
    cemPath: resolveCemPath(projectRoot),
    tokensPath: resolveTokensPath(projectRoot),
  };
}
