/**
 * CEM Accessibility Analyzer
 *
 * Analyzes Custom Elements Manifest (CEM) data to produce structured
 * accessibility reports with per-component scores and recommendations.
 *
 * @example
 * ```ts
 * import { analyzeCEM } from './tools/cem-a11y-analyzer/index.js';
 *
 * const manifest = JSON.parse(fs.readFileSync('custom-elements.json', 'utf8'));
 * const report = await analyzeCEM(manifest);
 * console.log(`Library score: ${report.libraryScore}/100 (${report.libraryGrade})`);
 * ```
 */

import { analyzeAria } from './analyzers/aria-analyzer.js';
import { analyzeFocus } from './analyzers/focus-analyzer.js';
import { analyzeForm } from './analyzers/form-analyzer.js';
import { analyzeKeyboard } from './analyzers/keyboard-analyzer.js';
import { analyzeLabel } from './analyzers/label-analyzer.js';
import { analyzeMotion } from './analyzers/motion-analyzer.js';
import { generateReport } from './reporter.js';
import { buildComponentProfile } from './scorer.js';
import type {
  A11yDimension,
  A11yReport,
  AnalysisOptions,
  AnalyzerFn,
  CemDeclaration,
  CustomElementsManifest,
} from './types.js';

/** All analyzer functions keyed by dimension. */
const ANALYZERS: Record<A11yDimension, AnalyzerFn> = {
  ariaSupport: analyzeAria,
  formAssociation: analyzeForm,
  keyboardAccess: analyzeKeyboard,
  focusManagement: analyzeFocus,
  labelSupport: analyzeLabel,
  motionSafety: analyzeMotion,
};

/**
 * Analyze a Custom Elements Manifest for accessibility patterns.
 *
 * @param manifest - Parsed CEM JSON object
 * @param options - Optional configuration for source analysis and dimension filtering
 * @returns Structured accessibility report with scores and recommendations
 * @throws Error if the manifest is malformed (missing modules array)
 */
export async function analyzeCEM(
  manifest: CustomElementsManifest,
  options: AnalysisOptions = {},
): Promise<A11yReport> {
  if (!manifest.modules || !Array.isArray(manifest.modules)) {
    throw new Error(
      'Missing modules array in manifest. Ensure the CEM is valid per the Custom Elements Manifest schema.',
    );
  }

  const skipDimensions = new Set(options.skipDimensions ?? []);
  const activeAnalyzers = Object.entries(ANALYZERS).filter(
    ([dim]) => !skipDimensions.has(dim as A11yDimension),
  ) as Array<[A11yDimension, AnalyzerFn]>;

  const components = [];

  for (const mod of manifest.modules) {
    for (const decl of mod.declarations ?? []) {
      if (!isCustomElement(decl)) continue;

      const tagName = decl.tagName ?? '';
      if (!tagName) continue;

      const results = await Promise.all(
        activeAnalyzers.map(([, analyzer]) => analyzer(decl, mod.path, options)),
      );

      const profile = buildComponentProfile(tagName, decl.name, results);
      components.push(profile);
    }
  }

  return generateReport(components);
}

/**
 * Determine if a CEM declaration is a custom element (not a mixin or plain class).
 */
function isCustomElement(decl: CemDeclaration): boolean {
  // Has a tagName, or customElement flag, or extends LitElement/HTMLElement
  if (decl.tagName) return true;
  if (decl.customElement) return true;
  if (decl.superclass?.name === 'LitElement' || decl.superclass?.name === 'HTMLElement') {
    return true;
  }
  return false;
}

// Re-export public types
export type {
  A11yDimension,
  A11yReport,
  AnalysisOptions,
  AnalyzerResult,
  ComponentA11yProfile,
  CustomElementsManifest,
  DimensionScore,
  Grade,
  Recommendation,
  ReportSummary,
  Severity,
} from './types.js';

export { scoreToGrade } from './scorer.js';
export { generateReport } from './reporter.js';
