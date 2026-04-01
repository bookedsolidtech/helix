import { validateIntegration, type ValidationResult } from './validate-integration.js';
import { auditTokens } from './audit-tokens.js';
import { analyzeExtension, type AnalysisResult } from './analyze-extension.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthFinding {
  category: 'critical' | 'warning' | 'info';
  source: 'validate-integration' | 'audit-tokens' | 'analyze-extension';
  type: string;
  message: string;
  location?: string;
}

export interface HealthReport {
  projectPath: string;
  score: number;
  findings: {
    critical: HealthFinding[];
    warning: HealthFinding[];
    info: HealthFinding[];
  };
  recommendations: string[];
  summary: string;
}

export interface HealthCheckOptions {
  projectPath: string;
  /** Optional path to a TypeScript file that extends a HELiX component. */
  extensionFile?: string;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

const DEDUCTION = {
  critical: 10,
  warning: 5,
  info: 1,
} as const;

function computeScore(findings: HealthReport['findings']): number {
  const deductions =
    findings.critical.length * DEDUCTION.critical +
    findings.warning.length * DEDUCTION.warning +
    findings.info.length * DEDUCTION.info;
  return Math.max(0, 100 - deductions);
}

// ─── Finding collectors ───────────────────────────────────────────────────────

function collectValidationFindings(projectPath: string): HealthFinding[] {
  const json = validateIntegration(projectPath);
  const result = JSON.parse(json) as ValidationResult;
  return result.issues.map((issue) => ({
    category:
      issue.severity === 'error' ? 'critical' : issue.severity === 'warning' ? 'warning' : 'info',
    source: 'validate-integration' as const,
    type: issue.type,
    message: issue.message,
    location: issue.location,
  }));
}

function collectTokenFindings(projectPath: string): HealthFinding[] {
  const report = auditTokens({ path: projectPath });
  const findings: HealthFinding[] = [];

  for (const f of report.findings.unknown) {
    findings.push({
      category: 'warning',
      source: 'audit-tokens',
      type: f.category,
      message: f.suggestion !== undefined ? `${f.message} ${f.suggestion}` : f.message,
      location: `${f.file}:${f.line}`,
    });
  }

  for (const f of report.findings.deprecated) {
    findings.push({
      category: 'warning',
      source: 'audit-tokens',
      type: f.category,
      message: f.suggestion !== undefined ? `${f.message} ${f.suggestion}` : f.message,
      location: `${f.file}:${f.line}`,
    });
  }

  for (const f of report.findings.tierViolations) {
    findings.push({
      category: 'warning',
      source: 'audit-tokens',
      type: f.category,
      message: f.suggestion !== undefined ? `${f.message} ${f.suggestion}` : f.message,
      location: `${f.file}:${f.line}`,
    });
  }

  return findings;
}

function collectExtensionFindings(extensionFile: string): HealthFinding[] {
  const json = analyzeExtension(extensionFile);
  const result = JSON.parse(json) as AnalysisResult;
  return result.issues.map((issue) => ({
    category:
      issue.severity === 'error' ? 'critical' : issue.severity === 'warning' ? 'warning' : 'info',
    source: 'analyze-extension' as const,
    type: issue.type,
    message: issue.message,
    location: issue.location,
  }));
}

// ─── Recommendations ──────────────────────────────────────────────────────────

function buildRecommendations(findings: HealthReport['findings']): string[] {
  const recs: string[] = [];
  const all = [...findings.critical, ...findings.warning, ...findings.info];

  // Count by type for prioritization
  const typeCounts = new Map<string, number>();
  for (const f of all) {
    typeCounts.set(f.type, (typeCounts.get(f.type) ?? 0) + 1);
  }

  // Sort by occurrence count descending
  const sorted = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);

