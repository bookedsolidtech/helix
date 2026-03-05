import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { LibraryEntry, LibraryRegistry } from './types';

const REGISTRY_PATH = 'src/data/library-registry.json';

function getRegistryPath(): string {
  return resolve(process.cwd(), REGISTRY_PATH);
}

const DEFAULT_REGISTRY: LibraryRegistry = {
  version: 1,
  entries: [
    {
      id: 'hx-library',
      name: 'hx-library',
      source: 'local',
      cemPath: 'packages/hx-library/custom-elements.json',
      prefix: 'hx-',
    },
  ],
};

export async function readRegistry(): Promise<LibraryRegistry> {
  const filePath = getRegistryPath();
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as LibraryRegistry;
  } catch {
    return DEFAULT_REGISTRY;
  }
}

export async function writeRegistry(registry: LibraryRegistry): Promise<void> {
  const filePath = getRegistryPath();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(registry, null, 2), 'utf-8');
}

export function validateEntry(entry: Partial<LibraryEntry>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!entry.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
    errors.push('id must be slug-safe (lowercase alphanumeric and hyphens)');
  }

  if (!entry.source || !['local', 'cdn', 'npm'].includes(entry.source)) {
    errors.push("source must be 'local', 'cdn', or 'npm'");
  }

  if (entry.source === 'local' && !entry.cemPath) {
    errors.push('cemPath is required for local entries');
  }

  if ((entry.source === 'cdn' || entry.source === 'npm') && !entry.packageName) {
    errors.push('packageName is required for cdn and npm entries');
  }

  if (!entry.prefix || !entry.prefix.endsWith('-')) {
    errors.push("prefix must end with '-'");
  }

  return { valid: errors.length === 0, errors };
}

export async function addEntry(entry: LibraryEntry): Promise<LibraryEntry> {
  const { valid, errors } = validateEntry(entry);
  if (!valid) {
    throw new Error(`Invalid entry: ${errors.join(', ')}`);
  }

  const registry = await readRegistry();

  if (registry.entries.some((e) => e.id === entry.id)) {
    throw new Error(`Entry with id "${entry.id}" already exists`);
  }

  registry.entries.push(entry);
  await writeRegistry(registry);

  return entry;
}

export async function updateEntry(
  id: string,
  patch: Partial<Omit<LibraryEntry, 'id'>>,
): Promise<LibraryEntry> {
  const registry = await readRegistry();

  const index = registry.entries.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error(`Entry "${id}" not found`);
  }

  const existing = registry.entries[index] as LibraryEntry;
  const updated: LibraryEntry = { ...existing, ...patch, id };

  const { valid, errors } = validateEntry(updated);
  if (!valid) {
    throw new Error(`Invalid entry: ${errors.join(', ')}`);
  }

  registry.entries[index] = updated;
  await writeRegistry(registry);

  return updated;
}

export async function removeEntry(id: string): Promise<void> {
  const registry = await readRegistry();

  const exists = registry.entries.some((e) => e.id === id);
  if (!exists) {
    throw new Error(`Entry "${id}" not found`);
  }

  registry.entries = registry.entries.filter((e) => e.id !== id);
  await writeRegistry(registry);
}
