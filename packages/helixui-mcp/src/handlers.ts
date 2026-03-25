import { readFileSync, existsSync } from 'node:fs';
import { getConfig } from './config.js';

// ─── CEM types ────────────────────────────────────────────────────────────────

interface CemMember {
  name: string;
  kind: string;
  type?: { text?: string };
  description?: string;
  default?: string;
  attribute?: string;
}

interface CemEvent {
  name: string;
  type?: { text?: string };
  description?: string;
}

interface CemSlot {
  name: string;
  description?: string;
}

interface CemCssProp {
  name: string;
  description?: string;
  default?: string;
}

interface CemCssPart {
  name: string;
  description?: string;
}

interface CemDeclaration {
  kind?: string;
  tagName?: string;
  name: string;
  description?: string;
  members?: CemMember[];
  events?: CemEvent[];
  slots?: CemSlot[];
  cssProperties?: CemCssProp[];
  cssParts?: CemCssPart[];
}

interface CemModule {
  kind?: string;
  path?: string;
  declarations?: CemDeclaration[];
}

interface Cem {
  schemaVersion?: string;
  modules: CemModule[];
}

// ─── Tokens types ─────────────────────────────────────────────────────────────

interface TokenLeaf {
  value: string;
}

interface TokenGroup {
  [key: string]: TokenNode;
}

type TokenNode = TokenLeaf | TokenGroup;

function isTokenLeaf(node: TokenNode): node is TokenLeaf {
  return typeof (node as { value?: unknown }).value === 'string';
}

interface TokensFile {
  [category: string]: { [key: string]: TokenNode };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadCem(): Cem {
  const { cemPath } = getConfig();
  if (!existsSync(cemPath)) {
    throw new Error(
      `CEM file not found at ${cemPath}. ` +
        `Run 'pnpm run cem' in the library package, or set HELIXUI_MCP_CEM_PATH.`,
    );
  }
  return JSON.parse(readFileSync(cemPath, 'utf8')) as Cem;
}

function getAllDeclarations(cem: Cem): CemDeclaration[] {
  return cem.modules.flatMap((m) => m.declarations ?? []);
}

function getComponentDeclarations(cem: Cem): (CemDeclaration & { tagName: string })[] {
  return getAllDeclarations(cem).filter(
    (d): d is CemDeclaration & { tagName: string } => typeof d.tagName === 'string',
  );
}

function loadTokens(): TokensFile {
  const { tokensPath } = getConfig();
  if (!existsSync(tokensPath)) {
    throw new Error(
      `Tokens file not found at ${tokensPath}. Set HELIXUI_MCP_TOKENS_PATH to override.`,
    );
  }
  return JSON.parse(readFileSync(tokensPath, 'utf8')) as TokensFile;
}

function flattenTokens(
  obj: { [key: string]: TokenNode },
  prefix: string,
): Array<{ name: string; value: string }> {
  const results: Array<{ name: string; value: string }> = [];
  for (const [key, node] of Object.entries(obj)) {
    const segmentName = `${prefix}-${key}`;
    if (isTokenLeaf(node)) {
      results.push({ name: segmentName, value: node.value });
    } else {
      results.push(...flattenTokens(node as { [key: string]: TokenNode }, segmentName));
    }
  }
  return results;
}

// ─── Handler: listComponents ──────────────────────────────────────────────────

export function listComponents(filter?: string): string {
  const cem = loadCem();
  const components = getComponentDeclarations(cem);
  const filtered = filter
    ? components.filter(
        (c) =>
          c.tagName.includes(filter) || c.description?.toLowerCase().includes(filter.toLowerCase()),
      )
    : components;

  if (filtered.length === 0) {
    return filter
      ? `No components matching "${filter}".`
      : 'No components found in CEM. Run pnpm run cem first.';
  }

  const lines = filtered.map((c) => {
    const desc = c.description ? ` — ${c.description.split('\n')[0]}` : '';
    return `${c.tagName}${desc}`;
  });

  return `${filtered.length} component${filtered.length === 1 ? '' : 's'}:\n${lines.join('\n')}`;
}

// ─── Handler: getComponent ────────────────────────────────────────────────────

export function getComponent(tagName: string): string {
  const cem = loadCem();
  const component = getComponentDeclarations(cem).find((c) => c.tagName === tagName);

  if (!component) {
    const available = getComponentDeclarations(cem)
      .map((c) => c.tagName)
      .join(', ');
    throw new Error(`Component "${tagName}" not found. Available: ${available}`);
  }

  const props = (component.members ?? []).filter((m) => m.kind === 'field');
  const methods = (component.members ?? []).filter((m) => m.kind === 'method');
  const events = component.events ?? [];
  const slots = component.slots ?? [];
  const cssParts = component.cssParts ?? [];
  const cssProps = component.cssProperties ?? [];

  const sections: string[] = [`# ${tagName}`, ''];
  if (component.description) sections.push(component.description, '');

  if (props.length > 0) {
    sections.push('## Properties');
    for (const p of props) {
      const type = p.type?.text ? ` \`${p.type.text}\`` : '';
      const attr = p.attribute ? ` (attr: \`${p.attribute}\`)` : '';
      const def = p.default != null ? ` = \`${p.default}\`` : '';
      const desc = p.description ? ` — ${p.description}` : '';
      sections.push(`- **${p.name}**${type}${attr}${def}${desc}`);
    }
    sections.push('');
  }

  if (events.length > 0) {
    sections.push('## Events');
    for (const e of events) {
      const type = e.type?.text ? ` \`${e.type.text}\`` : '';
      const desc = e.description ? ` — ${e.description}` : '';
      sections.push(`- **${e.name}**${type}${desc}`);
    }
    sections.push('');
  }

  if (slots.length > 0) {
    sections.push('## Slots');
    for (const s of slots) {
      const name = s.name || '(default)';
      const desc = s.description ? ` — ${s.description}` : '';
      sections.push(`- **${name}**${desc}`);
    }
    sections.push('');
  }

  if (cssParts.length > 0) {
    sections.push('## CSS Parts');
    for (const p of cssParts) {
      const desc = p.description ? ` — ${p.description}` : '';
      sections.push(`- \`${p.name}\`${desc}`);
    }
    sections.push('');
  }

  if (cssProps.length > 0) {
    sections.push('## CSS Custom Properties');
    for (const p of cssProps) {
      const def = p.default ? ` (default: \`${p.default}\`)` : '';
      const desc = p.description ? ` — ${p.description}` : '';
      sections.push(`- \`${p.name}\`${def}${desc}`);
    }
    sections.push('');
  }

  if (methods.length > 0) {
    sections.push('## Methods');
    for (const m of methods) {
      const desc = m.description ? ` — ${m.description}` : '';
      sections.push(`- **${m.name}()**${desc}`);
    }
  }

  return sections.join('\n').trim();
}

// ─── Handler: findComponents ──────────────────────────────────────────────────

export function findComponents(query: string): string {
  const cem = loadCem();
  const q = query.toLowerCase();
  const matches = getComponentDeclarations(cem).filter(
    (c) =>
      c.tagName.includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q),
  );

