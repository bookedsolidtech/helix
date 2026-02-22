#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTypeScriptTools } from './tools.js';

const server = new Server(
  {
    name: 'typescript-diagnostics',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

registerTypeScriptTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[typescript-diagnostics] MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