  // Generate recommendation per type
  const typeRec: Record<string, string> = {
    'barrel-import': 'Replace @helixui/library barrel imports with path imports for tree-shaking.',
    'import-ts-extension': 'Use .js extensions in import specifiers for ESM compatibility.',
    'bundler-ce-handling': 'Configure your bundler to handle custom elements properly.',
    'ssr-dom-api-unguarded':
      'Guard DOM API access with typeof window !== "undefined" checks for SSR compatibility.',
    'csp-inline-style': 'Replace inline style injection with CSS custom properties.',
    'csp-unsafe-eval': 'Remove eval() and new Function() usage — blocked by CSP.',
    'csp-inner-html': 'Replace innerHTML assignments with safe DOM APIs or Lit templates.',
    'framework-react-wrapper':
      'Install @lit/react and create wrapper components for hx-* elements in React.',
    'framework-react-events':
      'Use addEventListener in useEffect or @lit/react wrappers for custom events.',
    'framework-vue-custom-element':
      'Add isCustomElement config to vite.config to prevent Vue template warnings.',
    'framework-angular-schema':
      'Add CUSTOM_ELEMENTS_SCHEMA to your NgModule to allow hx-* elements.',
    'framework-drupal-once': 'Wrap Drupal behavior initialization with once() to prevent re-init.',
    'framework-drupal-context':
      'Scope DOM queries to context instead of document in Drupal behaviors.',
    'bundler-config-missing': 'Add a bundler config to handle ES modules and custom elements.',
    unknown: 'Verify unknown --hx-* tokens against the HELiX token schema.',
    deprecated: 'Replace deprecated tokens with their current equivalents.',
    'tier-violation': 'Override component-tier tokens on scoped selectors, not :root.',
    'missing-super-call': 'Add super.methodName() calls to all lifecycle method overrides.',
    'incorrect-shadow-dom-usage':
      'Use render() and <slot> for content projection instead of innerHTML.',
    'direct-style-manipulation':
      'Use CSS custom properties (--hx-*) instead of direct style mutation.',
    'property-shadowing': 'Verify @property overrides on parent classes are intentional.',
    'broken-slot-forwarding': 'Ensure overridden render() includes <slot> for content projection.',
  };

  for (const [type] of sorted) {
    const rec = typeRec[type];
    if (rec !== undefined && !recs.includes(rec)) {
      recs.push(rec);
    }
  }

  return recs;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export function healthCheck(options: HealthCheckOptions): HealthReport {
  const { projectPath, extensionFile } = options;

  const allFindings: HealthFinding[] = [];

  allFindings.push(...collectValidationFindings(projectPath));
  allFindings.push(...collectTokenFindings(projectPath));
  if (extensionFile !== undefined) {
    allFindings.push(...collectExtensionFindings(extensionFile));
  }

  const findings: HealthReport['findings'] = {
    critical: allFindings.filter((f) => f.category === 'critical'),
    warning: allFindings.filter((f) => f.category === 'warning'),
    info: allFindings.filter((f) => f.category === 'info'),
  };

  const score = computeScore(findings);
  const recommendations = buildRecommendations(findings);

  const total = allFindings.length;
  const summary =
    total === 0
      ? `Health check passed with a perfect score of 100/100. No issues found.`
      : `Score: ${score}/100. Found ${total} issue${total === 1 ? '' : 's'}: ` +
        [
          findings.critical.length > 0 ? `${findings.critical.length} critical` : '',
          findings.warning.length > 0
            ? `${findings.warning.length} warning${findings.warning.length === 1 ? '' : 's'}`
            : '',
          findings.info.length > 0 ? `${findings.info.length} info` : '',
        ]
          .filter(Boolean)
          .join(', ') +
        '.';

  return { projectPath, score, findings, recommendations, summary };
}

// ─── Formatting (for MCP tool output) ────────────────────────────────────────

export function formatHealthReport(report: HealthReport): string {
  const lines: string[] = [
    `HELiX Health Check`,
    `  Project: ${report.projectPath}`,
    `  Score:   ${report.score}/100`,
    '',
    report.summary,
  ];

  if (report.findings.critical.length > 0) {
    lines.push('');
    lines.push(`Critical (${report.findings.critical.length}):`);
    for (const f of report.findings.critical) {
      lines.push(`  [CRITICAL] ${f.type} — ${f.source}`);
      lines.push(`    ${f.message}`);
      if (f.location !== undefined) lines.push(`    Location: ${f.location}`);
    }
  }

  if (report.findings.warning.length > 0) {
    lines.push('');
    lines.push(`Warnings (${report.findings.warning.length}):`);
    for (const f of report.findings.warning) {
      lines.push(`  [WARNING] ${f.type} — ${f.source}`);
      lines.push(`    ${f.message}`);
      if (f.location !== undefined) lines.push(`    Location: ${f.location}`);
    }
  }

  if (report.findings.info.length > 0) {
    lines.push('');
    lines.push(`Info (${report.findings.info.length}):`);
    for (const f of report.findings.info) {
      lines.push(`  [INFO] ${f.type} — ${f.source}`);
      lines.push(`    ${f.message}`);
      if (f.location !== undefined) lines.push(`    Location: ${f.location}`);
    }
  }

  if (report.recommendations.length > 0) {
    lines.push('');
    lines.push(`Recommendations (${report.recommendations.length}):`);
    for (let i = 0; i < report.recommendations.length; i++) {
      lines.push(`  ${i + 1}. ${report.recommendations[i]}`);
    }
  }

  return lines.join('\n');
}
