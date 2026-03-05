/**
 * Tests for vrt-critical-paths hook (H14)
 *
 * Coverage:
 * - Unit tests for all validators (10+ tests)
 * - Integration tests for full workflow (10+ tests)
 * - Edge cases and error handling
 */

import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import {
  extractRenderChanges,
  extractVRTStories,
  findSnapshotFiles,
  isSnapshotFresh,
  getSnapshotAge,
  hasApprovalComment,
  extractComponentName,
  validateVRTCoverage,
  validateVRTCriticalPaths,
  type HookDependencies,
  type Violation,
} from './vrt-critical-paths.js';

// ─── Test Fixtures ────────────────────────────────────────────────────────

const FIXTURE_COMPONENT_WITH_RENDER = `
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('hx-button')
export class HxButton extends LitElement {
  @property({ type: String })
  variant: 'primary' | 'secondary' = 'primary';

  static styles = css\`
    :host {
      display: inline-block;
    }
  \`;

  render() {
    return html\`
      <button part="button">\${this.variant}</button>
    \`;
  }
}
`;

const FIXTURE_COMPONENT_NO_RENDER = `
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('hx-card')
export class HxCard extends LitElement {
  // No render method
}
`;

const FIXTURE_COMPONENT_WITH_APPROVAL = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

// @vrt-approved: TICKET-123 Render changes approved without VRT
@customElement('hx-alert')
export class HxAlert extends LitElement {
  render() {
    return html\`<div>Alert</div>\`;
  }
}
`;

const FIXTURE_STORY_WITH_VRT = `
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-button.js';

const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs', 'vrt'],
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {
    label: 'Click me',
  },
};
`;

const FIXTURE_STORY_WITHOUT_VRT = `
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './hx-card.js';

const meta = {
  title: 'Components/Card',
  component: 'hx-card',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
`;

// ─── Mock Dependencies ────────────────────────────────────────────────────

function createMockDeps(overrides: Partial<HookDependencies> = {}): HookDependencies {
  return {
    getStagedFiles: () => [],
    readFile: (_path: string) => '',
    fileExists: (_path: string) => false,
    getFileTimestamp: (_path: string) => 0,
    createProject: (_configPath: string) =>
      new Project({
        useInMemoryFileSystem: true,
        skipAddingFilesFromTsConfig: true,
      }),
    ...overrides,
  };
}

// ─── Unit Tests ───────────────────────────────────────────────────────────

describe('vrt-critical-paths (H14) - Unit Tests', () => {
  describe('extractComponentName', () => {
    it('should extract component name from standard path', () => {
      const path = 'packages/hx-library/src/components/hx-button/hx-button.ts';
      const result = extractComponentName(path);
      expect(result).toBe('hx-button');
    });

    it('should extract component name from nested path', () => {
      const path = 'packages/hx-library/src/components/hx-radio-group/hx-radio-group.ts';
      const result = extractComponentName(path);
      expect(result).toBe('hx-radio-group');
    });

    it('should return empty string for non-component file', () => {
      const path = 'packages/hx-library/src/index.ts';
      const result = extractComponentName(path);
      expect(result).toBe('');
    });

    it('should return empty string for story file', () => {
      const path = 'packages/hx-library/src/components/hx-button/hx-button.stories.ts';
      const result = extractComponentName(path);
      expect(result).toBe('');
    });
  });

  describe('extractRenderChanges', () => {
    it('should detect render() method', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', FIXTURE_COMPONENT_WITH_RENDER);

      const changes = extractRenderChanges(sourceFile);

      expect(changes.length).toBeGreaterThan(0);
      const renderChange = changes.find((c) => c.type === 'render-method');
      expect(renderChange).toBeDefined();
      expect(renderChange?.methodName).toBe('render');
      expect(renderChange?.line).toBeGreaterThan(0);
    });

    it('should detect static styles property', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', FIXTURE_COMPONENT_WITH_RENDER);

      const changes = extractRenderChanges(sourceFile);

      const styleChange = changes.find((c) => c.type === 'styles-property');
      expect(styleChange).toBeDefined();
      expect(styleChange?.line).toBeGreaterThan(0);
    });

    it('should return empty array for component without render', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', FIXTURE_COMPONENT_NO_RENDER);

      const changes = extractRenderChanges(sourceFile);

      expect(changes).toHaveLength(0);
    });

    it('should detect multiple render changes', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', FIXTURE_COMPONENT_WITH_RENDER);

      const changes = extractRenderChanges(sourceFile);

      expect(changes.length).toBeGreaterThanOrEqual(2); // render + styles
    });
  });

  describe('extractVRTStories', () => {
    it('should detect VRT tag in story meta', () => {
      const stories = extractVRTStories(FIXTURE_STORY_WITH_VRT);

      expect(stories.length).toBeGreaterThan(0);
      expect(stories.some((s) => s.hasVRTTag)).toBe(true);
    });

    it('should return no VRT stories when tag is missing', () => {
      const stories = extractVRTStories(FIXTURE_STORY_WITHOUT_VRT);

      const vrtStories = stories.filter((s) => s.hasVRTTag);
      expect(vrtStories).toHaveLength(0);
    });

    it('should extract story names', () => {
      const stories = extractVRTStories(FIXTURE_STORY_WITH_VRT);

      expect(stories.some((s) => s.name === 'Default')).toBe(true);
    });

    it('should handle empty story file', () => {
      const stories = extractVRTStories('');

      expect(stories).toHaveLength(0);
    });

    it('should handle story file with multiple tags', () => {
      const storyContent = `
        const meta = {
          tags: ['autodocs', 'vrt', 'experimental'],
        } satisfies Meta;
      `;

      const stories = extractVRTStories(storyContent);

      expect(stories.some((s) => s.hasVRTTag)).toBe(true);
    });
  });

  describe('findSnapshotFiles', () => {
    it('should return empty array when snapshot dir does not exist', () => {
      const deps = createMockDeps({
        fileExists: () => false,
      });

      const snapshots = findSnapshotFiles('hx-button', deps);

      expect(snapshots).toHaveLength(0);
    });

    it('should return empty array for unknown component', () => {
      const deps = createMockDeps({
        fileExists: () => true,
      });

      const snapshots = findSnapshotFiles('hx-unknown', deps);

      expect(snapshots).toHaveLength(0);
    });
  });

  describe('isSnapshotFresh', () => {
    it('should return true when snapshot is newer than component', () => {
      const componentTime = 1000;
      const snapshotTime = 2000;

      const deps = createMockDeps({
        getFileTimestamp: (_path) => snapshotTime,
      });

      const result = isSnapshotFresh('snapshot.png', componentTime, deps);

      expect(result).toBe(true);
    });

    it('should return false when snapshot is older than component', () => {
      const componentTime = 2000;
      const snapshotTime = 1000;

      const deps = createMockDeps({
        getFileTimestamp: (_path) => snapshotTime,
      });

      const result = isSnapshotFresh('snapshot.png', componentTime, deps);

      expect(result).toBe(false);
    });

    it('should return false when snapshot timestamp is 0', () => {
      const deps = createMockDeps({
        getFileTimestamp: () => 0,
      });

      const result = isSnapshotFresh('snapshot.png', 1000, deps);

      expect(result).toBe(false);
    });

    it('should return false when snapshot equals component time', () => {
      const time = 1000;

      const deps = createMockDeps({
        getFileTimestamp: () => time,
      });

      const result = isSnapshotFresh('snapshot.png', time, deps);

      expect(result).toBe(false);
    });
  });

  describe('getSnapshotAge', () => {
    it('should return age in hours', () => {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      const deps = createMockDeps({
        getFileTimestamp: () => oneHourAgo,
      });

      const age = getSnapshotAge('snapshot.png', deps);

      expect(age).toBeCloseTo(1, 0);
    });

    it('should return Infinity when timestamp is 0', () => {
      const deps = createMockDeps({
        getFileTimestamp: () => 0,
      });

      const age = getSnapshotAge('snapshot.png', deps);

      expect(age).toBe(Infinity);
    });

    it('should return 0 for current timestamp', () => {
      const now = Date.now();

      const deps = createMockDeps({
        getFileTimestamp: () => now,
      });

      const age = getSnapshotAge('snapshot.png', deps);

      expect(age).toBeCloseTo(0, 1);
    });
  });

  describe('hasApprovalComment', () => {
    it('should detect approval comment on class', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', FIXTURE_COMPONENT_WITH_APPROVAL);

      const classes = sourceFile.getClasses();
      expect(classes.length).toBeGreaterThan(0);

      const result = hasApprovalComment(classes[0]!);

      expect(result).toBe(true);
    });

    it('should return false when no approval comment', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('test.ts', FIXTURE_COMPONENT_WITH_RENDER);

      const classes = sourceFile.getClasses();
      expect(classes.length).toBeGreaterThan(0);

      const result = hasApprovalComment(classes[0]!);

      expect(result).toBe(false);
    });

    it('should not infinite loop on deep parent traversal', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const deeplyNested = `
        // Deeply nested structure
        export default class Level1 {
          static Level2 = class {
            static Level3 = class {
              static Level4 = class {
                static Level5 = class {
                  static render() { return 'test'; }
                }
              }
            }
          }
        }
      `;
      const sourceFile = project.createSourceFile('test.ts', deeplyNested);

      const classes = sourceFile.getClasses();
      expect(classes.length).toBeGreaterThan(0);

      // Should not throw or hang
      const result = hasApprovalComment(classes[0]!);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('extractVRTStories - story-level tags', () => {
    it('should detect story-level VRT tag with no meta VRT', () => {
      const storyWithIndividualTag = `const meta = {
  title: 'Components/Button',
  component: 'hx-button',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

export const Primary: Story = {
  tags: ['vrt'],
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};`;

      const stories = extractVRTStories(storyWithIndividualTag);

      const primaryStory = stories.find((s) => s.name === 'Primary');
      const secondaryStory = stories.find((s) => s.name === 'Secondary');

      expect(primaryStory).toBeDefined();
      expect(secondaryStory).toBeDefined();
      expect(primaryStory?.hasVRTTag).toBe(true);
      // Secondary doesn't have story-level tag and meta doesn't have VRT
      expect(secondaryStory?.hasVRTTag).toBe(false);
    });

    it('should inherit meta-level VRT tag', () => {
      const stories = extractVRTStories(FIXTURE_STORY_WITH_VRT);

      const defaultStory = stories.find((s) => s.name === 'Default');
      expect(defaultStory?.hasVRTTag).toBe(true);
    });
  });
});

