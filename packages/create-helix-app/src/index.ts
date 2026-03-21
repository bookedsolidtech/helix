#!/usr/bin/env node

import { runCLI } from './cli.js';

runCLI().catch((error) => {
  console.error(error);
  process.exit(1);
});
