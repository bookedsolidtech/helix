import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const CONFIG_FILENAME = 'helix.config.json';

export interface HelixConfig {
  registry: string;
  outDir: string;
  typescript: boolean;
}

export const DEFAULT_CONFIG: HelixConfig = {
  registry: 'https://registry.helixds.com',
  outDir: './src/components',
  typescript: true,
};

export function getConfigPath(cwd: string = process.cwd()): string {
  return join(cwd, CONFIG_FILENAME);
}

export function configExists(cwd: string = process.cwd()): boolean {
  return existsSync(getConfigPath(cwd));
}

export async function readConfig(cwd: string = process.cwd()): Promise<HelixConfig> {
  const configPath = getConfigPath(cwd);

  if (!existsSync(configPath)) {
    throw new Error(
      `No ${CONFIG_FILENAME} found. Run \`helix init\` to initialize your project.`,
    );
  }

  const raw = await readFile(configPath, 'utf-8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse ${CONFIG_FILENAME}: invalid JSON.`);
  }

  if (!isHelixConfig(parsed)) {
    throw new Error(`${CONFIG_FILENAME} is malformed. Run \`helix init\` to reinitialize.`);
  }

  return parsed;
}

export async function writeConfig(config: HelixConfig, cwd: string = process.cwd()): Promise<void> {
  const configPath = getConfigPath(cwd);
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function isHelixConfig(value: unknown): value is HelixConfig {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['registry'] === 'string' &&
    typeof obj['outDir'] === 'string' &&
    typeof obj['typescript'] === 'boolean'
  );
}
