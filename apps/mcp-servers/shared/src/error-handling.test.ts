/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPError, ErrorCategory, handleToolError } from './error-handling.js';

describe('Error Handling - MCPError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('MCPError Construction', () => {
    it('should create error with message and category', () => {
      const error = new MCPError('Test error', ErrorCategory.UserInput);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(MCPError);
      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.UserInput);
      expect(error.name).toBe('MCPError');
    });

    it('should optionally include cause', () => {
      const cause = new Error('Original error');
      const error = new MCPError('Test error', ErrorCategory.System, cause);

      expect(error.cause).toBe(cause);
    });

    it('should have stack trace', () => {
      const error = new MCPError('Test error', ErrorCategory.UserInput);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('MCPError');
    });
  });

  describe('handleToolError - Error Categorization', () => {
    it('should handle UserInput errors without logging stack', () => {
      const error = new MCPError('Invalid input', ErrorCategory.UserInput);

      const response = handleToolError(error);

      expect(response.content[0]?.text).toContain('[USER_INPUT]');
      expect(response.content[0]?.text).toContain('Invalid input');
      expect(response.isError).toBe(true);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle System errors with logging', () => {
      const error = new MCPError('Database connection failed', ErrorCategory.System);

      const response = handleToolError(error);

      expect(response.content[0]?.text).toContain('[SYSTEM]');
      expect(response.content[0]?.text).toContain('Database connection failed');
      expect(response.isError).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[MCP Error]',
        expect.stringContaining('MCPError'),
      );
    });

    it('should handle Security errors with logging', () => {
      const error = new MCPError('Path traversal detected', ErrorCategory.Security);

      const response = handleToolError(error);

      expect(response.content[0]?.text).toContain('[SECURITY]');
      expect(response.content[0]?.text).toContain('Path traversal detected');
      expect(response.isError).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle non-MCPError exceptions', () => {
      const error = new Error('Unexpected error');

      const response = handleToolError(error);

      expect(response.content[0]?.text).toBe('Internal server error. Check logs.');
      expect(response.isError).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Unexpected Error]', error);
    });

    it('should handle string errors', () => {
      const response = handleToolError('Something went wrong');

      expect(response.content[0]?.text).toBe('Internal server error. Check logs.');
      expect(response.isError).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Unexpected Error]', 'Something went wrong');
    });

    it('should handle null/undefined errors', () => {
      const responseNull = handleToolError(null);
      const responseUndef = handleToolError(undefined);

      expect(responseNull.content[0]?.text).toBe('Internal server error. Check logs.');
      expect(responseUndef.content[0]?.text).toBe('Internal server error. Check logs.');
    });

    it('should handle errors with complex objects', () => {
      const complexError = { message: 'Complex error', code: 500, nested: { data: 'test' } };

      const response = handleToolError(complexError);

      expect(response.isError).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Unexpected Error]', complexError);
    });
  });

  describe('ANTAGONISTIC: Edge Cases', () => {
    it('should handle circular reference errors safely', () => {
      const circularError: any = { message: 'Circular' };
      circularError.self = circularError;

      // Should not crash with circular reference
      expect(() => handleToolError(circularError)).not.toThrow();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(10000);
      const error = new MCPError(longMessage, ErrorCategory.UserInput);

      const response = handleToolError(error);

      expect(response.content[0]?.text).toContain(longMessage);
      // Should not crash or truncate (that's MCP client's job)
    });

    it('should handle errors with special characters', () => {
      const specialChars = 'Error: <script>alert("xss")</script>\n\t\r\0';
      const error = new MCPError(specialChars, ErrorCategory.UserInput);

      const response = handleToolError(error);

      // Should preserve the exact message (sanitization is client's responsibility)
      expect(response.content[0]?.text).toContain(specialChars);
    });

    it('should handle errors with unicode', () => {
      const unicodeError = new MCPError('错误: 文件未找到 🚨', ErrorCategory.UserInput);

      const response = handleToolError(unicodeError);

      expect(response.content[0]?.text).toContain('错误: 文件未找到 🚨');
    });
  });

  describe('Error Categories - Semantic Correctness', () => {
    it('should use UserInput for invalid arguments', () => {
      const error = new MCPError('Invalid tag name', ErrorCategory.UserInput);
      expect(error.category).toBe(ErrorCategory.UserInput);
    });

    it('should use System for infrastructure failures', () => {
      const error = new MCPError('Failed to read file', ErrorCategory.System);
      expect(error.category).toBe(ErrorCategory.System);
    });

    it('should use Security for malicious attempts', () => {
      const error = new MCPError('Command injection detected', ErrorCategory.Security);
      expect(error.category).toBe(ErrorCategory.Security);
    });
  });
});
