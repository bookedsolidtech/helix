export type LibrarySource = 'local' | 'cdn' | 'npm';

export interface McpConfig {
  serverUrl?: string;
  apiKey?: string;
  [key: string]: unknown;
}

export interface LibraryEntry {
  id: string;
  name: string;
  source: LibrarySource;
  /** Required when source is "local" */
  cemPath?: string;
  /** Required when source is "cdn" or "npm" */
  packageName?: string;
  /** Tag prefix, e.g. "hx-", "sl-" */
  prefix: string;
  /** ISO timestamp of last health score run */
  lastScored?: string;
  componentCount?: number;
  mcpConfig?: McpConfig;
}

export interface LibraryRegistry {
  version: number;
  entries: LibraryEntry[];
}
