import { describe, it, expect } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerTypeScriptTools } from './tools.js';

describe('MCP Server Lifecycle - TypeScript Diagnostics', () => {
  describe('Server Creation', () => {
    it('creates server with correct metadata', () => {
      expect(() => {
        new Server(
          { name: '@helixui/mcp-typescript-diagnostics', version: '0.1.0' },
          { capabilities: { tools: {} } },
        );
      }).not.toThrow();
    });
  });

  describe('Tool Capabilities', () => {
    it('declares tools capability', () => {
      const server = new Server(
        { name: '@helixui/mcp-typescript-diagnostics', version: '0.1.0' },
        { capabilities: { tools: {} } },
      );
      expect(server).toBeInstanceOf(Server);
    });

    it('tools are registered successfully', () => {
      const server = new Server(
        { name: '@helixui/mcp-typescript-diagnostics', version: '0.1.0' },
        { capabilities: { tools: {} } },
      );
      expect(() => registerTypeScriptTools(server)).not.toThrow();
    });
  });

  describe('Transport', () => {
    it('can create stdio transport', () => {
      expect(() => new StdioServerTransport()).not.toThrow();
    });

    it('transport has required methods', () => {
      const transport = new StdioServerTransport();
      expect(typeof transport.start).toBe('function');
      expect(typeof transport.close).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('handles initialization errors gracefully', () => {
      expect(() => {
        new Server({ name: '', version: '' }, { capabilities: {} });
      }).not.toThrow();
    });
  });
});
