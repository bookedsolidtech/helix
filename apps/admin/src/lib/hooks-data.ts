/**
 * Hooks and MCP Server Data
 *
 * Comprehensive catalog of all Claude Code hooks and MCP servers
 * proposed by specialist agents and synthesized by VP Engineering.
 *
 * Source: VP Engineering Synthesis (2026-02-16)
 */

export type Priority = 'P0' | 'P1' | 'P2';
export type Phase = 1 | 2 | 3 | 4;

export type HookStatus = 'implemented' | 'planned' | 'deferred';

export interface Hook {
  id: string;
  name: string;
  owner: string;
  priority: Priority;
  purpose: string;
  workflow: string;
  executionBudget: string;
  phase: Phase;
  dependencies?: string[];
  status: HookStatus;
  implementedName?: string; // Actual name if different from planned
  deferredReason?: string; // Reason if deferred
}

export interface McpServer {
  id: string;
  name: string;
  owner: string;
  function: string;
  dependencies?: string[];
  phase: Phase;
}

export interface PhaseInfo {
  phase: Phase;
  name: string;
  weeks: string;
  focus: string;
  hooks: string[];
  servers: string[];
  effort: string;
}

export interface Metrics {
  totalHours: number;
  speedup: string;
  roi: string;
  specialists: number;
}

/**
 * 24 Unique Hooks (P0/P1/P2)
 *
 * Status indicates actual implementation vs original plan
 */