// ─── Integration Tests ────────────────────────────────────────────────────

describe('vrt-critical-paths (H14) - Integration Tests', () => {
  describe('validateVRTCoverage', () => {
    it('should report critical violation when story file is missing', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        FIXTURE_COMPONENT_WITH_RENDER,
      );

      const violations: Violation[] = [];
      const deps = createMockDeps({
        fileExists: () => false,
      });

      validateVRTCoverage(
        sourceFile,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        violations,
        deps,
      );

      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0]?.severity).toBe('critical');
      expect(violations[0]?.category).toBe('missing-story');
    });

    it('should report warning when VRT tag is missing', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        FIXTURE_COMPONENT_WITH_RENDER,
      );

      const violations: Violation[] = [];
      const deps = createMockDeps({
        fileExists: () => true,
        readFile: () => FIXTURE_STORY_WITHOUT_VRT,
      });

      validateVRTCoverage(
        sourceFile,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        violations,
        deps,
      );

      expect(violations.some((v) => v.severity === 'warning')).toBe(true);
      expect(violations.some((v) => v.category === 'missing-vrt')).toBe(true);
    });

    it('should report critical violation when snapshots are missing', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        FIXTURE_COMPONENT_WITH_RENDER,
      );

      const violations: Violation[] = [];
      const deps = createMockDeps({
        fileExists: () => true,
        readFile: () => FIXTURE_STORY_WITH_VRT,
      });

      validateVRTCoverage(
        sourceFile,
        'packages/hx-library/src/components/hx-button/hx-button.ts',
        violations,
        deps,
      );

      expect(violations.some((v) => v.severity === 'critical')).toBe(true);
      expect(violations.some((v) => v.category === 'missing-vrt')).toBe(true);
    });

    it('should skip validation when no render changes', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'packages/hx-library/src/components/hx-card/hx-card.ts',
        FIXTURE_COMPONENT_NO_RENDER,
      );

      const violations: Violation[] = [];
      const deps = createMockDeps();

      validateVRTCoverage(
        sourceFile,
        'packages/hx-library/src/components/hx-card/hx-card.ts',
        violations,
        deps,
      );

      expect(violations).toHaveLength(0);
    });

    it('should skip validation when approval comment is present', () => {
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'packages/hx-library/src/components/hx-alert/hx-alert.ts',
        FIXTURE_COMPONENT_WITH_APPROVAL,
      );

      const violations: Violation[] = [];
      const deps = createMockDeps({
        fileExists: () => false,
      });

      validateVRTCoverage(
        sourceFile,
        'packages/hx-library/src/components/hx-alert/hx-alert.ts',
        violations,
        deps,
      );

      expect(violations).toHaveLength(0);
    });
  });

  describe('validateVRTCriticalPaths', () => {
    it('should pass when no files are staged', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => [],
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should pass when component has no render changes', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-card/hx-card.ts'],
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-card/hx-card.ts',
            FIXTURE_COMPONENT_NO_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.passed).toBe(true);
    });

    it('should fail when component has render changes but no story file', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
        fileExists: () => false,
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-button/hx-button.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.passed).toBe(false);
      expect(result.stats.criticalViolations).toBeGreaterThan(0);
    });

    it('should handle Git errors gracefully', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => {
          throw new Error('Git not found');
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.passed).toBe(false);
      expect(result.violations[0]?.message).toContain('Failed to get staged files');
    });

    it('should handle file read errors gracefully', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          // Simulate error during addSourceFileAtPath by not adding the file
          // This will cause an error when trying to access it
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      // Should handle gracefully - return a valid result shape without throwing
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(typeof result.stats.filesChecked).toBe('number');
      expect(
        result.violations.every(
          (v) => typeof v.message === 'string' && typeof v.severity === 'string',
        ),
      ).toBe(true);
    });

    it('should respect bail-fast mode', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => [
          'packages/hx-library/src/components/hx-button/hx-button.ts',
          'packages/hx-library/src/components/hx-card/hx-card.ts',
        ],
        fileExists: () => false,
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-button/hx-button.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          project.createSourceFile(
            'packages/hx-library/src/components/hx-card/hx-card.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true, true);

      expect(result.stats.filesChecked).toBeLessThan(2);
    });

    it('should track components with render changes', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
        fileExists: () => false,
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-button/hx-button.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.stats.componentsWithRenderChanges).toBe(1);
    });

    it('should respect performance budget', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-button/hx-button.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.stats.executionTimeMs).toBeLessThan(5000); // timeout
    });

    it('should count violations correctly', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
        fileExists: () => false,
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-button/hx-button.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      expect(result.stats.totalViolations).toBe(
        result.stats.criticalViolations + result.stats.warningViolations,
      );
    });

    it('should add performance warning in JSON mode when budget exceeded', async () => {
      const deps = createMockDeps({
        getStagedFiles: () => ['packages/hx-library/src/components/hx-button/hx-button.ts'],
        createProject: () => {
          const project = new Project({ useInMemoryFileSystem: true });
          project.createSourceFile(
            'packages/hx-library/src/components/hx-button/hx-button.ts',
            FIXTURE_COMPONENT_WITH_RENDER,
          );
          return project;
        },
      });

      const result = await validateVRTCriticalPaths(deps, true);

      // If execution time exceeds budget, there should be a performance warning
      if (result.stats.executionTimeMs > 3000) {
        const perfViolation = result.violations.find((v) => v.file === '<performance>');
        expect(perfViolation).toBeDefined();
        expect(perfViolation?.severity).toBe('warning');
      }
    });
  });
});
