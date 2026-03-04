import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runAdd } from './commands/add.js';
import { runDiff } from './commands/diff.js';
import { runUpdate } from './commands/update.js';

const program = new Command();

program
  .name('helix')
  .description('Helix DS CLI — copy components into your project')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize project with Helix DS configuration')
  .action(async () => {
    await runInit();
  });

program
  .command('add [component]')
  .description(
    'Copy a component into your project. Omit the component name for an interactive selector.',
  )
  .action(async (component: string | undefined) => {
    await runAdd(component);
  });

program
  .command('diff <component>')
  .description('Show diff between your local component and the upstream version')
  .action(async (component: string) => {
    await runDiff(component);
  });

program
  .command('update <component>')
  .description('Update a component to the latest upstream version')
  .action(async (component: string) => {
    await runUpdate(component);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
