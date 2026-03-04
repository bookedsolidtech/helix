import * as p from '@clack/prompts';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { readConfig } from '../config.js';
import { isValidComponent, findComponent } from '../registry.js';

export async function runDiff(component: string): Promise<void> {
  p.intro(`Helix DS — Diff: ${component}`);

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
      `Local exists: ${localExists ? 'yes' : 'no (not yet added)'}`,
      `Registry  : ${config.registry}`,
      `Upstream  : ${config.registry}/components/${component}`,
    ].join('\n'),
  );

  if (!localExists) {
    p.log.warn(
      `No local copy of "${component}" found at ${localDir}. ` +
        `Run \`helix add ${component}\` to copy it into your project first.`,
    );
    p.outro('Diff skipped — component not present locally.');
    return;
  }

  const spinner = p.spinner();
  spinner.start(`Fetching upstream version of ${component} from registry`);

  // Registry connectivity is not yet implemented.
  await simulateDelay(400);

  spinner.stop('Registry fetch attempted');

  p.log.warn(
    [
      'Registry connectivity is not yet implemented in this release.',
      '',
      'When available, this command will show a unified diff between:',
      `  Local    : ${localDir}`,
      `  Upstream : ${config.registry}/components/${component}`,
      '',
      'Placeholder diff output:',
      '',
      `--- a/${component}/${component}.ts  (local)`,
      `+++ b/${component}/${component}.ts  (upstream @ latest)`,
      '@@ -1,4 +1,4 @@',
      ' // No differences detected (registry unavailable — placeholder)',
    ].join('\n'),
  );

  p.outro(
    `Diff complete. Connect to ${config.registry} for live comparison once registry is available.`,
  );
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
