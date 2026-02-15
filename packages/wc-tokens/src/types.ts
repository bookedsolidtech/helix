export interface TokenDefinition {
  value: string;
  description?: string;
}

export interface TokenEntry {
  name: string;
  value: string;
  category: string;
  group: string;
  key: string;
  path: string[];
  description?: string;
}
