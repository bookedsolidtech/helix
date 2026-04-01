/**
 * Unit tests for tools/migrate-version.ts
 *
 * migrateVersion() reads the bundled breaking-changes manifest and scans a
 * consumer project for affected files. We create minimal temp project
 * directories containing source files that do or do not reference breaking
 * change patterns.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrateVersion, formatMigrationPlan } from '../../tools/migrate-version.js';
import type { MigrationPlan } from '../../tools/migrate-version.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = join(
    tmpdir(),
    `migrate-ver-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

function writeFile(dir: string, relativePath: string, content: string): void {
  const parts = relativePath.split('/');
  if (parts.length > 1) {
    mkdirSync(join(dir, ...parts.slice(0, -1)), { recursive: true });
  }
  writeFileSync(join(dir, relativePath), content, 'utf8');
}

afterEach(() => {
  for (const d of tempDirs.splice(0)) {
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('migrateVersion()', () => {
  // ── input validation ────────────────────────────────────────────────────────

  it('throws when project root does not exist', () => {
    expect(() =>
      migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: '/nonexistent' }),
    ).toThrow('not found');
  });

  it('throws when project root is a file, not a directory', () => {
    const dir = makeTempDir();
    writeFile(dir, 'file.ts', '// file');
    expect(() =>
      migrateVersion({
        fromVersion: '0.1.0',
        toVersion: '0.2.0',
        projectRoot: join(dir, 'file.ts'),
      }),
    ).toThrow('not a directory');
  });

  it('throws for invalid fromVersion format', () => {
    const dir = makeTempDir();
    expect(() =>
      migrateVersion({ fromVersion: 'not-semver', toVersion: '0.2.0', projectRoot: dir }),
    ).toThrow();
  });

  it('throws for invalid toVersion format', () => {
    const dir = makeTempDir();
    expect(() =>
      migrateVersion({ fromVersion: '0.1.0', toVersion: 'not-semver', projectRoot: dir }),
    ).toThrow();
  });

  it('throws when toVersion is not greater than fromVersion', () => {
    const dir = makeTempDir();
    expect(() =>
      migrateVersion({ fromVersion: '0.2.0', toVersion: '0.1.0', projectRoot: dir }),
    ).toThrow('greater than');
  });

  it('throws when fromVersion equals toVersion', () => {
    const dir = makeTempDir();
    expect(() =>
      migrateVersion({ fromVersion: '0.2.0', toVersion: '0.2.0', projectRoot: dir }),
    ).toThrow();
  });

  // ── no breaking changes in range ────────────────────────────────────────────

  it('returns empty steps when no breaking changes exist in the version range', () => {
    const dir = makeTempDir();
    // Use a range with no changes defined (beyond v0.3.0)
    const plan = migrateVersion({ fromVersion: '5.0.0', toVersion: '6.0.0', projectRoot: dir });
    expect(plan.steps).toHaveLength(0);
    expect(plan.applicableChanges).toBe(0);
    expect(plan.summary).toContain('No breaking changes');
  });

  it('returns correct fromVersion and toVersion in the plan', () => {
    const dir = makeTempDir();
    const plan = migrateVersion({ fromVersion: '5.0.0', toVersion: '6.0.0', projectRoot: dir });
    expect(plan.fromVersion).toBe('5.0.0');
    expect(plan.toVersion).toBe('6.0.0');
  });

  // ── v0.1.0 → v0.2.0 migration range ────────────────────────────────────────

  it('finds applicable changes in the 0.1.0 → 0.2.0 range', () => {
    const dir = makeTempDir();
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    // The manifest has multiple v0.2.0 changes
    expect(plan.applicableChanges).toBeGreaterThan(0);
  });

  it('detects old event name "hx-button-click" in TypeScript files', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'src/app.ts',
      `button.addEventListener('hx-button-click', handler);`,
    );
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const eventStep = plan.steps.find((s) => s.changeId === 'v0.2.0-button-event-renamed');
    expect(eventStep).toBeDefined();
    expect(eventStep?.totalOccurrences).toBeGreaterThan(0);
  });

  it('detects old token "--hx-color-accent" in CSS files', () => {
    const dir = makeTempDir();
    writeFile(dir, 'styles/theme.css', `:root { --hx-color-accent: #2563eb; }`);
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const tokenStep = plan.steps.find((s) => s.changeId === 'v0.2.0-token-color-accent-renamed');
    expect(tokenStep).toBeDefined();
    expect(tokenStep?.totalOccurrences).toBeGreaterThan(0);
  });

  it('detects old "helper-text=" attribute in HTML files', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'templates/form.html',
      `<hx-text-input helper-text="Enter your name"></hx-text-input>`,
    );
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const propStep = plan.steps.find(
      (s) => s.changeId === 'v0.2.0-text-input-helper-text-renamed',
    );
    expect(propStep).toBeDefined();
    expect(propStep?.totalOccurrences).toBeGreaterThan(0);
  });

  it('detects old import path "@helixui/library/src/components"', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'src/app.ts',
      `import '@helixui/library/src/components/hx-button/index.js';`,
    );
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const importStep = plan.steps.find((s) => s.changeId === 'v0.2.0-import-path-updated');
    expect(importStep).toBeDefined();
    expect(importStep?.totalOccurrences).toBeGreaterThan(0);
  });

  it('step includes before/after code examples', () => {
    const dir = makeTempDir();
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    if (plan.steps.length > 0) {
      const step = plan.steps[0];
      expect(typeof step?.before).toBe('string');
      expect(typeof step?.after).toBe('string');
    }
  });

  it('step includes replacePattern for automated migration', () => {
    const dir = makeTempDir();
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const tokenStep = plan.steps.find((s) => s.changeId === 'v0.2.0-token-color-accent-renamed');
    if (tokenStep) {
      expect(tokenStep.replacePattern).toBe('--hx-color-primary-500');
    }
  });

  it('steps are sorted by total occurrences descending', () => {
    const dir = makeTempDir();
    // Add many occurrences of old event name, fewer of old token name
    writeFile(
      dir,
      'src/app.ts',
      [
        `button.addEventListener('hx-button-click', h1);`,
        `button.addEventListener('hx-button-click', h2);`,
        `button.addEventListener('hx-button-click', h3);`,
      ].join('\n'),
    );
    writeFile(dir, 'styles/theme.css', `:root { --hx-color-accent: #aaa; }`);
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    // Verify descending order
    for (let i = 1; i < plan.steps.length; i++) {
      expect(plan.steps[i - 1]!.totalOccurrences).toBeGreaterThanOrEqual(
        plan.steps[i]!.totalOccurrences,
      );
    }
  });

  // ── v0.2.0 → v0.3.0 range ──────────────────────────────────────────────────

  it('finds the hx-size → size attribute rename in the 0.2.0 → 0.3.0 range', () => {
    const dir = makeTempDir();
    writeFile(dir, 'templates/button.html', `<hx-button hx-size="lg">Submit</hx-button>`);
    const plan = migrateVersion({ fromVersion: '0.2.0', toVersion: '0.3.0', projectRoot: dir });
    const sizeStep = plan.steps.find((s) => s.changeId === 'v0.3.0-button-size-attr-renamed');
    expect(sizeStep).toBeDefined();
    expect(sizeStep?.totalOccurrences).toBeGreaterThan(0);
  });

  it('does NOT include v0.2.0 changes in a 0.2.0 → 0.3.0 range', () => {
    const dir = makeTempDir();
    const plan = migrateVersion({ fromVersion: '0.2.0', toVersion: '0.3.0', projectRoot: dir });
    const v020Step = plan.steps.find((s) => s.changeId === 'v0.2.0-button-event-renamed');
    // If it has 0 occurrences it may still appear in steps but no files affected
    expect(v020Step?.totalOccurrences ?? 0).toBe(0);
  });

  // ── affected file details ────────────────────────────────────────────────────

  it('affected files include relative path from projectRoot', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'src/feature/app.ts',
      `button.addEventListener('hx-button-click', handler);`,
    );
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const eventStep = plan.steps.find((s) => s.changeId === 'v0.2.0-button-event-renamed');
    if (eventStep && eventStep.affectedFiles.length > 0) {
      const filePath = eventStep.affectedFiles[0]?.path ?? '';
      // Should be relative, not absolute
      expect(filePath).not.toMatch(/^\/[A-Za-z]/);
      expect(filePath).toContain('app.ts');
    }
  });

  it('affected files include line numbers', () => {
    const dir = makeTempDir();
    writeFile(
      dir,
      'src/app.ts',
      `// line 1\nbutton.addEventListener('hx-button-click', handler);\n// line 3`,
    );
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const eventStep = plan.steps.find((s) => s.changeId === 'v0.2.0-button-event-renamed');
    if (eventStep && eventStep.affectedFiles.length > 0) {
      const lines = eventStep.affectedFiles[0]?.lines ?? [];
      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]).toBe(2); // event is on line 2
    }
  });

  // ── plan shape ───────────────────────────────────────────────────────────────

  it('plan contains projectRoot, applicableChanges, filesScanned, steps, and summary', () => {
    const dir = makeTempDir();
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    expect(typeof plan.fromVersion).toBe('string');
    expect(typeof plan.toVersion).toBe('string');
    expect(typeof plan.projectRoot).toBe('string');
    expect(typeof plan.applicableChanges).toBe('number');
    expect(typeof plan.filesScanned).toBe('number');
    expect(Array.isArray(plan.steps)).toBe(true);
    expect(typeof plan.summary).toBe('string');
  });

  // ── skips ignored directories ────────────────────────────────────────────────

  it('does not scan node_modules or dist directories', () => {
    const dir = makeTempDir();
    mkdirSync(join(dir, 'node_modules'), { recursive: true });
    writeFileSync(
      join(dir, 'node_modules', 'app.ts'),
      `button.addEventListener('hx-button-click', h);`,
      'utf8',
    );
    const plan = migrateVersion({ fromVersion: '0.1.0', toVersion: '0.2.0', projectRoot: dir });
    const eventStep = plan.steps.find((s) => s.changeId === 'v0.2.0-button-event-renamed');
    expect(eventStep?.totalOccurrences ?? 0).toBe(0);
  });
});

// ─── formatMigrationPlan ──────────────────────────────────────────────────────

describe('formatMigrationPlan()', () => {
  const EMPTY_PLAN: MigrationPlan = {
    fromVersion: '0.1.0',
    toVersion: '0.2.0',
    projectRoot: '/tmp/project',
    applicableChanges: 0,
    filesScanned: 0,
    steps: [],
    summary: 'No breaking changes found.',
  };

  it('returns a non-empty string', () => {
    expect(formatMigrationPlan(EMPTY_PLAN).length).toBeGreaterThan(0);
  });

  it('includes version range header', () => {
    const text = formatMigrationPlan(EMPTY_PLAN);
    expect(text).toContain('0.1.0');
    expect(text).toContain('0.2.0');
  });

  it('includes project path', () => {
    const text = formatMigrationPlan(EMPTY_PLAN);
    expect(text).toContain('/tmp/project');
  });

  it('includes summary', () => {
    const text = formatMigrationPlan(EMPTY_PLAN);
    expect(text).toContain('No breaking changes found.');
  });

  it('includes "Action Required" section when steps have hits', () => {
    const plan: MigrationPlan = {
      ...EMPTY_PLAN,
      applicableChanges: 1,
      filesScanned: 1,
      summary: '1 change affects 1 file.',
      steps: [
        {
          changeId: 'v0.2.0-button-event-renamed',
          version: '0.2.0',
          type: 'renamed-event',
          component: 'hx-button',
          description: "Renamed 'hx-button-click' to 'hx-click'.",
          before: "addEventListener('hx-button-click', h)",
          after: "addEventListener('hx-click', h)",
          replacePattern: "'hx-click'",
          affectedFiles: [{ path: 'src/app.ts', occurrences: 1, lines: [5] }],
          totalOccurrences: 1,
        },
      ],
    };
    const text = formatMigrationPlan(plan);
    expect(text).toContain('Action Required');
    expect(text).toContain('hx-button-click');
  });

  it('includes "No Action Needed" section for steps with zero occurrences', () => {
    const plan: MigrationPlan = {
      ...EMPTY_PLAN,
      applicableChanges: 1,
      filesScanned: 5,
      summary: 'No changes found.',
      steps: [
        {
          changeId: 'v0.2.0-button-event-renamed',
          version: '0.2.0',
          type: 'renamed-event',
          component: 'hx-button',
          description: 'Renamed event.',
          before: 'before',
          after: 'after',
          replacePattern: undefined,
          affectedFiles: [],
          totalOccurrences: 0,
        },
      ],
    };
    const text = formatMigrationPlan(plan);
    expect(text).toContain('No Action Needed');
  });

  it('shows replacePattern when provided', () => {
    const plan: MigrationPlan = {
      ...EMPTY_PLAN,
      steps: [
        {
          changeId: 'v0.2.0-token-color-accent-renamed',
          version: '0.2.0',
          type: 'renamed-token',
          component: undefined,
          description: 'Renamed token.',
          before: '--hx-color-accent: ...',
          after: '--hx-color-primary-500: ...',
          replacePattern: '--hx-color-primary-500',
          affectedFiles: [{ path: 'styles.css', occurrences: 1, lines: [3] }],
          totalOccurrences: 1,
        },
      ],
    };
    const text = formatMigrationPlan(plan);
    expect(text).toContain('--hx-color-primary-500');
  });
});
