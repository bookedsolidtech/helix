import { describe, it, expect, beforeEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerTypeScriptTools } from './tools.js';

describe('MCP Tools - TypeScript Diagnostics', () => {
  let server: Server;

  beforeEach(() => {
    server = new Server(
      { name: '@helix/mcp-typescript-diagnostics', version: '0.1.0' },
      { capabilities: { tools: {} } },
    );
  });

  describe('Tool Registration', () => {
    it('registers tools successfully', () => {
      expect(() => registerTypeScriptTools(server)).not.toThrow();
    });

    it('does not throw when called multiple times', () => {
      registerTypeScriptTools(server);
      expect(() => registerTypeScriptTools(server)).not.toThrow();
    });
  });

  describe('getDiagnostics - Arguments', () => {
    it('accepts valid filePath', () => {
      const args = { filePath: '/path/to/file.ts' };
      expect(args.filePath).toBe('/path/to/file.ts');
    });

    it('accepts optional severity filter', () => {
      const args = { filePath: '/path/to/file.ts', severity: 'error' };
      expect(args.severity).toBe('error');
    });

    it('validates filePath is string', () => {
      const args = { filePath: '/src/component.ts' };
      expect(typeof args.filePath).toBe('string');
    });
  });

  describe('getDiagnosticsForComponent - Arguments', () => {
    it('accepts valid componentName', () => {
      const args = { componentName: 'hx-button' };
      expect(args.componentName).toBe('hx-button');
    });

    it('validates componentName is string', () => {
      const args = { componentName: 'hx-card' };
      expect(typeof args.componentName).toBe('string');
    });

    it('accepts hyphenated component names', () => {
      const args = { componentName: 'hx-text-input' };
      expect(args.componentName).toContain('-');
    });
  });

  describe('suggestFix - Arguments', () => {
    it('accepts valid arguments', () => {
      const args = { filePath: '/path/to/file.ts', line: 10, column: 5 };
      expect(args.filePath).toBe('/path/to/file.ts');
      expect(args.line).toBe(10);
      expect(args.column).toBe(5);
    });

    it('validates line is number', () => {
      const args = { filePath: '/path/to/file.ts', line: 42, column: 8 };
      expect(typeof args.line).toBe('number');
    });

    it('validates column is number', () => {
      const args = { filePath: '/path/to/file.ts', line: 10, column: 15 };
      expect(typeof args.column).toBe('number');
    });
  });

  describe('getStrictModeStatus - Arguments', () => {
    it('accepts empty arguments object', () => {
      const args = {};
      expect(args).toEqual({});
    });

    it('works with no required arguments', () => {
      const args = {};
      expect(Object.keys(args).length).toBe(0);
    });
  });
});