export const hooks: Hook[] = [
  // Phase 1: Foundation (P0 - Critical)
  {
    id: 'H01',
    name: 'type-check-strict',
    owner: 'TypeScript Specialist',
    priority: 'P0',
    purpose: 'Run TypeScript strict mode checks before every commit',
    workflow: 'Pre-commit hook validates TypeScript strict mode, explicit types, no any usage',
    executionBudget: '<5s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
  },
  {
    id: 'H02',
    name: 'no-hardcoded-values',
    owner: 'Design System Developer',
    priority: 'P0',
    purpose: 'Block hardcoded colors, spacing, and design values in component CSS',
    workflow: 'Pre-commit hook scans for hex colors, hardcoded px values, enforces design tokens',
    executionBudget: '<2s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
    implementedName: 'no-hardcoded-values',
  },
  {
    id: 'H03',
    name: 'test-coverage-gate',
    owner: 'QA Engineer (Automation)',
    priority: 'P0',
    purpose: 'Enforce 80%+ test coverage on component files',
    workflow: 'Pre-commit hook reads Vitest coverage JSON, validates line/branch/function coverage',
    executionBudget: '<3s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
    implementedName: 'test-coverage-gate',
  },
  {
    id: 'H04',
    name: 'bundle-size-guard',
    owner: 'Performance Engineer',
    priority: 'P1',
    purpose: 'Block commits that exceed per-component bundle size budget (<5KB gzip)',
    workflow: 'Pre-commit hook builds changed components, measures gzip size, fails if >5KB',
    executionBudget: '<3s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
  },
  {
    id: 'H05',
    name: 'cem-accuracy-check',
    owner: 'Lit Specialist',
    priority: 'P0',
    purpose: 'Ensure Custom Elements Manifest stays in sync with component APIs',
    workflow: 'Pre-commit hook compares CEM with source code, validates properties/events/slots',
    executionBudget: '<5s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
    implementedName: 'cem-accuracy-check',
  },
  {
    id: 'H06',
    name: 'a11y-regression-guard',
    owner: 'Accessibility Engineer',
    priority: 'P1',
    purpose: 'Prevent accessibility regressions (ARIA, roles, keyboard nav)',
    workflow: 'Pre-commit hook validates ARIA attributes, role usage, alt text, keyboard patterns',
    executionBudget: '<5s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
    implementedName: 'a11y-regression-guard',
  },

  // Phase 2: Core Gates (P0)
  {
    id: 'H07',
    name: 'event-type-safety',
    owner: 'TypeScript Specialist',
    priority: 'P0',
    purpose: 'Enforce CustomEvent<DetailType> with exported interfaces and hx- prefix',
    workflow: 'Pre-commit hook validates event typing, naming, and JSDoc @fires tags',
    executionBudget: '<2s',
    phase: 2,
    dependencies: [],
    status: 'implemented',
    implementedName: 'event-type-safety',
  },
  {
    id: 'H08',
    name: 'jsdoc-coverage',
    owner: 'Storybook Specialist',
    priority: 'P0',
    purpose: 'Enforce 100% JSDoc coverage on public component APIs',
    workflow: 'Pre-commit hook validates @summary, @param, @returns, @fires, @slot tags',
    executionBudget: '<3s',
    phase: 2,
    dependencies: [],
    status: 'implemented',
    implementedName: 'jsdoc-coverage',
  },
  {
    id: 'H09',
    name: 'storybook-validation',
    owner: 'Storybook Specialist',
    priority: 'P0',
    purpose: 'Ensure every component has corresponding Storybook stories',
    workflow: 'Pre-commit script validates `*.stories.ts` exists for each component',
    executionBudget: '<1s',
    phase: 2,
    dependencies: [],
    status: 'implemented',
  },
  {
    id: 'H10',
    name: 'component-test-required',
    owner: 'QA Engineer (Automation)',
    priority: 'P0',
    purpose: 'Prevent commits that add components without corresponding test files',
    workflow: 'Pre-commit script validates that every hx-*.ts has hx-*.test.ts',
    executionBudget: '<1s',
    phase: 1,
    dependencies: [],
    status: 'implemented',
    implementedName: 'component-test-required',
  },

  // Phase 2: Core Gates (P1)
  {
    id: 'H11',
    name: 'commit-msg-convention',
    owner: 'VP Engineering',
    priority: 'P1',
    purpose: 'Enforce conventional commit message format',
    workflow: 'commit-msg hook validates format (feat/fix/docs/etc), blocks if invalid',
    executionBudget: '<0.5s',
    phase: 2,
    dependencies: [],
    status: 'implemented',
  },
  {
    id: 'H12',
    name: 'no-console-logs',
    owner: 'Code Reviewer',
    priority: 'P1',
    purpose: 'Prevent console.log statements in production code',
    workflow: 'Pre-commit hook searches for console.log in staged files, blocks if found',
    executionBudget: '<1s',
    phase: 2,
    dependencies: [],
    status: 'implemented',
  },
  {
    id: 'H13',
    name: 'design-token-enforcement',
    owner: 'Design System Developer',
    priority: 'P0',
    purpose: 'Enforce 3-tier token cascade architecture (Primitive → Semantic → Component)',
    workflow: 'Pre-commit hook validates 274 design tokens from source, recursive fallback chains',
    executionBudget: '<2s',
    phase: 2,
    dependencies: [],
    status: 'implemented',
    implementedName: 'design-token-enforcement',
  },

  // Phase 3: Advanced Checks (P1)
  {
    id: 'H14',
    name: 'vrt-critical-paths',
    owner: 'QA Engineer (Automation)',
    priority: 'P1',
    purpose: 'Require VRT for components with render() changes, validate snapshots',
    workflow: 'Pre-commit hook detects render changes via git diff, validates VRT snapshots exist',
    executionBudget: '<3s',
    phase: 3,
    dependencies: ['H07'],
    status: 'implemented',
    implementedName: 'vrt-critical-paths',
  },
  {
    id: 'H15',
    name: 'drupal-compat-check',
    owner: 'Drupal Integration Specialist',
    priority: 'P1',
    purpose: 'Validate components are Drupal-compatible (no build-time dependencies)',
    workflow: 'Pre-push hook simulates Drupal environment, validates CDN bundle loading',
    executionBudget: '<10s',
    phase: 3,
    dependencies: ['H04'],
    status: 'planned',
  },
  {
    id: 'H16',
    name: 'shadow-dom-leak-detection',
    owner: 'Lit Specialist',
    priority: 'P1',
    purpose: 'Detect CSS leaks from Shadow DOM (global selectors, !important, DOM manipulation)',
    workflow: 'Pre-commit hook validates Shadow DOM encapsulation, 55x faster with caching',
    executionBudget: '<2s',
    phase: 3,
    dependencies: ['H10'],
    status: 'implemented',
    implementedName: 'shadow-dom-leak-detection',
  },
  {
    id: 'H17',
    name: 'typescript-any-ban',
    owner: 'TypeScript Specialist',
    priority: 'P1',
    purpose: 'Block any TypeScript `any` types, enforce explicit typing',
    workflow:
      'Pre-commit hook uses ts-morph AST parsing, checks explicit any, function types, return types',
    executionBudget: '<1s',
    phase: 3,
    dependencies: ['H01'],
    status: 'implemented',
    implementedName: 'typescript-any-ban',
  },
  {
    id: 'H18',
    name: 'api-breaking-change-detection',
    owner: 'Principal Engineer',
    priority: 'P1',
    purpose:
      'Detect breaking changes to public APIs (properties, methods, events, CSS parts, slots)',
    workflow:
      'Pre-commit hook compares CEM with main branch, validates staleness, blocks breaking changes',
    executionBudget: '<5s',
    phase: 3,
    dependencies: ['H05'],
    status: 'implemented',
    implementedName: 'api-breaking-change-detection',
  },
  {
    id: 'H19',
    name: 'lighthouse-performance',
    owner: 'Performance Engineer',
    priority: 'P1',
    purpose:
      'Lighthouse performance audits, Core Web Vitals (LCP/INP/CLS/TBT), bundle size budgets',
    workflow: 'CI hook runs Lighthouse with 180s timeout, 3 retries, measures gzipped bundle sizes',
    executionBudget: '<180s (CI only)',
    phase: 3,
    dependencies: ['H09'],
    status: 'implemented',
    implementedName: 'lighthouse-performance',
  },

  // Phase 3: Advanced Checks (P2)
  {
    id: 'H20',
    name: 'animation-budget-check',
    owner: 'CSS3 Animation Purist',
    priority: 'P2',
    purpose:
      'WCAG 2.1 AA compliance: animation timing, GPU properties, prefers-reduced-motion validation',
    workflow:
      'Pre-commit hook validates 200-500ms timing, 3-tier reduced motion validation, GPU usage',
    executionBudget: '<2s',
    phase: 3,
    dependencies: ['H06'],
    status: 'implemented',
    implementedName: 'animation-budget-check',
  },
  {
    id: 'H21',
    name: 'dependency-audit',
    owner: 'Staff Software Engineer',
    priority: 'P2',
    purpose: 'Security: npm audit for vulnerabilities, duplicate detection, workspace validation',
    workflow: 'Pre-commit hook runs npm audit with 5min cache, validates severity thresholds',
    executionBudget: '<8s',
    phase: 3,
    dependencies: [],
    status: 'implemented',
    implementedName: 'dependency-audit',
  },

  // Phase 4: Polish & Optimization (P2)
  {
    id: 'H22',
    name: 'documentation-completeness',
    owner: 'Technical Writer',
    priority: 'P2',
    purpose: 'JSDoc validation: classes, properties, methods, parameters, return types, accessors',
    workflow: 'Pre-commit hook validates comprehensive JSDoc coverage with ts-morph AST parsing',
    executionBudget: '<3s',
    phase: 4,
    dependencies: ['H05'],
    status: 'implemented',
    implementedName: 'documentation-completeness',
  },
  {
    id: 'H23',
    name: 'semantic-versioning',
    owner: 'DevOps Engineer',
    priority: 'P2',
    purpose: 'Auto-generate changeset files for versioned releases',
    workflow: 'Pre-push hook prompts for changeset if public API changes detected',
    executionBudget: '<2s',
    phase: 4,
    dependencies: ['H18'],
    status: 'planned',
  },
  {
    id: 'H24',
    name: 'dead-code-elimination',
    owner: 'Senior Code Reviewer',
    priority: 'P2',
    purpose: 'Detect unused exports and dead code branches',
    workflow: 'Pre-push hook runs ts-prune and reports unused exports',
    executionBudget: '<10s',
    phase: 4,
    dependencies: ['H01'],
    status: 'planned',
  },
  {
    id: 'H25',
    name: 'css-part-documentation',
    owner: 'Design System Developer',
    priority: 'P2',
    purpose:
      'CSS Parts API documentation: bidirectional validation, naming conventions, unused detection',
    workflow:
      'Pre-commit hook validates CSS parts documented in JSDoc, checks naming, finds unused parts',
    executionBudget: '<3s',
    phase: 4,
    dependencies: ['H05'],
    status: 'implemented',
    implementedName: 'css-part-documentation',
  },
];

