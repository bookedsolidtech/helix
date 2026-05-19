#!/usr/bin/env node
/**
 * generate-llms.mjs
 *
 * Generates AI-consumable documentation surfaces for the HELiX docs site
 * per the https://llmstxt.org/ convention.
 *
 * Inputs:
 *   - packages/hx-library/custom-elements.json (CEM, source of truth for API)
 *   - packages/hx-library/aaa-verdicts.json    (committed WCAG 2.2 AAA snapshot)
 *   - workspace package.json files             (current published versions)
 *
 * Outputs:
 *   - apps/docs/public/llms.txt        (concise overview, target <= 5KB)
 *   - apps/docs/public/llms-full.txt   (full per-component snapshot, <= 500KB)
 *
 * Both outputs are gitignored — they are regenerated as a `prebuild` step
 * in apps/docs before astro build.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const CEM_PATH = path.join(REPO_ROOT, 'packages/hx-library/custom-elements.json');
const AAA_PATH = path.join(REPO_ROOT, 'packages/hx-library/aaa-verdicts.json');
const LIB_PKG_PATH = path.join(REPO_ROOT, 'packages/hx-library/package.json');
const ICONS_PKG_PATH = path.join(REPO_ROOT, 'packages/hx-icons/package.json');
const TOKENS_PKG_PATH = path.join(REPO_ROOT, 'packages/hx-tokens/package.json');
const REACT_PKG_PATH = path.join(REPO_ROOT, 'packages/hx-react/package.json');

const OUT_DIR = path.join(REPO_ROOT, 'apps/docs/public');
const LLMS_TXT = path.join(OUT_DIR, 'llms.txt');
const LLMS_FULL_TXT = path.join(OUT_DIR, 'llms-full.txt');

const DOCS_BASE = 'https://helix.bookedsolid.tech';
const STORYBOOK_BASE = 'https://storybook.helix.bookedsolid.tech';

const MAX_LLMS_TXT_BYTES = 5 * 1024;
const MAX_LLMS_FULL_BYTES = 500 * 1024;

/* -------------------------------------------------------------------------- */
/* IO helpers                                                                  */
/* -------------------------------------------------------------------------- */

async function readJson(filePath, { required = true } = {}) {
  if (!existsSync(filePath)) {
    if (required) {
      throw new Error(`Required file missing: ${filePath}`);
    }
    return null;
  }
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }
}

async function readPkgVersion(pkgPath) {
  const pkg = await readJson(pkgPath, { required: false });
  return pkg?.version ?? 'unknown';
}

/* -------------------------------------------------------------------------- */
/* CEM extraction                                                              */
/* -------------------------------------------------------------------------- */

function collectComponents(cem) {
  if (!cem || !Array.isArray(cem.modules)) {
    throw new Error('CEM is malformed: missing modules array.');
  }
  const components = [];
  for (const mod of cem.modules) {
    for (const decl of mod.declarations ?? []) {
      if (decl?.customElement === true && typeof decl.tagName === 'string') {
        components.push(decl);
      }
    }
  }
  // Deterministic order by tag name.
  components.sort((a, b) => a.tagName.localeCompare(b.tagName));
  return components;
}

function firstSentence(text) {
  if (!text) return '';
  const collapsed = String(text).replace(/\s+/g, ' ').trim();
  const dot = collapsed.indexOf('. ');
  if (dot > 0 && dot < 200) return collapsed.slice(0, dot + 1);
  return collapsed;
}

