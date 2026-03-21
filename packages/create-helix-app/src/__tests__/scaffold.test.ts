import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import { scaffoldProject } from '../scaffold.js';
import type { ProjectOptions } from '../types.js';

const TEST_DIR = '/tmp/helix-test-scaffold';

function makeOptions(overrides: Partial<ProjectOptions> = {}): ProjectOptions {
  return {
    name: 'test-app',
    directory: path.join(TEST_DIR, overrides.name ?? 'test-app'),
    framework: 'react-next',
    componentBundles: ['all'],
    typescript: true,
    eslint: true,
    designTokens: true,
    darkMode: false,
    installDeps: false,
    ...overrides,
  };
}

beforeEach(async () => {
  await fs.remove(TEST_DIR);
  await fs.ensureDir(TEST_DIR);
});

afterAll(async () => {
  await fs.remove(TEST_DIR);
});

// ─── Core scaffolding behavior ───────────────────────────────────────────────

describe('scaffoldProject — core', () => {
  it('creates the project directory', async () => {
    const opts = makeOptions({ name: 'dir-test' });
    await scaffoldProject(opts);
    expect(await fs.pathExists(opts.directory)).toBe(true);
  });

  it('throws for unknown framework', async () => {
    const opts = makeOptions({
      name: 'bad-framework',
      framework: 'ember' as ProjectOptions['framework'],
    });
    await expect(scaffoldProject(opts)).rejects.toThrow('Unknown framework: ember');
  });

  it('generates package.json with correct name', async () => {
    const opts = makeOptions({ name: 'pkg-name-test' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.name).toBe('pkg-name-test');
  });

  it('generates README.md', async () => {
    const opts = makeOptions({ name: 'readme-test' });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'README.md'))).toBe(true);
  });

  it('generates .gitignore', async () => {
    const opts = makeOptions({ name: 'gitignore-test' });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, '.gitignore'))).toBe(true);
  });

  it('generates helix-setup file in src/', async () => {
    const opts = makeOptions({ name: 'setup-test' });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'src', 'helix-setup.ts'))).toBe(true);
  });

  it('generates .js helix-setup when typescript is false', async () => {
    const opts = makeOptions({ name: 'js-setup-test', typescript: false });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'src', 'helix-setup.js'))).toBe(true);
  });
});

// ─── Optional features (designTokens, eslint, typescript) ────────────────────

describe('scaffoldProject — optional features', () => {
  it('generates helix-tokens.css when designTokens is true', async () => {
    const opts = makeOptions({ name: 'tokens-true' });
    await scaffoldProject(opts);
    const tokensPath = path.join(opts.directory, 'helix-tokens.css');
    expect(await fs.pathExists(tokensPath)).toBe(true);
    const content = await fs.readFile(tokensPath, 'utf-8');
    expect(content).toContain('@import');
    expect(content).toContain('--hx-color-primary');
  });

  it('does NOT generate helix-tokens.css when designTokens is false', async () => {
    const opts = makeOptions({ name: 'tokens-false', designTokens: false });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'helix-tokens.css'))).toBe(false);
  });

  it('includes dark mode section in tokens when darkMode is true', async () => {
    const opts = makeOptions({ name: 'dark-mode', darkMode: true });
    await scaffoldProject(opts);
    const content = await fs.readFile(path.join(opts.directory, 'helix-tokens.css'), 'utf-8');
    expect(content).toContain('prefers-color-scheme: dark');
    expect(content).toContain('data-theme="dark"');
  });

  it('generates eslint.config.js when eslint is true', async () => {
    const opts = makeOptions({ name: 'eslint-true' });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'eslint.config.js'))).toBe(true);
  });

  it('generates .prettierrc when eslint is true', async () => {
    const opts = makeOptions({ name: 'prettier-true' });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, '.prettierrc'))).toBe(true);
  });

  it('does NOT generate eslint.config.js when eslint is false', async () => {
    const opts = makeOptions({ name: 'eslint-false', eslint: false });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'eslint.config.js'))).toBe(false);
  });

  it('generates tsconfig.json for non-next frameworks when typescript is true', async () => {
    const opts = makeOptions({ name: 'ts-vue', framework: 'vue-vite' });
    await scaffoldProject(opts);
    const tsconfigPath = path.join(opts.directory, 'tsconfig.json');
    expect(await fs.pathExists(tsconfigPath)).toBe(true);
    const tsconfig = await fs.readJson(tsconfigPath);
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('does NOT generate tsconfig.json when typescript is false', async () => {
    // Use vanilla which has no framework-specific tsconfig generation
    const opts = makeOptions({
      name: 'no-ts',
      framework: 'vanilla',
      typescript: false,
    });
    await scaffoldProject(opts);
    expect(await fs.pathExists(path.join(opts.directory, 'tsconfig.json'))).toBe(false);
  });
});

// ─── React + Next.js ─────────────────────────────────────────────────────────

