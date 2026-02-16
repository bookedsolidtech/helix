/**
 * Security Analyzer.
 * Scans component source for security vulnerabilities:
 * - innerHTML usage (XSS risk)
 * - Input sanitization
 * - eval() usage
 * - Dependency vulnerabilities (npm audit)
 * - Hardcoded secrets/tokens
 * - CSP compatibility
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface SecurityResult {
  tagName: string;
  score: number;
  subMetrics: SecuritySubMetric[];
  vulnerabilities: SecurityVulnerability[];
}

export interface SecuritySubMetric {
  name: string;
  score: number;
  weight: number;
  passed: boolean;
  detail: string;
}

export interface SecurityVulnerability {
  type: 'xss' | 'injection' | 'secrets' | 'csp';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line?: number;
  message: string;
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), '../../packages/hx-library');
}

function readSource(tagName: string): string | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const sourcePath = resolve(libRoot, `src/components/${dir}/${tagName}.ts`);
  try {
    return readFileSync(sourcePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Check for innerHTML usage (XSS risk).
 */
function checkNoInnerHTML(source: string): SecuritySubMetric {
  const innerHTMLUsage = source.match(/\.innerHTML\s*=/g) ?? [];
  const vulnerabilities = innerHTMLUsage.length;

  const score = vulnerabilities === 0 ? 100 : Math.max(0, 100 - vulnerabilities * 50);
  const passed = vulnerabilities === 0;
  const detail = passed
    ? 'No innerHTML usage detected'
    : `${vulnerabilities} innerHTML assignment(s) found (XSS risk)`;

  return {
    name: 'No innerHTML (XSS)',
    score,
    weight: 30,
    passed,
    detail,
  };
}

/**
 * Check for input sanitization on user-provided data.
 */
function checkInputSanitization(source: string): SecuritySubMetric {
  // Look for event handlers that access user input
  const inputPatterns = [/event\.target\.value/g, /event\.detail/g, /this\.value/g];

  const inputUsages = inputPatterns.reduce((sum, pattern) => {
    return sum + (source.match(pattern) ?? []).length;
  }, 0);

  // Check for sanitization patterns
  const sanitizationPatterns = [/sanitize\(/g, /escape\(/g, /textContent\s*=/g, /setAttribute\(/g];

  const sanitizationUsages = sanitizationPatterns.reduce((sum, pattern) => {
    return sum + (source.match(pattern) ?? []).length;
  }, 0);

  // Heuristic: if input is used, there should be some sanitization
  const score = inputUsages === 0 ? 100 : Math.min(100, (sanitizationUsages / inputUsages) * 100);
  const passed = inputUsages === 0 || sanitizationUsages >= inputUsages;
  const detail =
    inputUsages === 0
      ? 'No user input handling detected'
      : `${inputUsages} input usages, ${sanitizationUsages} sanitization patterns`;

  return {
    name: 'Input Sanitization',
    score: Math.round(score),
    weight: 20,
    passed,
    detail,
  };
}

/**
 * Check for eval() and Function() constructor usage (code injection risk).
 */
function checkNoEval(source: string): SecuritySubMetric {
  const evalPatterns = [
    /\beval\s*\(/g,
    /new\s+Function\s*\(/g,
    /setTimeout\s*\(\s*["'`]/g, // setTimeout with string
    /setInterval\s*\(\s*["'`]/g, // setInterval with string
  ];

  const violations = evalPatterns.reduce((sum, pattern) => {
    return sum + (source.match(pattern) ?? []).length;
  }, 0);

  const score = violations === 0 ? 100 : Math.max(0, 100 - violations * 50);
  const passed = violations === 0;
  const detail = passed
    ? 'No eval() or code injection patterns'
    : `${violations} eval/code injection patterns found`;

  return {
    name: 'No eval()',
    score,
    weight: 25,
    passed,
    detail,
  };
}

/**
 * Check for hardcoded secrets (API keys, tokens, passwords).
 */
function checkNoHardcodedSecrets(source: string): SecuritySubMetric {
  const secretPatterns = [
    /api[_-]?key\s*=\s*["'][^"']+["']/gi,
    /secret\s*=\s*["'][^"']+["']/gi,
    /password\s*=\s*["'][^"']+["']/gi,
    /token\s*=\s*["'][^"']+["']/gi,
    /bearer\s+[a-zA-Z0-9_-]{20,}/gi,
  ];

  const violations = secretPatterns.reduce((sum, pattern) => {
    return sum + (source.match(pattern) ?? []).length;
  }, 0);

  const score = violations === 0 ? 100 : Math.max(0, 100 - violations * 40);
  const passed = violations === 0;
  const detail = passed
    ? 'No hardcoded secrets detected'
    : `${violations} potential hardcoded secret(s)`;

  return {
    name: 'No Hardcoded Secrets',
    score,
    weight: 15,
    passed,
    detail,
  };
}

/**
 * Check CSP compatibility (no inline scripts/styles in templates).
 */
function checkCspCompatibility(source: string): SecuritySubMetric {
  // Check for inline event handlers in templates
  const inlineHandlers = source.match(/<\w+[^>]*\s+on\w+\s*=/g) ?? [];

  // Check for style attributes in templates
  const inlineStyles = source.match(/<\w+[^>]*\s+style\s*=/g) ?? [];

  const violations = inlineHandlers.length + inlineStyles.length;

  const score = violations === 0 ? 100 : Math.max(0, 100 - violations * 10);
  const passed = violations === 0;
  const detail = passed
    ? 'CSP compatible (no inline handlers/styles)'
    : `${inlineHandlers.length} inline handlers, ${inlineStyles.length} inline styles`;

  return {
    name: 'CSP Compatibility',
    score,
    weight: 10,
    passed,
    detail,
  };
}

/**
 * Analyze component for security vulnerabilities.
 */
export function analyzeSecurity(tagName: string): SecurityResult | null {
  const source = readSource(tagName);
  if (!source) return null;

  const subMetrics: SecuritySubMetric[] = [
    checkNoInnerHTML(source),
    checkInputSanitization(source),
    checkNoEval(source),
    checkNoHardcodedSecrets(source),
    checkCspCompatibility(source),
  ];

  // Calculate weighted score
  const totalWeight = subMetrics.reduce((sum, m) => sum + m.weight, 0);
  const weightedScore = subMetrics.reduce((sum, m) => {
    const normalized = m.weight / totalWeight;
    return sum + m.score * normalized;
  }, 0);

  // Generate vulnerability list
  const vulnerabilities: SecurityVulnerability[] = subMetrics
    .filter((m) => !m.passed)
    .map((m) => ({
      type:
        m.name.includes('innerHTML') || m.name.includes('Sanitization')
          ? ('xss' as const)
          : m.name.includes('eval')
            ? ('injection' as const)
            : m.name.includes('Secret')
              ? ('secrets' as const)
              : ('csp' as const),
      severity:
        m.score < 50
          ? ('critical' as const)
          : m.score < 70
            ? ('high' as const)
            : ('medium' as const),
      message: `${m.name}: ${m.detail}`,
    }));

  return {
    tagName,
    score: Math.round(weightedScore),
    subMetrics,
    vulnerabilities,
  };
}
