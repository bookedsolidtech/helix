#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTools } from './tools.js';

const server = new Server(
  { name: '@helixui/mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[@helixui/mcp] MCP server running on stdio');
}

main().catch((error: unknown) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