describe('scaffoldProject — react-next', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'next-app', framework: 'react-next' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'next.config.ts',
      'tsconfig.json',
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/app/globals.css',
      'src/components/helix/wrappers.tsx',
      'src/components/helix/provider.tsx',
      'src/helix.d.ts',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('package.json has next scripts', async () => {
    const opts = makeOptions({ name: 'next-scripts', framework: 'react-next' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('next dev');
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.scripts.start).toBe('next start');
  });

  it('package.json includes react and next dependencies', async () => {
    const opts = makeOptions({ name: 'next-deps', framework: 'react-next' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.dependencies['next']).toBeDefined();
    expect(pkg.dependencies['react']).toBeDefined();
    expect(pkg.dependencies['react-dom']).toBeDefined();
    expect(pkg.dependencies['@helixui/library']).toBeDefined();
    expect(pkg.dependencies['@lit/react']).toBeDefined();
  });

  it('react-next generates its own tsconfig (not the generic one)', async () => {
    const opts = makeOptions({ name: 'next-tsconfig', framework: 'react-next' });
    await scaffoldProject(opts);
    const tsconfig = await fs.readJson(path.join(opts.directory, 'tsconfig.json'));
    // Next.js tsconfig has 'next' plugin
    expect(tsconfig.compilerOptions.plugins).toBeDefined();
    expect(tsconfig.compilerOptions.plugins[0].name).toBe('next');
  });
});

// ─── React + Vite ────────────────────────────────────────────────────────────

describe('scaffoldProject — react-vite', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'react-vite-app', framework: 'react-vite' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'vite.config.ts',
      'index.html',
      'src/main.tsx',
      'src/App.tsx',
      'src/index.css',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('package.json has vite scripts', async () => {
    const opts = makeOptions({ name: 'rv-scripts', framework: 'react-vite' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('vite');
    expect(pkg.scripts.build).toBe('vite build');
    expect(pkg.scripts.preview).toBe('vite preview');
  });
});

// ─── Vue + Vite ──────────────────────────────────────────────────────────────

describe('scaffoldProject — vue-vite', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'vue-vite-app', framework: 'vue-vite' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'vite.config.ts',
      'index.html',
      'src/main.ts',
      'src/App.vue',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('vite.config.ts configures custom element detection for hx-*', async () => {
    const opts = makeOptions({ name: 'vue-ce', framework: 'vue-vite' });
    await scaffoldProject(opts);
    const viteConfig = await fs.readFile(path.join(opts.directory, 'vite.config.ts'), 'utf-8');
    expect(viteConfig).toContain('isCustomElement');
    expect(viteConfig).toContain("hx-");
  });

  it('package.json has vite scripts', async () => {
    const opts = makeOptions({ name: 'vv-scripts', framework: 'vue-vite' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('vite');
    expect(pkg.scripts.build).toBe('vite build');
  });
});

// ─── SvelteKit ───────────────────────────────────────────────────────────────

describe('scaffoldProject — svelte-kit', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'svelte-app', framework: 'svelte-kit' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'svelte.config.js',
      'vite.config.ts',
      'src/routes/+page.svelte',
      'src/routes/+layout.svelte',
      'src/app.html',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('package.json has sveltekit scripts', async () => {
    const opts = makeOptions({ name: 'sk-scripts', framework: 'svelte-kit' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('vite dev');
    expect(pkg.scripts.build).toBe('vite build');
    expect(pkg.scripts.preview).toBe('vite preview');
  });

  it('svelte.config.js uses adapter-auto', async () => {
    const opts = makeOptions({ name: 'sk-adapter', framework: 'svelte-kit' });
    await scaffoldProject(opts);
    const config = await fs.readFile(path.join(opts.directory, 'svelte.config.js'), 'utf-8');
    expect(config).toContain('@sveltejs/adapter-auto');
  });
});

// ─── Angular ─────────────────────────────────────────────────────────────────

describe('scaffoldProject — angular', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'angular-app', framework: 'angular' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'angular.json',
      'src/index.html',
      'src/main.ts',
      'src/styles.css',
      'src/app/app.component.ts',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('angular.json references the project name', async () => {
    const opts = makeOptions({ name: 'ng-proj', framework: 'angular' });
    await scaffoldProject(opts);
    const angularJson = await fs.readJson(path.join(opts.directory, 'angular.json'));
    expect(angularJson.projects['ng-proj']).toBeDefined();
    expect(angularJson.projects['ng-proj'].projectType).toBe('application');
  });

  it('app.component.ts uses CUSTOM_ELEMENTS_SCHEMA', async () => {
    const opts = makeOptions({ name: 'ng-schema', framework: 'angular' });
    await scaffoldProject(opts);
    const component = await fs.readFile(
      path.join(opts.directory, 'src', 'app', 'app.component.ts'),
      'utf-8',
    );
    expect(component).toContain('CUSTOM_ELEMENTS_SCHEMA');
  });

  it('package.json has angular scripts', async () => {
    const opts = makeOptions({ name: 'ng-scripts', framework: 'angular' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('ng serve');
    expect(pkg.scripts.build).toBe('ng build');
  });
});

// ─── Vanilla ─────────────────────────────────────────────────────────────────

describe('scaffoldProject — vanilla', () => {
  it('generates index.html with CDN links', async () => {
    const opts = makeOptions({ name: 'vanilla-app', framework: 'vanilla' });
    await scaffoldProject(opts);

    const htmlPath = path.join(opts.directory, 'index.html');
    expect(await fs.pathExists(htmlPath)).toBe(true);

    const html = await fs.readFile(htmlPath, 'utf-8');
    expect(html).toContain('cdn.jsdelivr.net');
    expect(html).toContain('@helixui/library');
    expect(html).toContain('@helixui/tokens');
  });

  it('package.json has http-server dev script', async () => {
    const opts = makeOptions({ name: 'vanilla-scripts', framework: 'vanilla' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toContain('http-server');
  });

  it('vanilla template has no build step dependencies', async () => {
    const opts = makeOptions({
      name: 'vanilla-deps',
      framework: 'vanilla',
      eslint: false,
      typescript: false,
      designTokens: false,
    });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    // Vanilla framework has empty dependencies in template
    // (designTokens is false so no @helixui/tokens added)
    expect(Object.keys(pkg.dependencies)).toHaveLength(0);
  });
});

// ─── Astro ───────────────────────────────────────────────────────────────────

describe('scaffoldProject — astro', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'astro-app', framework: 'astro' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'astro.config.mjs',
      'src/pages/index.astro',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('package.json has astro scripts', async () => {
    const opts = makeOptions({ name: 'astro-scripts', framework: 'astro' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('astro dev');
    expect(pkg.scripts.build).toBe('astro build');
    expect(pkg.scripts.preview).toBe('astro preview');
  });

  it('index.astro imports @helixui/library', async () => {
    const opts = makeOptions({ name: 'astro-import', framework: 'astro' });
    await scaffoldProject(opts);
    const page = await fs.readFile(
      path.join(opts.directory, 'src', 'pages', 'index.astro'),
      'utf-8',
    );
    expect(page).toContain("@helixui/library");
  });
});

// ─── Vue + Nuxt ──────────────────────────────────────────────────────────────

describe('scaffoldProject — vue-nuxt', () => {
  it('generates expected file structure', async () => {
    const opts = makeOptions({ name: 'nuxt-app', framework: 'vue-nuxt' });
    await scaffoldProject(opts);

    const expectedFiles = [
      'package.json',
      'nuxt.config.ts',
      'plugins/helix.client.ts',
      'app/app.vue',
      'app/pages/index.vue',
    ];

    for (const file of expectedFiles) {
      expect(await fs.pathExists(path.join(opts.directory, file))).toBe(true);
    }
  });

  it('nuxt.config.ts configures custom element detection', async () => {
    const opts = makeOptions({ name: 'nuxt-ce', framework: 'vue-nuxt' });
    await scaffoldProject(opts);
    const config = await fs.readFile(path.join(opts.directory, 'nuxt.config.ts'), 'utf-8');
    expect(config).toContain('isCustomElement');
    expect(config).toContain("hx-");
  });

  it('helix plugin imports @helixui/library', async () => {
    const opts = makeOptions({ name: 'nuxt-plugin', framework: 'vue-nuxt' });
    await scaffoldProject(opts);
    const plugin = await fs.readFile(
      path.join(opts.directory, 'plugins', 'helix.client.ts'),
      'utf-8',
    );
    expect(plugin).toContain("@helixui/library");
  });

  it('package.json has nuxt scripts', async () => {
    const opts = makeOptions({ name: 'nuxt-scripts', framework: 'vue-nuxt' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.scripts.dev).toBe('nuxt dev');
    expect(pkg.scripts.build).toBe('nuxt build');
    expect(pkg.scripts.preview).toBe('nuxt preview');
  });
});

// ─── Package.json correctness across frameworks ──────────────────────────────

describe('scaffoldProject — package.json structure', () => {
  it('sets type to "module"', async () => {
    const opts = makeOptions({ name: 'pkg-type' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.type).toBe('module');
  });

  it('sets version to "0.1.0"', async () => {
    const opts = makeOptions({ name: 'pkg-version' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.version).toBe('0.1.0');
  });

  it('sets private to true', async () => {
    const opts = makeOptions({ name: 'pkg-private' });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.private).toBe(true);
  });

  it('includes @helixui/tokens in dependencies when designTokens is true', async () => {
    const opts = makeOptions({ name: 'pkg-tokens', designTokens: true });
    await scaffoldProject(opts);
    const pkg = await fs.readJson(path.join(opts.directory, 'package.json'));
    expect(pkg.dependencies['@helixui/tokens']).toBeDefined();
  });
});
