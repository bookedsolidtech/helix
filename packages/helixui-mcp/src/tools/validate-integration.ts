import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location: string;
}

export interface ValidationResult {
  projectPath: string;
  issues: ValidationIssue[];
  summary: string;
}

// ─── File collection ──────────────────────────────────────────────────────────

const SOURCE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.svelte',
]);
const CONFIG_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.next',
  '.nuxt',
]);

function collectFiles(dir: string, extensions: Set<string>, maxDepth = 8, depth = 0): string[] {
  if (depth > maxDepth || !existsSync(dir)) return [];
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      results.push(...collectFiles(full, extensions, maxDepth, depth + 1));
    } else if (extensions.has(extname(entry).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

function safeRead(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function relPath(projectPath: string, filePath: string): string {
  return filePath.startsWith(projectPath) ? filePath.slice(projectPath.length + 1) : filePath;
}

// ─── Check: import correctness ────────────────────────────────────────────────

function checkImports(projectPath: string, sourceFiles: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const file of sourceFiles) {
    const content = safeRead(file);
    const loc = relPath(projectPath, file);

    // Detect barrel imports from @helixui/library (non-tree-shakeable)
    const barrelImportRegex = /from\s+['"]@helixui\/library['"]/g;
    let match: RegExpExecArray | null;
    while ((match = barrelImportRegex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type: 'barrel-import',
        severity: 'warning',
        message:
          "Importing from the @helixui/library barrel may prevent tree-shaking. Prefer path imports: import '@helixui/library/components/hx-button/index.js'.",
        location: `${loc}:${lineNum}`,
      });
    }

    // Detect incorrect import paths (e.g., importing .ts files directly in production code)
    const tsImportRegex = /from\s+['"](@helixui\/[^'"]+\.ts)['"]/g;
    while ((match = tsImportRegex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type: 'import-ts-extension',
        severity: 'error',
        message: `Import "${match[1]}" uses a .ts extension. Use .js extensions in module specifiers for ESM compatibility.`,
        location: `${loc}:${lineNum}`,
      });
    }
  }

  return issues;
}

// ─── Check: bundler config ────────────────────────────────────────────────────

function checkBundlerConfig(projectPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const configPatterns = [
    'vite.config.ts',
    'vite.config.js',
    'vite.config.mjs',
    'webpack.config.js',
    'webpack.config.ts',
    'webpack.config.mjs',
    'rollup.config.js',
    'rollup.config.ts',
    'rollup.config.mjs',
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
  ];

  let foundConfig = false;

  for (const pattern of configPatterns) {
    const configPath = resolve(projectPath, pattern);
    if (!existsSync(configPath)) continue;
    foundConfig = true;
    const content = safeRead(configPath);

    // Vite: check for customElements or defineCustomElements
    if (pattern.startsWith('vite.')) {
      if (!content.includes('customElements') && !content.includes('lit')) {
        issues.push({
          type: 'bundler-ce-handling',
          severity: 'info',
          message:
            'Vite config found but no explicit custom elements or Lit configuration detected. Ensure @web/dev-server-legacy or @vitejs/plugin-legacy is configured if targeting older browsers.',
          location: pattern,
        });
      }
    }

    // Webpack: check for custom elements handling
    if (pattern.startsWith('webpack.')) {
      if (!content.includes('customElements') && !content.includes('LitElement')) {
        issues.push({
          type: 'bundler-ce-handling',
          severity: 'info',
          message:
            'Webpack config found. Ensure custom elements are not transpiled by Babel in a way that breaks class inheritance (use @babel/plugin-transform-classes with loose: false or avoid class transforms).',
          location: pattern,
        });
      }
    }

    // Next.js: check for transpilePackages
    if (pattern.startsWith('next.')) {
      if (!content.includes('transpilePackages') && !content.includes('@helixui')) {
        issues.push({
          type: 'bundler-ce-handling',
          severity: 'warning',
          message:
            "Next.js config found without transpilePackages for @helixui. Add transpilePackages: ['@helixui/library'] to next.config.* to ensure proper module resolution.",
          location: pattern,
        });
      }

      // Check for custom elements schema in Next.js
      if (
        !content.includes('experimental') ||
        !content.includes('serverComponentsExternalPackages')
      ) {
        issues.push({
          type: 'ssr-ce-handling',
          severity: 'warning',
          message:
            'Next.js project detected. Add @helixui/library to serverExternalPackages (Next.js 14+) or serverComponentsExternalPackages to prevent SSR issues with custom elements.',
          location: pattern,
        });
      }
    }
  }

  if (!foundConfig) {
    issues.push({
      type: 'bundler-config-missing',
      severity: 'info',
      message:
        'No recognized bundler config file found (vite.config.*, webpack.config.*, rollup.config.*). Ensure your bundler is configured to handle ES modules and custom elements.',
      location: projectPath,
    });
  }

  return issues;
}

// ─── Check: SSR compatibility ─────────────────────────────────────────────────

function checkSsrCompatibility(projectPath: string, sourceFiles: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // DOM globals that require guards in SSR contexts
  const dangerousGlobals: Array<{ pattern: RegExp; name: string }> = [
    {
      pattern: /(?<!['"(`])(?<!\.)(?<!\w)window\s*\./g,
      name: 'window',
    },
    {
      pattern: /(?<!['"(`])(?<!\.)(?<!\w)document\s*\./g,
      name: 'document',
    },
    {
      pattern: /(?<!['"(`])(?<!\.)customElements\s*\./g,
      name: 'customElements',
    },
    {
      pattern: /(?<!['"(`])(?<!\.)navigator\s*\./g,
      name: 'navigator',
    },
    {
      pattern: /(?<!['"(`])(?<!\.)localStorage\s*[.[]/g,
      name: 'localStorage',
    },
  ];

  // SSR guard patterns — if these are present, DOM access is likely guarded
  const ssrGuardPattern =
    /typeof\s+(window|document|customElements|navigator|localStorage)\s*!==?\s*['"]undefined['"]/;

  for (const file of sourceFiles) {
    const content = safeRead(file);
    // Skip test files and type declarations
    if (file.endsWith('.test.ts') || file.endsWith('.spec.ts') || file.endsWith('.d.ts')) continue;
    // Skip files that already have SSR guards in them
    if (ssrGuardPattern.test(content)) continue;

    const loc = relPath(projectPath, file);

    for (const { pattern, name } of dangerousGlobals) {
      pattern.lastIndex = 0;
      const match = pattern.exec(content);
      if (match) {
        const lineNum = content.slice(0, match.index).split('\n').length;
        issues.push({
          type: 'ssr-dom-api-unguarded',
          severity: 'warning',
          message: `Unguarded "${name}" access detected. In SSR environments (Next.js, Nuxt, etc.) this will throw. Wrap with: if (typeof ${name} !== 'undefined') { ... }`,
          location: `${loc}:${lineNum}`,
        });
        // Report once per file per global
        break;
      }
    }
  }

  return issues;
}

// ─── Check: CSP compliance ────────────────────────────────────────────────────

function checkCspCompliance(projectPath: string, sourceFiles: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const file of sourceFiles) {
    const content = safeRead(file);
    const loc = relPath(projectPath, file);

    // Detect inline style injection that would be blocked by CSP
    const inlineStyleRegex = /\.setAttribute\s*\(\s*['"]style['"]\s*,/g;
    let match: RegExpExecArray | null;
    while ((match = inlineStyleRegex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type: 'csp-inline-style',
        severity: 'warning',
        message:
          'setAttribute("style", ...) injects inline styles that may be blocked by Content-Security-Policy style-src directives. Use CSS classes or CSS custom properties instead.',
        location: `${loc}:${lineNum}`,
      });
    }

    // Detect eval-like patterns
    const evalRegex = /\beval\s*\(|\bnew\s+Function\s*\(/g;
    while ((match = evalRegex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type: 'csp-unsafe-eval',
        severity: 'error',
        message:
          'eval() or new Function() detected. This will be blocked by CSP unsafe-eval directive and is a security risk.',
        location: `${loc}:${lineNum}`,
      });
    }

    // Detect innerHTML assignment (XSS + CSP risk)
    const innerHtmlRegex = /\.innerHTML\s*=/g;
    while ((match = innerHtmlRegex.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type: 'csp-inner-html',
        severity: 'warning',
        message:
          'innerHTML assignment can be an XSS vector and may conflict with CSP trusted-types policies. Use Lit templates or DOM manipulation APIs instead.',
        location: `${loc}:${lineNum}`,
      });
    }
  }

  return issues;
}

// ─── Check: framework-specific issues ─────────────────────────────────────────

function checkFrameworkIssues(projectPath: string, sourceFiles: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const packageJsonPath = resolve(projectPath, 'package.json');
  const packageJson = existsSync(packageJsonPath)
    ? (JSON.parse(safeRead(packageJsonPath)) as Record<string, unknown>)
    : {};

  const deps = {
    ...(packageJson['dependencies'] as Record<string, string> | undefined),
    ...(packageJson['devDependencies'] as Record<string, string> | undefined),
    ...(packageJson['peerDependencies'] as Record<string, string> | undefined),
  };

  const hasReact = 'react' in deps || 'react-dom' in deps;
  const hasVue = 'vue' in deps;
  const hasAngular = '@angular/core' in deps;
  const hasDrupal = sourceFiles.some(
    (f) => f.endsWith('.behavior.js') || f.endsWith('.behavior.ts'),
  );

  // ── React ──────────────────────────────────────────────────────────────────
  if (hasReact) {
    const hasLitReact = '@lit/react' in deps || 'lit-labs-react' in deps;

    if (!hasLitReact) {
      issues.push({
        type: 'framework-react-wrapper',
        severity: 'warning',
        message:
          'React project detected without @lit/react. Custom events and complex properties on hx-* components may not work correctly in React without wrapper components. Install @lit/react and create wrappers for each component.',
        location: 'package.json',
      });
    }

    // Check for incorrect event binding (onHxClick vs hxClick events)
    for (const file of sourceFiles) {
      if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) continue;
      const content = safeRead(file);
      const loc = relPath(projectPath, file);

      // React event handler pattern on hx- elements without @lit/react
      const reactEventRegex = /on[A-Z][a-zA-Z]+\s*=\s*\{[^}]+\}\s*(?=>)/g;
      const hxElementRegex = /<hx-[a-z-]+/;

      if (hxElementRegex.test(content) && !hasLitReact) {
        const match = reactEventRegex.exec(content);
        if (match) {
          const lineNum = content.slice(0, match.index).split('\n').length;
          issues.push({
            type: 'framework-react-events',
            severity: 'warning',
            message:
              'React synthetic event handlers (onXxx) do not work with custom events from hx-* components. Use addEventListener in a useEffect or @lit/react createComponent() wrappers.',
            location: `${loc}:${lineNum}`,
          });
        }
      }
    }
  }

  // ── Vue ────────────────────────────────────────────────────────────────────
  if (hasVue) {
    const viteConfigFiles = ['vite.config.ts', 'vite.config.js', 'vite.config.mjs'];
    let vueConfigHasIsCustomElement = false;

    for (const configFile of viteConfigFiles) {
      const configPath = resolve(projectPath, configFile);
      if (!existsSync(configPath)) continue;
      const content = safeRead(configPath);
      if (content.includes('isCustomElement')) {
        vueConfigHasIsCustomElement = true;
        break;
      }
    }

    if (!vueConfigHasIsCustomElement) {
      issues.push({
        type: 'framework-vue-custom-element',
        severity: 'error',
        message:
          "Vue project detected without isCustomElement configuration. Add to vite.config: vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('hx-') } } }). Without this, Vue will warn about unknown elements and may not bind properties correctly.",
        location: 'vite.config.*',
      });
    }
  }

  // ── Angular ────────────────────────────────────────────────────────────────
  if (hasAngular) {
    let hasCustomElementsSchema = false;

    for (const file of sourceFiles) {
      if (!file.endsWith('.module.ts') && !file.endsWith('.module.js')) continue;
      const content = safeRead(file);
      if (content.includes('CUSTOM_ELEMENTS_SCHEMA')) {
        hasCustomElementsSchema = true;
        break;
      }
    }

    if (!hasCustomElementsSchema) {
      issues.push({
        type: 'framework-angular-schema',
        severity: 'error',
        message:
          'Angular project detected without CUSTOM_ELEMENTS_SCHEMA. Add CUSTOM_ELEMENTS_SCHEMA to the schemas array in your NgModule to prevent template compilation errors for hx-* elements.',
        location: '*.module.ts',
      });
    }
  }

  // ── Drupal ─────────────────────────────────────────────────────────────────
  if (hasDrupal) {
    let hasOncePattern = false;

    for (const file of sourceFiles) {
      if (!file.endsWith('.behavior.js') && !file.endsWith('.behavior.ts')) continue;
      const content = safeRead(file);
      if (content.includes('once(') || content.includes('Drupal.once(')) {
        hasOncePattern = true;
        break;
      }
    }

    if (!hasOncePattern) {
      issues.push({
        type: 'framework-drupal-once',
        severity: 'warning',
        message:
          'Drupal behavior files detected without once() usage. Drupal behaviors can attach multiple times (AJAX, BigPipe). Wrap initialization in once("helix-init", context) to prevent duplicate event listeners.',
        location: '*.behavior.js',
      });
    }

    // Check for component query within behaviors — should scope to context, not document
    for (const file of sourceFiles) {
      if (!file.endsWith('.behavior.js') && !file.endsWith('.behavior.ts')) continue;
      const content = safeRead(file);
      const loc = relPath(projectPath, file);

      const documentQueryRegex = /document\.querySelector(?:All)?\s*\(\s*['"]hx-/g;
      let match: RegExpExecArray | null;
      while ((match = documentQueryRegex.exec(content)) !== null) {
        const lineNum = content.slice(0, match.index).split('\n').length;
        issues.push({
          type: 'framework-drupal-context',
          severity: 'warning',
          message:
            'Drupal behavior uses document.querySelector for hx-* elements. Use context.querySelector or $(context).find() to scope to the attached DOM fragment (AJAX compatibility).',
          location: `${loc}:${lineNum}`,
        });
      }
    }
  }

  return issues;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export function validateIntegration(projectPath: string): string {
  const absolutePath = resolve(projectPath);

  if (!existsSync(absolutePath)) {
    throw new Error(`Project directory not found: ${absolutePath}`);
  }

  const stat = statSync(absolutePath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${absolutePath}`);
  }

  const sourceFiles = collectFiles(absolutePath, SOURCE_EXTENSIONS);
  const issues: ValidationIssue[] = [];

  issues.push(...checkImports(absolutePath, sourceFiles));
  issues.push(...checkBundlerConfig(absolutePath));
  issues.push(...checkSsrCompatibility(absolutePath, sourceFiles));
  issues.push(...checkCspCompliance(absolutePath, sourceFiles));
  issues.push(...checkFrameworkIssues(absolutePath, sourceFiles));

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const summary =
    issues.length === 0
      ? 'No integration issues found.'
      : `Found ${issues.length} issue${issues.length === 1 ? '' : 's'}: ${errorCount} error${errorCount === 1 ? '' : 's'}, ${warnCount} warning${warnCount === 1 ? '' : 's'}, ${infoCount} info.`;

  const result: ValidationResult = {
    projectPath: absolutePath,
    issues,
    summary,
  };

  return JSON.stringify(result, null, 2);
}
