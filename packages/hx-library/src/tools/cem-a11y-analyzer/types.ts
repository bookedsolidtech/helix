/**
 * CEM Accessibility Analyzer — Type Definitions
 *
 * All types for the accessibility analysis system that scores
 * Custom Elements Manifest data against WCAG 2.1 AA criteria.
 */

// ─── CEM Types (subset needed for analysis) ───────────────────────────

/** A CEM member (field or method) on a custom element declaration. */
export interface CemMember {
  kind: 'field' | 'method';
  name: string;
  type?: { text: string };
  default?: string;
  description?: string;
  privacy?: 'private' | 'protected' | 'public';
  static?: boolean;
  attribute?: string;
  reflects?: boolean;
  parameters?: Array<{ name: string; type?: { text: string } }>;
  return?: { type?: { text: string } };
}

/** A CSS custom property on a custom element declaration. */
export interface CemCssProperty {
  name: string;
  description?: string;
  default?: string;
}

/** A CSS part on a custom element declaration. */
export interface CemCssPart {
  name: string;
  description?: string;
}

/** A slot on a custom element declaration. */
export interface CemSlot {
  name: string;
  description?: string;
}

/** An event on a custom element declaration. */
export interface CemEvent {
  name: string;
  type?: { text: string };
  description?: string;
}

/** A custom element declaration within a CEM module. */
export interface CemDeclaration {
  kind: 'class' | 'mixin' | 'variable';
  name: string;
  description?: string;
  tagName?: string;
  customElement?: boolean;
  members?: CemMember[];
  attributes?: Array<{
    name: string;
    type?: { text: string };
    description?: string;
    default?: string;
    fieldName?: string;
  }>;
  events?: CemEvent[];
  slots?: CemSlot[];
  cssParts?: CemCssPart[];
  cssProperties?: CemCssProperty[];
  superclass?: { name: string; package?: string };
}

/** A module in the CEM manifest. */
export interface CemModule {
  kind: 'javascript-module';
  path: string;
  declarations?: CemDeclaration[];
  exports?: Array<{ kind: string; name: string; declaration: { name: string; module?: string } }>;
}

/** Root Custom Elements Manifest structure. */
export interface CustomElementsManifest {
  schemaVersion: string;
  readme?: string;
  modules: CemModule[];
}

// ─── Analysis Types ───────────────────────────────────────────────────

/** The six accessibility dimensions scored by the analyzer. */
export type A11yDimension =
  | 'ariaSupport'
  | 'formAssociation'
  | 'keyboardAccess'
  | 'focusManagement'
  | 'labelSupport'
  | 'motionSafety';

/** Score for a single accessibility dimension (0–100). */
export interface DimensionScore {
  dimension: A11yDimension;
  score: number;
  maxScore: number;
  findings: string[];
  recommendations: string[];
}

/** Accessibility profile for a single component. */
export interface ComponentA11yProfile {
  tagName: string;
  className: string;
  overallScore: number;
  grade: Grade;
  dimensions: Record<A11yDimension, DimensionScore>;
  recommendations: Recommendation[];
}

/** Letter grade derived from a numeric score. */
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/** Severity level for recommendations. */
export type Severity = 'critical' | 'major' | 'minor' | 'info';

/** An actionable recommendation for improving accessibility. */
export interface Recommendation {
  component: string;
  dimension: A11yDimension;
  severity: Severity;
  message: string;
  suggestion?: string;
}

/** Aggregate report for an entire library. */
export interface A11yReport {
  libraryScore: number;
  libraryGrade: Grade;
  componentCount: number;
  components: ComponentA11yProfile[];
  recommendations: Recommendation[];
  summary: ReportSummary;
}

/** High-level summary statistics. */
export interface ReportSummary {
  totalComponents: number;
  averageScore: number;
  gradeDistribution: Record<Grade, number>;
  dimensionAverages: Record<A11yDimension, number>;
  topIssues: Recommendation[];
}

/** Options for configuring the analysis run. */
export interface AnalysisOptions {
  /** Source file root for optional deeper analysis. */
  sourceRoot?: string;
  /** Function to read source file contents (for testability). */
  readFile?: (path: string) => Promise<string | null>;
  /** Dimensions to skip during analysis. */
  skipDimensions?: A11yDimension[];
  /** Minimum score threshold to flag a recommendation. */
  recommendationThreshold?: number;
}

/** Result from a single analyzer dimension. */
export interface AnalyzerResult {
  dimension: A11yDimension;
  score: number;
  maxScore: number;
  findings: string[];
  recommendations: Recommendation[];
}

/** Signature for an analyzer function. */
export type AnalyzerFn = (
  declaration: CemDeclaration,
  modulePath: string,
  options: AnalysisOptions,
) => Promise<AnalyzerResult>;