/**
 * 15 Unique MCP Servers
 */
export const mcpServers: McpServer[] = [
  // Phase 1: Foundation
  {
    id: 'M01',
    name: 'cem-analyzer',
    owner: 'Lit Specialist',
    function: 'Real-time Custom Elements Manifest analysis and API diff detection',
    dependencies: [],
    phase: 1,
  },
  {
    id: 'M02',
    name: 'typescript-diagnostics',
    owner: 'TypeScript Specialist',
    function: 'Advanced TypeScript error reporting with fix suggestions',
    dependencies: [],
    phase: 1,
  },
  {
    id: 'M03',
    name: 'bundle-analyzer',
    owner: 'Performance Engineer',
    function: 'Real-time bundle size tracking with treemap visualization',
    dependencies: [],
    phase: 1,
  },
  {
    id: 'M04',
    name: 'test-orchestrator',
    owner: 'Test Architect',
    function: 'Smart test selection using file dependency graph',
    dependencies: [],
    phase: 1,
  },

  // Phase 2: Core Gates
  {
    id: 'M05',
    name: 'coverage-tracker',
    owner: 'QA Engineer (Automation)',
    function: 'Per-file coverage tracking with historical trend data',
    dependencies: ['M04'],
    phase: 2,
  },
  {
    id: 'M06',
    name: 'accessibility-scanner',
    owner: 'Accessibility Engineer',
    function: 'Automated WCAG 2.1 AA validation with remediation hints',
    dependencies: [],
    phase: 2,
  },
  {
    id: 'M07',
    name: 'design-token-validator',
    owner: 'Design System Developer',
    function: 'CSS analysis to enforce design token usage, detect hardcoded values',
    dependencies: [],
    phase: 2,
  },
  {
    id: 'M08',
    name: 'storybook-registry',
    owner: 'Storybook Specialist',
    function: 'Index of all stories with variant coverage tracking',
    dependencies: [],
    phase: 2,
  },

  // Phase 3: Advanced Checks
  {
    id: 'M09',
    name: 'vrt-baseline-manager',
    owner: 'QA Engineer (Automation)',
    function: 'Visual regression test baseline storage and diff generation',
    dependencies: ['M04'],
    phase: 3,
  },
  {
    id: 'M10',
    name: 'drupal-simulator',
    owner: 'Drupal Integration Specialist',
    function: 'Simulated Drupal environment for integration testing',
    dependencies: ['M03'],
    phase: 3,
  },
  {
    id: 'M11',
    name: 'shadow-dom-inspector',
    owner: 'Lit Specialist',
    function: 'Shadow DOM boundary validation and CSS leak detection',
    dependencies: ['M07'],
    phase: 3,
  },
  {
    id: 'M12',
    name: 'api-diff-engine',
    owner: 'Principal Engineer',
    function: 'Semantic versioning validation based on API changes',
    dependencies: ['M01'],
    phase: 3,
  },

  // Phase 4: Polish & Optimization
  {
    id: 'M13',
    name: 'doc-completeness-checker',
    owner: 'Technical Writer',
    function: 'JSDoc and CEM documentation coverage analysis',
    dependencies: ['M01'],
    phase: 4,
  },
  {
    id: 'M14',
    name: 'dependency-graph-analyzer',
    owner: 'Staff Software Engineer',
    function: 'Circular dependency detection and optimization suggestions',
    dependencies: ['M04'],
    phase: 4,
  },
  {
    id: 'M15',
    name: 'health-scorer',
    owner: 'VP Engineering',
    function: 'Aggregate health metrics across all 7 quality gates',
    dependencies: ['M01', 'M02', 'M03', 'M04', 'M05', 'M06'],
    phase: 4,
  },
];