function truncate(text, max) {
  if (!text) return '';
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

function escapePipes(text) {
  if (text === undefined || text === null) return '';
  return String(text).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
}

function isPublicField(member) {
  if (!member || member.kind !== 'field') return false;
  if (member.privacy === 'private' || member.privacy === 'protected') return false;
  if (member.static === true) return false;
  return true;
}

function isInternalCssProp(prop) {
  return typeof prop?.name === 'string' && prop.name.startsWith('--_');
}

/* -------------------------------------------------------------------------- */
/* Markdown writers                                                            */
/* -------------------------------------------------------------------------- */

function table(headers, rows) {
  if (rows.length === 0) return '_None._\n';
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map(escapePipes).join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}\n`;
}

function renderProperties(decl) {
  const rows = (decl.members ?? [])
    .filter(isPublicField)
    .map((m) => [
      m.name ?? '',
      m.type?.text ?? '',
      m.default ?? '',
      firstSentence(m.description ?? m.summary ?? ''),
    ]);
  return table(['Name', 'Type', 'Default', 'Description'], rows);
}

function renderEvents(decl) {
  const rows = (decl.events ?? []).map((e) => [
    e.name ?? '',
    e.type?.text ?? '',
    firstSentence(e.description ?? e.summary ?? ''),
  ]);
  return table(['Name', 'Detail type', 'Description'], rows);
}

function renderSlots(decl) {
  const rows = (decl.slots ?? []).map((s) => [
    s.name ? s.name : '(default)',
    firstSentence(s.description ?? s.summary ?? ''),
  ]);
  return table(['Name', 'Description'], rows);
}

function renderCssParts(decl) {
  const rows = (decl.cssParts ?? []).map((p) => [
    p.name ?? '',
    firstSentence(p.description ?? p.summary ?? ''),
  ]);
  return table(['Name', 'Description'], rows);
}

function renderCssProperties(decl) {
  const rows = (decl.cssProperties ?? [])
    .filter((p) => !isInternalCssProp(p))
    .map((p) => [p.name ?? '', p.default ?? '', firstSentence(p.description ?? p.summary ?? '')]);
  return table(['Name', 'Default', 'Description'], rows);
}

function renderAccessibility(tagName, aaa) {
  const componentVerdicts = aaa?.components?.[tagName];
  if (!componentVerdicts) {
    return '_No AAA cert snapshot recorded for this component. Outside the P0 self-cert scope._\n';
  }
  const supports = [];
  const notApplicable = [];
  const other = [];
  for (const [criterion, entry] of Object.entries(componentVerdicts)) {
    const v = entry?.verdict;
    if (v === 'Supports') {
      supports.push({ criterion, evidence: entry.evidence ?? '' });
    } else if (v === 'Not Applicable') {
      notApplicable.push(criterion);
    } else {
      other.push({
        criterion,
        verdict: v ?? 'Unknown',
        evidence: entry?.evidence ?? '',
      });
    }
  }

  const lines = [];
  if (supports.length > 0) {
    lines.push('Supports:');
    for (const s of supports.sort((a, b) => a.criterion.localeCompare(b.criterion))) {
      lines.push(`- ${s.criterion}: ${firstSentence(s.evidence)}`);
    }
  }
  if (notApplicable.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push(`Not applicable: ${notApplicable.sort().join(', ')}`);
  }
  if (other.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Other:');
    for (const o of other.sort((a, b) => a.criterion.localeCompare(b.criterion))) {
      lines.push(`- ${o.criterion} (${o.verdict}): ${firstSentence(o.evidence)}`);
    }
  }
  return lines.join('\n') + '\n';
}

function renderUsage(decl) {
  const tag = decl.tagName;
  // Use the first sentence of summary as inline comment, if available.
  const summary = decl.summary ? firstSentence(decl.summary) : '';
  const inner = summary ? `<!-- ${truncate(summary, 80)} -->` : '';
  return ['```html', `<${tag}>${inner}</${tag}>`, '```', ''].join('\n');
}

/* -------------------------------------------------------------------------- */
/* llms.txt                                                                    */
/* -------------------------------------------------------------------------- */

function buildLlmsTxt({ versions, components, aaa }) {
  const supportsCount = countSupportsVerdicts(aaa);
  const certCount = Object.keys(aaa?.components ?? {}).length;
  const criteriaCount = Object.keys(Object.values(aaa?.components ?? {})[0] ?? {}).length || 11;

  const header = [
    '# HELiX',
    '',
    `> Lit 3.x web components for healthcare applications. WCAG 2.2 AAA self-certified on the P0 surface (${certCount} components, ${supportsCount} Supports verdicts across ${criteriaCount} criteria).`,
    '',
    `Current release: @helixui/library@${versions.library}, @helixui/icons@${versions.icons}, @helixui/tokens@${versions.tokens}, @helixui/react@${versions.react}.`,
    '',
    '## Documentation',
    '',
    `- [Installation](${DOCS_BASE}/getting-started/installation/)`,
    `- [Quick start](${DOCS_BASE}/getting-started/quick-start/)`,
    `- [Drupal integration](${DOCS_BASE}/drupal/)`,
    `- [Framework integration](${DOCS_BASE}/framework-integration/)`,
    `- [Accessibility / self-cert scope](${DOCS_BASE}/accessibility/self-cert-scope/)`,
    `- [Live component reference (Storybook)](${STORYBOOK_BASE}/)`,
    `- [Full LLM context](${DOCS_BASE}/llms-full.txt)`,
    '',
    '## Components',
    '',
  ].join('\n');

  // Aim for <= 5KB. With ~100+ components, descriptions must stay terse.
  // Strip leading boilerplate, drop descriptions for sub-components whose
  // name is fully implied by the parent (e.g. hx-tab-panel under hx-tabs).
  // The full prose lives in llms-full.txt.
  const tagSet = new Set(components.map((c) => c.tagName));
  const lines = [];
  for (const decl of components) {
    const desc = describeForIndex(decl, tagSet);
    if (desc) {
      lines.push(`- **${decl.tagName}** — ${desc}`);
    } else {
      lines.push(`- **${decl.tagName}**`);
    }
  }

  return header + lines.join('\n') + '\n';
}

function describeForIndex(decl, tagSet) {
  const tag = decl.tagName;
  // If a sibling sub-component (hx-foo-item with parent hx-foo present),
  // skip the description entirely — the tag name is self-documenting.
  const parts = tag.split('-');
  if (parts.length > 2) {
    const parent = parts.slice(0, -1).join('-');
    if (tagSet.has(parent)) return '';
  }
  const raw = firstSentence(decl.description ?? decl.summary ?? '');
  const cleaned = trimLeadingFiller(raw);
  return truncate(cleaned, 55);
}

function trimLeadingFiller(text) {
  if (!text) return '';
  return text
    .replace(/^A production-grade\s+/i, '')
    .replace(/^A Lit(\s+3(\.x)?)?\s+/i, '')
    .replace(/^A custom\s+/i, '')
    .replace(/^An?\s+/i, '');
}

function countSupportsVerdicts(aaa) {
  let count = 0;
  for (const tag of Object.keys(aaa?.components ?? {})) {
    for (const criterion of Object.keys(aaa.components[tag])) {
      if (aaa.components[tag][criterion]?.verdict === 'Supports') count++;
    }
  }
  return count;
}

/* -------------------------------------------------------------------------- */
/* llms-full.txt                                                               */
/* -------------------------------------------------------------------------- */

function buildLlmsFull({ versions, components, aaa, cem }) {
  const generatedAt = new Date().toISOString();
  const header = [
    '# HELiX — Full LLM Context',
    '',
    `Generated: ${generatedAt}`,
    `Library: @helixui/library@${versions.library}`,
    `Icons: @helixui/icons@${versions.icons}`,
    `Tokens: @helixui/tokens@${versions.tokens}`,
    `React wrappers: @helixui/react@${versions.react}`,
    `CEM schema: ${cem.schemaVersion ?? 'unknown'}`,
    aaa?.generatedAt ? `AAA verdicts snapshot: ${aaa.generatedAt}` : null,
    aaa?.standards ? `Standards: ${aaa.standards}` : null,
    aaa?.standardsSource ? `Standards source: ${aaa.standardsSource}` : null,
    '',
    `Total components: ${components.length}`,
    '',
    '---',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const blocks = components.map((decl) => renderComponentBlock(decl, aaa));
  return header + blocks.join('\n');
}

function renderComponentBlock(decl, aaa) {
  const tag = decl.tagName;
  const description = (decl.description ?? decl.summary ?? '').trim() || '_No description in CEM._';

  return [
    `## ${tag}`,
    '',
    description,
    '',
    '### Properties',
    '',
    renderProperties(decl),
    '### Events',
    '',
    renderEvents(decl),
    '### Slots',
    '',
    renderSlots(decl),
    '### CSS parts',
    '',
    renderCssParts(decl),
    '### CSS custom properties',
    '',
    renderCssProperties(decl),
    '### Accessibility (WCAG 2.2 AAA)',
    '',
    renderAccessibility(tag, aaa),
    '### Usage',
    '',
    renderUsage(decl),
    '---',
    '',
  ].join('\n');
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  const cem = await readJson(CEM_PATH);
  if (!cem || !Array.isArray(cem.modules)) {
    throw new Error(
      `CEM at ${CEM_PATH} is missing or malformed. Run \`pnpm --filter=@helixui/library run cem\` first.`,
    );
  }
  const aaa = (await readJson(AAA_PATH, { required: false })) ?? {
    components: {},
  };

  const versions = {
    library: await readPkgVersion(LIB_PKG_PATH),
    icons: await readPkgVersion(ICONS_PKG_PATH),
    tokens: await readPkgVersion(TOKENS_PKG_PATH),
    react: await readPkgVersion(REACT_PKG_PATH),
  };

  const components = collectComponents(cem);
  if (components.length === 0) {
    throw new Error(
      'CEM contains zero custom-element declarations. Refusing to emit empty output.',
    );
  }

  const llmsTxt = buildLlmsTxt({ versions, components, aaa });
  const llmsFull = buildLlmsFull({ versions, components, aaa, cem });

  const llmsTxtBytes = Buffer.byteLength(llmsTxt, 'utf8');
  const llmsFullBytes = Buffer.byteLength(llmsFull, 'utf8');

  if (llmsTxtBytes > MAX_LLMS_TXT_BYTES) {
    // Soft warn; do not fail. We may need to truncate descriptions further.
    console.warn(
      `[generate-llms] WARN: llms.txt is ${llmsTxtBytes} bytes (target <= ${MAX_LLMS_TXT_BYTES}).`,
    );
  }
  if (llmsFullBytes > MAX_LLMS_FULL_BYTES) {
    throw new Error(
      `llms-full.txt exceeds hard ceiling: ${llmsFullBytes} bytes (max ${MAX_LLMS_FULL_BYTES}).`,
    );
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(LLMS_TXT, llmsTxt, 'utf8');
  await writeFile(LLMS_FULL_TXT, llmsFull, 'utf8');

  console.log(
    `[generate-llms] wrote ${components.length} components — llms.txt ${formatBytes(llmsTxtBytes)}, llms-full.txt ${formatBytes(llmsFullBytes)}`,
  );
}

function formatBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

main().catch((err) => {
  console.error('[generate-llms] failed:', err.message);
  process.exit(1);
});
