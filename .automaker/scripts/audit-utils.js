/**
 * audit-utils.js — HELiX Error Resilience Audit Utilities
 *
 * Static analysis helpers used by run-error-resilience-audit.js to examine
 * component source files without running a browser. Findings are generated
 * from source-code inspection rather than runtime execution.
 *
 * Test Methodology:
 *   - Read component .ts source files
 *   - Detect presence/absence of input validation patterns
 *   - Detect lifecycle cleanup completeness (disconnectedCallback)
 *   - Detect observer cleanup (MutationObserver, ResizeObserver, setTimeout)
 *   - Detect parent-child dependency guard patterns (devWarn, closestElement)
 *   - Detect slot-change handling patterns for late projection
 *   - Cross-reference with Lit 3.x property update batching guarantees
 *
 * Success Criteria:
 *   - Every finding has component, testCategory, scenario, behavior,
 *     category, severity, and remediation fields
 *   - critical: component crash or unrecoverable error
 *   - high: data loss, silent state corruption, or leaked memory confirmed
 *   - medium: degraded UX or missing developer guidance without user impact
 *   - low: minor improvement opportunities (better warnings, edge cases)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const COMPONENTS_PATH = join(
  process.cwd(),
  'packages/hx-library/src/components'
);

/**
 * Read a component's TypeScript source file.
 * Returns null if the file does not exist.
 */
export function readComponentSource(componentName) {
  const filePath = join(COMPONENTS_PATH, componentName, `${componentName}.ts`);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf-8');
}

/**
 * Check whether a component source contains a pattern string.
 */
export function sourceContains(source, pattern) {
  return source.includes(pattern);
}

/**
 * Check whether a component implements disconnectedCallback.
 */
export function hasDisconnectedCallback(source) {
  return /disconnectedCallback\s*\(\s*\)/.test(source);
}

/**
 * Check whether disconnectedCallback clears a given resource type.
 * @param {string} source - Component source
 * @param {string} resourcePattern - e.g. 'clearTimeout', 'removeEventListener', '_observer?.disconnect'
 */
export function disconnectCallbackClears(source, resourcePattern) {
  const dcbMatch = source.match(
    /disconnectedCallback\s*\(\s*\)[^{]*\{([\s\S]*?)(?=\n\s{2}(?:override\s+)?\w|\n\s{2}\/\/)/
  );
  if (!dcbMatch) {
    // Fallback: check entire source for pattern after disconnectedCallback
    const idx = source.indexOf('disconnectedCallback');
    if (idx === -1) return false;
    const segment = source.slice(idx, idx + 600);
    return segment.includes(resourcePattern);
  }
  return dcbMatch[1].includes(resourcePattern);
}

/**
 * Check whether a component uses devWarn for any validation.
 */
export function usesDevWarn(source) {
  return source.includes('devWarn(');
}

/**
 * Check whether a component handles slotchange events.
 */
export function handlesSlotChange(source) {
  return source.includes('slotchange') || source.includes('@slotchange');
}

/**
 * Check whether a component uses MutationObserver.
 */
export function usesMutationObserver(source) {
  return source.includes('MutationObserver');
}

/**
 * Check whether a component uses ResizeObserver.
 */
export function usesResizeObserver(source) {
  return source.includes('ResizeObserver');
}

/**
 * Check whether a component uses IntersectionObserver.
 */
export function usesIntersectionObserver(source) {
  return source.includes('IntersectionObserver');
}

/**
 * Check whether a component uses setTimeout.
 */
export function usesSetTimeout(source) {
  return source.includes('setTimeout(');
}

/**
 * Check whether a component registers document-level event listeners.
 */
export function usesDocumentListeners(source) {
  return source.includes('document.addEventListener(');
}

/**
 * Create a finding record.
 */
export function finding({
  component,
  testCategory,
  scenario,
  behavior,
  category,
  severity,
  remediation,
  file,
  line,
}) {
  return {
    component,
    testCategory,
    scenario,
    behavior,
    category,
    severity,
    remediation,
    ...(file ? { file } : {}),
    ...(line ? { line } : {}),
  };
}