/**
 * 4-Phase Implementation Roadmap (8 weeks)
 */
export const phases: PhaseInfo[] = [
  {
    phase: 1,
    name: 'Foundation',
    weeks: 'Weeks 1-2',
    focus: 'Core quality gates (TypeScript, Lint, CEM, Bundle Size)',
    hooks: ['H01', 'H02', 'H03', 'H04', 'H05', 'H06'],
    servers: ['M01', 'M02', 'M03', 'M04'],
    effort: '80 hours',
  },
  {
    phase: 2,
    name: 'Core Gates',
    weeks: 'Weeks 3-4',
    focus: 'Testing, Coverage, Storybook, Design Tokens',
    hooks: ['H07', 'H08', 'H09', 'H10', 'H11', 'H12'],
    servers: ['M05', 'M06', 'M07', 'M08'],
    effort: '80 hours',
  },
  {
    phase: 3,
    name: 'Advanced Checks',
    weeks: 'Weeks 5-6',
    focus: 'VRT, Drupal, Shadow DOM, API Diff, Performance',
    hooks: ['H13', 'H14', 'H15', 'H16', 'H17', 'H18', 'H19', 'H20'],
    servers: ['M09', 'M10', 'M11', 'M12'],
    effort: '96 hours',
  },
  {
    phase: 4,
    name: 'Polish & Optimization',
    weeks: 'Weeks 7-8',
    focus: 'Documentation, Versioning, Dead Code, Health Scoring',
    hooks: ['H21', 'H22', 'H23', 'H24'],
    servers: ['M13', 'M14', 'M15'],
    effort: '64 hours',
  },
];

/**
 * Success Metrics
 */
export const metrics: Metrics = {
  totalHours: 320,
  speedup: '12x faster pre-commit',
  roi: '269%',
  specialists: 11,
};

/**
 * Risk Mitigation Strategies
 */
export const risks = [
  {
    risk: 'Hook execution time exceeds developer patience threshold (>10s)',
    mitigation: 'Implement parallel execution, Turborepo caching, and incremental checks',
    owner: 'DevOps Engineer',
  },
  {
    risk: 'False positives block valid commits',
    mitigation: 'Escape hatch with SKIP_HOOKS=1 environment variable (logged for audit)',
    owner: 'Principal Engineer',
  },
  {
    risk: 'MCP servers increase memory footprint',
    mitigation: 'Lazy-load servers on-demand, implement resource pooling',
    owner: 'Staff Software Engineer',
  },
  {
    risk: 'Hook maintenance burden grows with team size',
    mitigation: 'Centralize hook logic in shared packages, auto-update via CI',
    owner: 'VP Engineering',
  },
];
