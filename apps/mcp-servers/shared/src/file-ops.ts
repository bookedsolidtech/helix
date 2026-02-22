import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, normalize } from 'node:path';
import { z } from 'zod';
import { MCPError, ErrorCategory } from './error-handling.js';

export class SafeFileOperations {
  constructor(private allowedRoot: string) {}

  validatePath(filePath: string): string {
    const normalized = normalize(filePath);
    const absolute = resolve(this.allowedRoot, normalized);
    const rel = relative(this.allowedRoot, absolute);

    if (rel.startsWith('..') || rel === '') {
      throw new MCPError(`Path traversal detected: ${filePath}`, ErrorCategory.Security);
    }

    return absolute;
  }

  readFile(filePath: string): string {
    const validated = this.validatePath(filePath);

    if (!existsSync(validated)) {
      throw new MCPError(`File not found: ${filePath}`, ErrorCategory.UserInput);
    }

    try {
      return readFileSync(validated, 'utf-8');
    } catch (error) {
      throw new MCPError(
        `Failed to read file: ${filePath}`,
        ErrorCategory.System,
        error instanceof Error ? error : undefined,
      );
    }
  }

  readJSON<T>(filePath: string, schema: z.ZodSchema<T>): T {
    const content = this.readFile(filePath);

    try {
      const parsed = JSON.parse(content);
      return schema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new MCPError(
          `Invalid JSON structure in ${filePath}: ${error.message}`,
          ErrorCategory.UserInput,
        );
      }
      throw new MCPError(
        `Failed to parse JSON in ${filePath}`,
        ErrorCategory.System,
        error instanceof Error ? error : undefined,
      );
    }
  }

  fileExists(filePath: string): boolean {
    try {
      const validated = this.validatePath(filePath);
      return existsSync(validated);
    } catch {
      return false;
    }
  }
}
