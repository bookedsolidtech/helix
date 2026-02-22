#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerCemTools } from './tools.js';

const server = new Server(
  {
    name: 'cem-analyzer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

registerCemTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[cem-analyzer] MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