  if (matches.length === 0) {
    return `No components matching "${query}".`;
  }

  const lines = matches.map((c) => {
    const desc = c.description ? ` — ${c.description.split('\n')[0]}` : '';
    return `${c.tagName}${desc}`;
  });

  return `${matches.length} result${matches.length === 1 ? '' : 's'} for "${query}":\n${lines.join('\n')}`;
}

// ─── Handler: getComponentProperties ─────────────────────────────────────────

export function getComponentProperties(tagName: string): string {
  const cem = loadCem();
  const component = getComponentDeclarations(cem).find((c) => c.tagName === tagName);

  if (!component) {
    throw new Error(`Component "${tagName}" not found in CEM.`);
  }

  const props = (component.members ?? []).filter((m) => m.kind === 'field');
  if (props.length === 0) {
    return `${tagName} has no documented properties.`;
  }

  const lines = props.map((p) => {
    const type = p.type?.text ? ` \`${p.type.text}\`` : '';
    const attr = p.attribute ? ` attr="${p.attribute}"` : '';
    const def = p.default != null ? ` default=${p.default}` : '';
    const desc = p.description ? ` — ${p.description}` : '';
    return `  ${p.name}${type}${attr}${def}${desc}`;
  });

  return `${tagName} properties (${props.length}):\n${lines.join('\n')}`;
}

// ─── Handler: listSlots ───────────────────────────────────────────────────────

export function listSlots(tagName: string): string {
  const cem = loadCem();
  const component = getComponentDeclarations(cem).find((c) => c.tagName === tagName);

  if (!component) {
    throw new Error(`Component "${tagName}" not found in CEM.`);
  }

  const slots = component.slots ?? [];
  if (slots.length === 0) {
    return `${tagName} has no named slots (content goes in the default slot).`;
  }

  const lines = slots.map((s) => {
    const name = s.name ? `slot="${s.name}"` : '(default slot)';
    const desc = s.description ? ` — ${s.description}` : '';
    return `  ${name}${desc}`;
  });

  return `${tagName} slots (${slots.length}):\n${lines.join('\n')}`;
}

