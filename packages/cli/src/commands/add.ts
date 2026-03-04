import * as p from '@clack/prompts';
import { join } from 'node:path';
import { readConfig } from '../config.js';
import { getAvailableComponents, getComponentDescription, isValidComponent } from '../registry.js';

export async function runAdd(componentArg: string | undefined): Promise<void> {
  p.intro('Helix DS — Add Component');

  let config;
  try {
    config = await readConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    p.log.error(message);
    process.exitCode = 1;
    return;
  }

  let selectedComponents: string[];

  if (componentArg !== undefined) {
    // Single component provided as CLI arg
    if (!isValidComponent(componentArg)) {
      p.log.error(
        `Unknown component: "${componentArg}". Run \`helix add\` without arguments to see available components.`,
      );
      process.exitCode = 1;
      return;
    }
    selectedComponents = [componentArg];
  } else {
    // Interactive multiselect
    const available = getAvailableComponents();

    const selection = await p.multiselect({
      message: 'Select components to add (space to toggle, enter to confirm)',
      options: available.map((c) => ({
        value: c.name,
        label: c.name,
        hint: c.description,
      })),
      required: true,
    });

    if (p.isCancel(selection)) {
      p.outro('Cancelled. No components added.');
      return;
    }

    selectedComponents = selection as string[];
  }

  const spinner = p.spinner();

  for (const component of selectedComponents) {
    spinner.start(`Adding ${component}`);

    // Simulate async fetch — real implementation would download from registry
    await simulateDelay(300);

    const destDir = join(config.outDir, component);
    const ext = config.typescript ? 'ts' : 'js';
    const files = [
      join(destDir, `index.${ext}`),
      join(destDir, `${component}.${ext}`),
      join(destDir, `${component}.styles.${ext}`),
    ];

    spinner.stop(`Added ${component}`);

    p.log.info(
      [
        `  Registry : ${config.registry}`,
        `  Destination: ${destDir}`,
        `  Files that would be written:`,
        ...files.map((f) => `    - ${f}`),
        '',
        `  Note: Registry fetch is not yet implemented.`,
        `  In a production release, files would be downloaded from ${config.registry}/components/${component}.`,
      ].join('\n'),
    );
  }

  const componentList = selectedComponents.join(', ');
  p.outro(
    selectedComponents.length === 1
      ? `Component ${componentList} added successfully.`
      : `Components added: ${componentList}.`,
  );
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Re-export for convenience
export { getComponentDescription };
