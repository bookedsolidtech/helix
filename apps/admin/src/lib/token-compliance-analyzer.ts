/**
 * Token Compliance Analyzer.
 * Checks whether component-level CSS custom properties properly
 * reference the main @helixui/tokens system.
 *
 * Tier 3 (component tokens like --hx-button-bg) should always resolve
 * to a Tier 2/1 system token (--hx-color-primary-500, --hx-space-4, etc.).
 * A component token pointing to a hardcoded value instead of a system token
 * is a health risk — it breaks the cascade and makes theming inconsistent.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface TokenComplianceResult {
  tagName: string;
  score: number;
  componentTokens: ComponentTokenInfo[];
  variantAssignments: VariantAssignment[];
  totalDeclarations: number;
  compliantDeclarations: number;
  detail: string;
}

export interface ComponentTokenInfo {
  name: string;
  defaultValue: string;
  referencesSystemToken: boolean;
  systemTokenRef: string | null;
}

export interface VariantAssignment {
  tokenName: string;
  value: string;
  referencesSystemToken: boolean;
}

const CSS_NATIVE_VALUES = new Set([
  'transparent',
  'none',
  'inherit',
  'initial',
  'unset',
  'currentColor',
  '0',
  'auto',
  'normal',
  'revert',
]);

function getLibraryRoot(): string {
  return resolve(process.cwd(), '../../packages/hx-library');
}

function findSystemTokenRef(value: string, componentPrefix: string): string | null {
  const trimmed = value.trim();

  if (CSS_NATIVE_VALUES.has(trimmed)) {
    return 'css-native';
  }

  const varRefs = [...trimmed.matchAll(/var\((--hx-[\w-]+)/g)];

  for (const ref of varRefs) {
    const tokenName = ref[1];
    if (!tokenName.startsWith(`--hx-${componentPrefix}-`)) {
      return tokenName;
    }
  }

  return null;
}

export function analyzeTokenCompliance(tagName: string): TokenComplianceResult | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const stylesPath = resolve(libRoot, `src/components/${dir}/${tagName}.styles.ts`);

  let content: string;
  try {
    content = readFileSync(stylesPath, 'utf-8');
  } catch {
    return null;
  }

  // Derive component token prefix from @cssprop annotations
  // hx-button → "button", hx-card → "card", hx-text-input → "input"
  const firstCssprop = content.match(/@cssprop\s+\[(--hx-([\w]+)-)/);
  const componentPrefix = firstCssprop ? firstCssprop[2] : tagName.replace('hx-', '');

  // 1. Parse @cssprop annotations for component token declarations
  const componentTokens: ComponentTokenInfo[] = [];
  const csspropRegex = /@cssprop\s+\[(--hx-[\w-]+)(?:=([^\]]+))?\]/g;
  let match;

  while ((match = csspropRegex.exec(content)) !== null) {
    const name = match[1];
    const defaultValue = match[2]?.trim() ?? '';
    const systemRef = findSystemTokenRef(defaultValue, componentPrefix);

    componentTokens.push({
      name,
      defaultValue,
      referencesSystemToken: systemRef !== null,
      systemTokenRef: systemRef,
    });
  }

  // 2. Find variant assignments of component tokens in CSS body
  // e.g. .button--primary { --hx-button-bg: var(--hx-color-primary-500); }
  const variantAssignments: VariantAssignment[] = [];
  const assignRegex = new RegExp(`(--hx-${componentPrefix}-[\\w-]+):\\s*([^;]+);`, 'g');

  while ((match = assignRegex.exec(content)) !== null) {
    const tokenName = match[1];
    const value = match[2].trim();
    const systemRef = findSystemTokenRef(value, componentPrefix);

    variantAssignments.push({
      tokenName,
      value,
      referencesSystemToken: systemRef !== null,
    });
  }

  // Score: weighted blend of declaration compliance (70%) and variant compliance (30%)
  const declCompliant = componentTokens.filter((t) => t.referencesSystemToken).length;
  const declTotal = componentTokens.length;
  const declScore = declTotal > 0 ? (declCompliant / declTotal) * 100 : 100;

  const assignCompliant = variantAssignments.filter((a) => a.referencesSystemToken).length;
  const assignTotal = variantAssignments.length;
  const assignScore = assignTotal > 0 ? (assignCompliant / assignTotal) * 100 : 100;

  const totalDeclarations = declTotal + assignTotal;
  const compliantDeclarations = declCompliant + assignCompliant;

  const score = Math.round(declScore * 0.7 + assignScore * 0.3);

  const detail = `${compliantDeclarations}/${totalDeclarations} token declarations reference system tokens`;

  return {
    tagName,
    score,
    componentTokens,
    variantAssignments,
    totalDeclarations,
    compliantDeclarations,
    detail,
  };
}