// ─── Handler: listEvents ──────────────────────────────────────────────────────

export function listEvents(tagName: string): string {
  const cem = loadCem();
  const component = getComponentDeclarations(cem).find((c) => c.tagName === tagName);

  if (!component) {
    throw new Error(`Component "${tagName}" not found in CEM.`);
  }

  const events = component.events ?? [];
  if (events.length === 0) {
    return `${tagName} dispatches no documented events.`;
  }

  const lines = events.map((e) => {
    const type = e.type?.text ? ` \`${e.type.text}\`` : '';
    const desc = e.description ? ` — ${e.description}` : '';
    return `  ${e.name}${type}${desc}`;
  });

  return `${tagName} events (${events.length}):\n${lines.join('\n')}`;
}

// ─── Handler: getDesignTokens ─────────────────────────────────────────────────

export function getDesignTokens(category?: string): string {
  const tokens = loadTokens();

  const entries = category
    ? { [category]: tokens[category] }
    : (tokens as { [key: string]: { [key: string]: TokenNode } });

  if (category && !tokens[category]) {
    const available = Object.keys(tokens).join(', ');
    throw new Error(`Token category "${category}" not found. Available: ${available}`);
  }

  const allTokens: Array<{ name: string; value: string }> = [];
  for (const [cat, node] of Object.entries(entries)) {
    if (node) {
      allTokens.push(...flattenTokens(node as { [key: string]: TokenNode }, `--hx-${cat}`));
    }
  }

  if (allTokens.length === 0) {
    return 'No tokens found.';
  }

  const lines = allTokens.map((t) => `${t.name}: ${t.value}`);
  return `${allTokens.length} token${allTokens.length === 1 ? '' : 's'}${category ? ` in "${category}"` : ''}:\n${lines.join('\n')}`;
}

// ─── Handler: findToken ───────────────────────────────────────────────────────

export function findToken(name: string): string {
  const tokens = loadTokens();
  const query = name.toLowerCase().replace(/^--hx-/, '');

  const allTokens: Array<{ name: string; value: string }> = [];
  for (const [cat, node] of Object.entries(tokens)) {
    allTokens.push(...flattenTokens(node as { [key: string]: TokenNode }, `--hx-${cat}`));
  }

  const matches = allTokens.filter((t) => t.name.toLowerCase().includes(query));

  if (matches.length === 0) {
    return `No tokens matching "${name}".`;
  }

  const lines = matches.map((t) => `${t.name}: ${t.value}`);
  return `${matches.length} token${matches.length === 1 ? '' : 's'} matching "${name}":\n${lines.join('\n')}`;
}

// ─── Handler: generateImport ──────────────────────────────────────────────────

export function generateImport(tagName: string): string {
  const cem = loadCem();
  const component = getComponentDeclarations(cem).find((c) => c.tagName === tagName);

  if (!component) {
    throw new Error(`Component "${tagName}" not found in CEM.`);
  }

  const className = component.name;
  return [
    `// ESM (recommended)`,
    `import '@helixui/library/components/${tagName}/index.js';`,
    '',
    `// Named import`,
    `import { ${className} } from '@helixui/library';`,
    '',
    `// HTML usage`,
    `// <${tagName}></${tagName}>`,
  ].join('\n');
}

// ─── Handler: getLibrarySummary ───────────────────────────────────────────────

export function getLibrarySummary(): string {
  const cem = loadCem();
  const components = getComponentDeclarations(cem);

  let tokenCount = 0;
  try {
    const tokens = loadTokens();
    for (const node of Object.values(tokens)) {
      const flat = flattenTokens(node as { [key: string]: TokenNode }, '--hx-tmp');
      tokenCount += flat.length;
    }
  } catch {
    // tokens file unavailable — not fatal for library summary
  }

  const version = cem.schemaVersion ?? 'unknown';
  const lines = [
    `HELiX UI Library`,
    `  CEM schema version: ${version}`,
    `  Components: ${components.length}`,
    `  Design tokens: ${tokenCount > 0 ? tokenCount : 'unavailable'}`,
    '',
    `  Import: import '@helixui/library';`,
    `  CDN:    https://cdn.jsdelivr.net/npm/@helixui/library/dist/index.js`,
  ];

  return lines.join('\n');
}
