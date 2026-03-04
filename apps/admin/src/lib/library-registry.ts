/**
 * Library Registry.
 * CRUD utilities for tracking multiple web component libraries in the admin dashboard.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export type LibrarySource = 'local' | 'cdn' | 'npm';

export interface LibraryEntry {
  id: string;
  name: string;
  source: LibrarySource;
  /** Required when source is "local" */
  cemPath?: string;
  /** Required when source is "cdn" or "npm" */
  packageName?: string;
  /** Used when source is "cdn" or "npm" */
  version?: string;
  /** Tag prefix, e.g. "hx-", "sl-" */
  prefix: string;
  /** ISO timestamp of last health score run */
  lastScored: string | null;
  componentCount: number;
  isDefault: boolean;
}

interface RegistryFile {
  libraries: LibraryEntry[];
}

function getRegistryPath(): string {
  return resolve(process.cwd(), 'src/data/library-registry.json');
}

function readRegistryFile(path: string): RegistryFile {
  if (!existsSync(path)) {
    return { libraries: [] };
  }
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as RegistryFile;
}

function writeRegistryFile(path: string, data: RegistryFile): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

function validateEntry(entry: Omit<LibraryEntry, 'id'>): void {
  if (entry.source === 'local' && !entry.cemPath) {
    throw new Error('cemPath is required for local libraries');
  }
  if ((entry.source === 'cdn' || entry.source === 'npm') && !entry.packageName) {
    throw new Error('packageName is required for cdn and npm libraries');
  }
  if (!entry.prefix) {
    throw new Error('prefix is required');
  }
}

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Returns all library entries from the registry.
 */
export function getRegistry(): LibraryEntry[] {
  const path = getRegistryPath();
  const data = readRegistryFile(path);
  return data.libraries;
}

/**
 * Returns a single library entry by ID, or undefined if not found.
 */
export function getLibrary(id: string): LibraryEntry | undefined {
  return getRegistry().find((entry) => entry.id === id);
}

/**
 * Returns the entry marked as default, or undefined if none.
 */
export function getDefaultLibrary(): LibraryEntry | undefined {
  return getRegistry().find((entry) => entry.isDefault);
}

/**
 * Adds a new library entry. Generates an ID from the name.
 * Throws if a duplicate ID would be created or if required fields are missing.
 */
export function addLibrary(entry: Omit<LibraryEntry, 'id'>): LibraryEntry {
  validateEntry(entry);

  const path = getRegistryPath();
  const data = readRegistryFile(path);

  const id = generateId(entry.name);

  if (data.libraries.some((lib) => lib.id === id)) {
    throw new Error(`A library with id "${id}" already exists`);
  }

  const newEntry: LibraryEntry = { id, ...entry };
  data.libraries.push(newEntry);
  writeRegistryFile(path, data);

  return newEntry;
}

/**
 * Partially updates an existing library entry.
 * Throws if the library is not found.
 */
export function updateLibrary(
  id: string,
  partial: Partial<Omit<LibraryEntry, 'id'>>,
): LibraryEntry {
  const path = getRegistryPath();
  const data = readRegistryFile(path);

  const index = data.libraries.findIndex((lib) => lib.id === id);
  if (index === -1) {
    throw new Error(`Library "${id}" not found`);
  }

  const existing = data.libraries[index];
  if (!existing) throw new Error(`Library at index ${index} not found`);
  const updated: LibraryEntry = { ...existing, ...partial, id };
  validateEntry(updated);

  data.libraries[index] = updated;
  writeRegistryFile(path, data);

  return updated;
}

/**
 * Removes a library entry by ID.
 * Throws if the library is not found or if it is the default library.
 */
export function removeLibrary(id: string): void {
  const path = getRegistryPath();
  const data = readRegistryFile(path);

  const entry = data.libraries.find((lib) => lib.id === id);
  if (!entry) {
    throw new Error(`Library "${id}" not found`);
  }
  if (entry.isDefault) {
    throw new Error('Cannot remove the default library');
  }

  data.libraries = data.libraries.filter((lib) => lib.id !== id);
  writeRegistryFile(path, data);
}
