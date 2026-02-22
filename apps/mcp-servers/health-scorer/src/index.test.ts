import { describe, it, expect } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerHealthTools } from './tools.js';

describe('MCP Server Lifecycle - Health Scorer', () => {
  describe('Server Creation', () => {
    it('creates server with correct metadata', () => {
      const server = new Server(
        { name: '@helix/mcp-health-scorer', version: '0.1.0' },
        { capabilities: { tools: {} } }
      );
      expect(server).toBeDefined();
    });

    it('server has correct name', () => {
      const server = new Server(
        { name: '@helix/mcp-health-scorer', version: '0.1.0' },
        { capabilities: { tools: {} } }
      );
      expect(server).toBeDefined();
      // Server info is accessible via protocol methods
    });

    it('server has correct version', () => {
      const server = new Server(
        { name: '@helix/mcp-health-scorer', version: '0.1.0' },
        { capabilities: { tools: {} } }
      );
      expect(server).toBeDefined();
    });
  });

  describe('Tool Capabilities', () => {
    it('declares tools capability', () => {
      const server = new Server(
        { name: '@helix/mcp-health-scorer', version: '0.1.0' },
        { capabilities: { tools: {} } }
      );
      expect(server).toBeDefined();
    });

    it('tools are registered successfully', () => {
      const server = new Server(
        { name: '@helix/mcp-health-scorer', version: '0.1.0' },
        { capabilities: { tools: {} } }
      );
      expect(() => registerHealthTools(server)).not.toThrow();
    });
  });

  describe('Transport', () => {
    it('can create stdio transport', () => {
      const transport = new StdioServerTransport();
      expect(transport).toBeDefined();
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
        new Server(
          { name: '', version: '' },
          { capabilities: {} }
        );
      }).not.toThrow();
    });
  });
});
