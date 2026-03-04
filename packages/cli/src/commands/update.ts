import * as p from '@clack/prompts';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { readConfig } from '../config.js';
import { isValidComponent, findComponent } from '../registry.js';

export async function runUpdate(component: string): Promise<void> {
  p.intro(`Helix DS — Update: ${component}`);

  if (!isValidComponent(component)) {
    p.log.error(
      `Unknown component: "${component}". Run \`helix add\` without arguments to see available components.`,
    );
    process.exitCode = 1;
    return;
  }

  let config;
  try {
    config = await readConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(message);
    process.exitCode = 1;
    return;
  }

  const entry = findComponent(component);
  const localDir = join(config.outDir, component);
  const localExists = existsSync(localDir);

  p.log.info(
    [
      `Component : ${component}`,
      `Description: ${entry?.description ?? 'N/A'}`,
      `Local path : ${localDir}`,
      `Local exists: ${localExists ? 'yes' : 'no'}`,
      `Registry  : ${config.registry}`,
    ].join('\n'),
  );

  if (!localExists) {
    p.log.warn(
      `No local copy of "${component}" found at ${localDir}. ` +
        `Run \`helix add ${component}\` to copy it into your project first.`,
    );
    p.outro('Update skipped — component not present locally.');
    return;
  }

  const confirmed = await p.confirm({
    message: `Update "${component}" from ${config.registry}? This may overwrite local changes.`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.outro('Update cancelled. Local files preserved.');
    return;
  }

  const spinner = p.spinner();
  spinner.start(`Fetching latest version of ${component} from registry`);

  await simulateDelay(500);

  spinner.stop('Registry fetch attempted');

  p.log.warn(
    [
      'Registry connectivity is not yet implemented in this release.',
      '',
      'When available, this command will:',
      `  1. Fetch the latest source for "${component}" from ${config.registry}`,
      `  2. Show a diff of local changes vs upstream`,
      `  3. Apply upstream changes while preserving local customizations where possible`,
      `  4. Report any merge conflicts for manual resolution`,
      '',
      `Target directory: ${localDir}`,
    ].join('\n'),
  );

  p.outro(
    `Update workflow ready. Full registry support coming in a future release.`,
  );
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
