import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('dependency-audit (H21)', () => {
  // Find project root
  const cwd = process.cwd();
  const PROJECT_ROOT =
    cwd.endsWith('scripts/hooks') || cwd.endsWith('scripts\\hooks') ? join(cwd, '../..') : cwd;
  const TMP_DIR = join(PROJECT_ROOT, '.tmp-dependency-audit-test');
  const hookScript = join(PROJECT_ROOT, 'scripts/hooks/dependency-audit.ts');

  beforeEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
    mkdirSync(TMP_DIR, { recursive: true });
    execSync('git init', { cwd: TMP_DIR });
    execSync('git config user.email "test@example.com"', { cwd: TMP_DIR });
    execSync('git config user.name "Test User"', { cwd: TMP_DIR });
  });

  afterEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  // ─── Basic Functionality ────────────────────────────────────────────────

  it('should pass when no package.json is staged', () => {
    const componentPath = join(TMP_DIR, 'src/components/button.ts');
    mkdirSync(join(TMP_DIR, 'src/components'), { recursive: true });
    writeFileSync(componentPath, 'export class Button {}');
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('No staged package.json files to check');
  });

  it('should pass with valid package.json', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const validPackageJson = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        lit: '^3.0.0',
      },
    };

    writeFileSync(packagePath, JSON.stringify(validPackageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  // ─── Version Range Validation ───────────────────────────────────────────

  it('should detect overly broad version ranges (*)', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'some-package': '*',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Overly broad version range');
    expect(result).toContain('some-package');
    expect(result).toContain('*');
  });

  it('should detect overly broad version ranges (^*)', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      devDependencies: {
        'another-package': '^*',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Overly broad version range');
    expect(result).toContain('another-package');
  });

  it('should allow approved broad version ranges (blanket approval)', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      description: '@dependency-approved TICKET-100 Legacy compatibility requires wildcard',
      dependencies: {
        'legacy-package': '*',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should allow dependency-specific approvals', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      description: '@dependency-approved:legacy-package TICKET-100 Legacy compatibility',
      dependencies: {
        'legacy-package': '*',
        'another-package': '*', // This should still be flagged
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    // legacy-package should be approved, another-package should be flagged
    expect(result).not.toContain('legacy-package');
    expect(result).toContain('another-package');
  });

  // ─── Duplicate Detection ────────────────────────────────────────────────

  it('should detect duplicate dependencies across workspace packages', () => {
    // Create workspace structure
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
          dependencies: {
            lit: '^3.0.0',
          },
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/lib2',
          version: '1.0.0',
          dependencies: {
            lit: '^3.1.0', // Different version
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Duplicate dependency');
    expect(result).toContain('lit');
    expect(result).toContain('^3.0.0');
    expect(result).toContain('^3.1.0');
  });

  it('should not flag same versions as duplicates', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
          dependencies: {
            lit: '^3.0.0',
          },
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/lib2',
          version: '1.0.0',
          dependencies: {
            lit: '^3.0.0', // Same version
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should skip workspace protocol dependencies in duplicate check', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'apps/app1/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'apps/app1'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*', 'apps/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/app1',
          version: '1.0.0',
          dependencies: {
            '@test/lib1': 'workspace:*',
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  // ─── Peer Dependencies ──────────────────────────────────────────────────

  it('should detect missing peer dependencies', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      peerDependencies: {
        react: '^18.0.0',
      },
      dependencies: {},
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Peer dependency');
    expect(result).toContain('react');
    expect(result).toContain('not listed in dependencies');
  });

  it('should pass when peer dependencies are satisfied in dependencies', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      peerDependencies: {
        react: '^18.0.0',
      },
      dependencies: {
        react: '^18.2.0',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should pass when peer dependencies are satisfied in devDependencies', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      peerDependencies: {
        typescript: '^5.0.0',
      },
      devDependencies: {
        typescript: '^5.7.2',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  // ─── Workspace Protocol ─────────────────────────────────────────────────

  it('should detect workspace packages not using workspace protocol', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/lib2',
          version: '1.0.0',
          dependencies: {
            '@test/lib1': '^1.0.0', // Should use workspace:*
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Workspace package');
    expect(result).toContain('@test/lib1');
    expect(result).toContain('workspace:*');
  });

  it('should pass when workspace packages use workspace protocol', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/lib2',
          version: '1.0.0',
          dependencies: {
            '@test/lib1': 'workspace:*',
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  // ─── Invalid JSON ───────────────────────────────────────────────────────

  it('should detect invalid JSON in package.json', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    writeFileSync(packagePath, '{ invalid json }');
    execSync('git add -A', { cwd: TMP_DIR });

    expect(() => {
      execSync(`npx tsx ${hookScript}`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).toThrow(); // Critical violation
  });

  // ─── JSON Output Mode ───────────────────────────────────────────────────

  it('should support JSON output mode', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        lit: '^3.0.0',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript} --json`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('passed');
    expect(parsed).toHaveProperty('violations');
    expect(parsed).toHaveProperty('stats');
    expect(parsed.stats).toHaveProperty('filesChecked');
    expect(parsed.stats).toHaveProperty('vulnerabilities');
    expect(parsed.stats).toHaveProperty('duplicates');
  });

  // ─── Approval Mechanism ─────────────────────────────────────────────────

  it('should respect blanket approval comments for version ranges', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      description: '@dependency-approved TICKET-200 Required for legacy compatibility',
      dependencies: {
        'some-package': '*',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should respect dependency-specific approvals for version ranges', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      description: '@dependency-approved:some-package TICKET-200 Required for legacy compatibility',
      dependencies: {
        'some-package': '*',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should respect blanket approval for workspace protocol', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );

    const pkg2Json = {
      name: '@test/lib2',
      version: '1.0.0',
      description: '@dependency-approved TICKET-300 Publishing to npm requires semver',
      dependencies: {
        '@test/lib1': '^1.0.0',
      },
    };

    writeFileSync(pkg2, JSON.stringify(pkg2Json, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should respect dependency-specific approval for workspace protocol', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );

    const pkg2Json = {
      name: '@test/lib2',
      version: '1.0.0',
      description: '@dependency-approved:@test/lib1 TICKET-300 Publishing to npm requires semver',
      dependencies: {
        '@test/lib1': '^1.0.0',
      },
    };

    writeFileSync(pkg2, JSON.stringify(pkg2Json, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  // ─── Multiple Violations ────────────────────────────────────────────────

  it('should detect multiple types of violations', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'some-package': '*', // Broad range
      },
      peerDependencies: {
        react: '^18.0.0', // Missing peer dep
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Overly broad version range');
    expect(result).toContain('Peer dependency');
  });

  // ─── Bail-Fast Mode ─────────────────────────────────────────────────────

  it('should support bail-fast mode', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    writeFileSync(packagePath, '{ invalid }');
    execSync('git add -A', { cwd: TMP_DIR });

    expect(() => {
      execSync(`npx tsx ${hookScript} --bail-fast`, {
        cwd: TMP_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).toThrow(); // Critical violation causes exit
  });

  // ─── Edge Cases ─────────────────────────────────────────────────────────

  it('should handle package.json with no dependencies', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should handle monorepo with apps and packages', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib/package.json');
    const app1 = join(TMP_DIR, 'apps/web/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'apps/web'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'monorepo-root',
          private: true,
          workspaces: ['packages/*', 'apps/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib',
          version: '1.0.0',
          dependencies: {
            lit: '^3.0.0',
          },
        },
        null,
        2,
      ),
    );

    writeFileSync(
      app1,
      JSON.stringify(
        {
          name: '@test/web',
          version: '1.0.0',
          dependencies: {
            '@test/lib': 'workspace:*',
            lit: '^3.0.0',
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('All dependencies are secure and properly configured');
  });

  it('should ignore node_modules and dist directories', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const nodeModulesPkg = join(TMP_DIR, 'node_modules/some-lib/package.json');
    const distPkg = join(TMP_DIR, 'dist/package.json');

    mkdirSync(join(TMP_DIR, 'node_modules/some-lib'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'dist'), { recursive: true });

    writeFileSync(
      packagePath,
      JSON.stringify(
        {
          name: 'test-package',
          version: '1.0.0',
        },
        null,
        2,
      ),
    );

    // These should be ignored even with violations
    writeFileSync(nodeModulesPkg, '{ invalid }');
    writeFileSync(distPkg, '{ invalid }');

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    // Should only check root package.json
    expect(result).toContain('All dependencies are secure and properly configured');
  });

  // ─── Stats Reporting ────────────────────────────────────────────────────

  it('should report correct stats', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'test-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
          dependencies: {
            lit: '^3.0.0',
            'some-pkg': '*', // Broad range
          },
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/lib2',
          version: '1.0.0',
          dependencies: {
            lit: '^3.1.0', // Duplicate
          },
          peerDependencies: {
            react: '^18.0.0', // Missing peer
          },
        },
        null,
        2,
      ),
    );

    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('Files checked:');
    expect(result).toContain('Duplicate dependencies:');
    expect(result).toContain('Broad version ranges:');
    expect(result).toContain('Peer dependency issues:');
  });

  // ─── Severity Threshold ─────────────────────────────────────────────────

  it('should support --severity-threshold flag', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        lit: '^3.0.0',
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    // Should accept the flag without error
    const result = execSync(`npx tsx ${hookScript} --severity-threshold=moderate`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toBeTruthy();
  });

  // ─── Caching ────────────────────────────────────────────────────────────

  it('should only check duplicates for staged files', () => {
    const rootPkg = join(TMP_DIR, 'package.json');
    const pkg1 = join(TMP_DIR, 'packages/lib1/package.json');
    const pkg2 = join(TMP_DIR, 'packages/lib2/package.json');

    mkdirSync(join(TMP_DIR, 'packages/lib1'), { recursive: true });
    mkdirSync(join(TMP_DIR, 'packages/lib2'), { recursive: true });

    writeFileSync(
      rootPkg,
      JSON.stringify(
        {
          name: 'workspace-root',
          private: true,
          workspaces: ['packages/*'],
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg1,
      JSON.stringify(
        {
          name: '@test/lib1',
          version: '1.0.0',
          dependencies: {
            lit: '^3.0.0',
          },
        },
        null,
        2,
      ),
    );

    writeFileSync(
      pkg2,
      JSON.stringify(
        {
          name: '@test/lib2',
          version: '1.0.0',
          dependencies: {
            lit: '^3.1.0', // Different version
          },
        },
        null,
        2,
      ),
    );

    // Only stage pkg1
    execSync('git add packages/lib1/package.json', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    // Should still detect duplicate because we check all workspace packages
    // but only if at least one is staged
    expect(result).toContain('Duplicate dependency');
  });

  it('should not run npm audit if no dependency changes', () => {
    const componentPath = join(TMP_DIR, 'src/components/button.ts');
    mkdirSync(join(TMP_DIR, 'src/components'), { recursive: true });
    writeFileSync(componentPath, 'export class Button {}');
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    expect(result).toContain('No staged package.json files to check');
  });

  // ─── Multiple Approvals ─────────────────────────────────────────────────

  it('should support multiple dependency-specific approvals', () => {
    const packagePath = join(TMP_DIR, 'package.json');
    const packageJson = {
      name: 'test-package',
      version: '1.0.0',
      description:
        '@dependency-approved:pkg1 TICKET-100 Reason1 @dependency-approved:pkg2 TICKET-101 Reason2',
      dependencies: {
        pkg1: '*',
        pkg2: '*',
        pkg3: '*', // Not approved
      },
    };

    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    execSync('git add -A', { cwd: TMP_DIR });

    const result = execSync(`npx tsx ${hookScript}`, {
      cwd: TMP_DIR,
      encoding: 'utf-8',
    });

    // pkg1 and pkg2 should be approved, pkg3 should be flagged
    expect(result).not.toContain('pkg1');
    expect(result).not.toContain('pkg2');
    expect(result).toContain('pkg3');
  });
});
