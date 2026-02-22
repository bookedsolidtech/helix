import { z } from 'zod';

export const TagNameSchema = z
  .string()
  .regex(/^hx-[a-z0-9-]+$/, 'Tag name must match hx-* pattern (e.g., hx-button)');

export const BranchNameSchema = z
  .string()
  .min(1, 'Branch name cannot be empty')
  .max(255, 'Branch name too long')
  .regex(/^[a-zA-Z0-9/._-]+$/, 'Invalid branch name (alphanumeric, /, -, _, . only)')
  .refine((name) => !name.includes('..'), {
    message: 'Branch name cannot contain ".." (path traversal)',
  })
  .refine((name) => !name.startsWith('/') && !name.endsWith('/'), {
    message: 'Branch name cannot start or end with /',
  })
  .refine((name) => !name.includes('//'), {
    message: 'Branch name cannot contain consecutive slashes',
  });

export const FilePathSchema = z
  .string()
  .min(1, 'File path cannot be empty')
  .refine(
    (path) => {
      // Block obvious path traversal attempts
      if (path.includes('..')) return false;
      // Block absolute paths starting with /
      if (path.startsWith('/')) return false;
      // Block null bytes (classic directory traversal attack)
      if (path.includes('\0')) return false;
      return true;
    },
    {
      message: 'Invalid file path: must be relative, no path traversal (../) or null bytes allowed',
    },
  );

export const LineNumberSchema = z.number().int().min(1, 'Line number must be positive');

export const DaysSchema = z
  .number()
  .int()
  .min(1, 'Days must be positive')
  .max(365, 'Days cannot exceed 365')
  .optional()
  .default(7);
