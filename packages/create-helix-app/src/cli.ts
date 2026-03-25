import * as p from '@clack/prompts';
import pc from 'picocolors';
import path from 'node:path';
import { TEMPLATES, COMPONENT_BUNDLES } from './templates.js';
import { scaffoldProject } from './scaffold.js';
import type { Framework, ComponentBundle, ProjectOptions } from './types.js';
import { isValidPreset, PRESETS } from './presets/loader.js';
import { scaffoldDrupalTheme } from './generators/drupal-theme.js';
import type { DrupalPreset } from './types.js';

const HELIX_VERSION = '0.1.0';

function banner(): void {
  console.log();
  console.log(pc.bold(pc.cyan('  ╭─────────────────────────────────────╮')));
  console.log(pc.bold(pc.cyan('  │                                     │')));
  console.log(
    pc.bold(
      pc.cyan('  │') +
        '   ' +
        pc.white('H E L i X') +
        '  ' +
        pc.dim('create') +
        '              ' +
        pc.cyan('│'),
    ),
  );
  console.log(
    pc.bold(pc.cyan('  │') + pc.dim('   Enterprise Web Components           ') + pc.cyan('│')),
  );
  console.log(
    pc.bold(
      pc.cyan('  │') +
        pc.dim(`   v${HELIX_VERSION}`) +
        '                              ' +
        pc.cyan('│'),
    ),
  );
  console.log(pc.bold(pc.cyan('  │                                     │')));
  console.log(pc.bold(pc.cyan('  ╰─────────────────────────────────────╯')));
  console.log();
}

