import * as p from '@clack/prompts';
import { configExists, writeConfig, DEFAULT_CONFIG, CONFIG_FILENAME } from '../config.js';

export async function runInit(): Promise<void> {
  p.intro('Helix DS — Initialize Project');

  if (configExists()) {
    const overwrite = await p.confirm({
      message: `${CONFIG_FILENAME} already exists. Overwrite it?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.outro('Initialization cancelled. Existing config preserved.');
      return;
    }
  }

  const registry = await p.text({
    message: 'Registry URL',
    placeholder: DEFAULT_CONFIG.registry,
    defaultValue: DEFAULT_CONFIG.registry,
    validate(value) {
      const target = value.trim() === '' ? DEFAULT_CONFIG.registry : value.trim();
      try {
        new URL(target);
        return undefined;
      } catch {
        return 'Please enter a valid URL (e.g. https://registry.helixds.com)';
      }
    },
  });

  if (p.isCancel(registry)) {
    p.outro('Initialization cancelled.');
    return;
  }

  const outDir = await p.text({
    message: 'Output directory for components',
    placeholder: DEFAULT_CONFIG.outDir,
    defaultValue: DEFAULT_CONFIG.outDir,
  });

  if (p.isCancel(outDir)) {
    p.outro('Initialization cancelled.');
    return;
  }

  const useTypeScript = await p.confirm({
    message: 'Use TypeScript?',
    initialValue: DEFAULT_CONFIG.typescript,
  });

  if (p.isCancel(useTypeScript)) {
    p.outro('Initialization cancelled.');
    return;
  }

  const resolvedRegistry = (registry as string).trim() === '' ? DEFAULT_CONFIG.registry : (registry as string).trim();
  const resolvedOutDir = (outDir as string).trim() === '' ? DEFAULT_CONFIG.outDir : (outDir as string).trim();

  const spinner = p.spinner();
  spinner.start('Writing helix.config.json');

  await writeConfig({
    registry: resolvedRegistry,
    outDir: resolvedOutDir,
    typescript: useTypeScript as boolean,
  });

  spinner.stop('helix.config.json written successfully');

  p.outro(
    [
      'Project initialized.',
      `  Registry : ${resolvedRegistry}`,
      `  Output   : ${resolvedOutDir}`,
      `  TypeScript: ${(useTypeScript as boolean) ? 'yes' : 'no'}`,
      '',
      'Run `helix add` to copy your first component.',
    ].join('\n'),
  );
}