async function runDrupalCLI(presetArg: string | null): Promise<void> {
  banner();

  p.intro(pc.bgCyan(pc.black(' create-helix-app — Drupal theme ')));

  // Validate preset if provided via flag
  if (presetArg !== null && !isValidPreset(presetArg)) {
    console.error(
      `Invalid preset: "${presetArg}". Valid presets: standard, blog, healthcare, intranet`,
    );
    process.exit(1);
  }

  const themeName = await p.text({
    message: 'Drupal theme machine name',
    placeholder: 'my-helix-theme',
    validate(value) {
      if (!value) return 'Theme name is required';
      if (!/^[a-z][a-z0-9_]*$/.test(value))
        return 'Use only lowercase letters, numbers, and underscores (must start with a letter)';
      return undefined;
    },
  });

  if (p.isCancel(themeName)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  let preset: DrupalPreset;

  if (presetArg !== null && isValidPreset(presetArg)) {
    preset = presetArg;
  } else {
    const selected = await p.select<DrupalPreset>({
      message: 'Which Drupal preset?',
      options: PRESETS.map((pr) => ({
        value: pr.id,
        label: pr.name,
        hint: pr.description,
      })),
    });

    if (p.isCancel(selected)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    preset = selected as DrupalPreset;
  }

  const themeNameStr = themeName as string;
  const directory = path.resolve(process.cwd(), themeNameStr);

  const s = p.spinner();
  s.start('Scaffolding Drupal theme...');

  await scaffoldDrupalTheme({ themeName: themeNameStr, directory, preset });

  s.stop(pc.green('Drupal theme scaffolded'));

  const nextSteps = [
    `cd ${themeNameStr}`,
    'npm install',
    `# Copy theme to: web/themes/custom/${themeNameStr}`,
    '# Enable in Drupal admin: /admin/appearance',
  ];

  p.note(nextSteps.join('\n'), 'Next steps');

  console.log();
  console.log(pc.dim('  Theme:  ') + pc.white(themeNameStr));
  console.log(pc.dim('  Preset: ') + pc.white(preset));
  console.log();

  p.outro(pc.green('Done!') + ' ' + pc.dim('Build something beautiful with HELiX + Drupal.'));
}

export async function runCLI(): Promise<void> {
  // Parse flags before prompting
  const args = process.argv.slice(2);
  const isDrupal = args.includes('--drupal');
  const presetArgIndex = args.indexOf('--preset');
  const presetArg = presetArgIndex !== -1 ? (args[presetArgIndex + 1] ?? null) : null;

  if (isDrupal) {
    await runDrupalCLI(presetArg);
    return;
  }

  banner();

  p.intro(pc.bgCyan(pc.black(' create-helix-app ')));

  const argName = process.argv[2];

  const project = await p.group(
    {
      name: () =>
        p.text({
          message: 'Project name',
          placeholder: 'my-helix-app',
          initialValue: argName ?? '',
          validate(value) {
            if (!value) return 'Project name is required';
            if (!/^[a-z0-9-_]+$/i.test(value))
              return 'Use only letters, numbers, hyphens, and underscores';
            return undefined;
          },
        }),

      framework: () =>
        p.select({
          message: 'Which framework?',
          options: TEMPLATES.map((t) => ({
            value: t.id as Framework,
            label: t.color(t.name),
            hint: t.hint,
          })),
        }),

      componentBundles: () =>
        p.multiselect({
          message: 'Which component bundles? ' + pc.dim('(space to toggle, enter to confirm)'),
          options: COMPONENT_BUNDLES.map((b) => ({
            value: b.id as ComponentBundle,
            label: b.name,
            hint: b.description,
          })),
          initialValues: ['core', 'forms'] as ComponentBundle[],
          required: true,
        }),

      features: () =>
        p.multiselect({
          message: 'Additional features',
          options: [
            { value: 'typescript', label: 'TypeScript' },
            { value: 'eslint', label: 'ESLint + Prettier' },
            { value: 'tokens', label: 'HELiX Design Tokens' },
            { value: 'dark-mode', label: 'Dark Mode Support' },
            { value: 'examples', label: 'Example Pages (forms, dashboard, settings)' },
          ],
          initialValues: ['typescript', 'eslint', 'tokens', 'examples'],
          required: false,
        }),

      installDeps: () =>
        p.confirm({
          message: 'Install dependencies?',
          initialValue: true,
        }),
    },
    {
      onCancel() {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    },
  );

  const options: ProjectOptions = {
    name: project.name as string,
    directory: path.resolve(process.cwd(), project.name as string),
    framework: project.framework as Framework,
    componentBundles: project.componentBundles as ComponentBundle[],
    typescript: (project.features as string[]).includes('typescript'),
    eslint: (project.features as string[]).includes('eslint'),
    designTokens: (project.features as string[]).includes('tokens'),
    darkMode: (project.features as string[]).includes('dark-mode'),
    installDeps: project.installDeps as boolean,
  };

  const template = TEMPLATES.find((t) => t.id === options.framework);

  const s = p.spinner();

  s.start('Scaffolding project...');
  await scaffoldProject(options);
  s.stop(pc.green('Project scaffolded'));

  if (options.installDeps) {
    s.start('Installing dependencies...');
    const { execSync } = await import('node:child_process');
    try {
      execSync('pnpm install', {
        cwd: options.directory,
        stdio: 'pipe',
      });
      s.stop(pc.green('Dependencies installed'));
    } catch {
      try {
        execSync('npm install', {
          cwd: options.directory,
          stdio: 'pipe',
        });
        s.stop(pc.green('Dependencies installed (npm)'));
      } catch {
        s.stop(pc.yellow('Could not install dependencies — run manually'));
      }
    }
  }

  const nextSteps = [
    `cd ${project.name}`,
    options.framework === 'vanilla' ? 'open index.html' : 'pnpm dev',
  ];

  p.note(nextSteps.join('\n'), 'Next steps');

  console.log();
  console.log(pc.dim('  Framework:  ') + (template?.color(template.name) ?? project.framework));
  console.log(
    pc.dim('  Components: ') +
      pc.white(
        options.componentBundles.includes('all')
          ? '98 components (full library)'
          : `${options.componentBundles.length} bundle(s)`,
      ),
  );
  console.log(
    pc.dim('  Features:   ') +
      pc.white(
        [
          options.typescript && 'TypeScript',
          options.eslint && 'ESLint',
          options.designTokens && 'Design Tokens',
          options.darkMode && 'Dark Mode',
        ]
          .filter(Boolean)
          .join(', ') || 'None',
      ),
  );
  console.log();

  p.outro(pc.green('Done!') + ' ' + pc.dim('Build something beautiful with HELiX.'));
}
