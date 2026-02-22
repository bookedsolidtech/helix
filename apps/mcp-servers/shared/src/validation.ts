import { z } from 'zod';

export const TagNameSchema = z
  .string()
  .regex(/^hx-[a-z0-9-]+$/, 'Tag name must match hx-* pattern (e.g., hx-button)');

export const BranchNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9/._-]+$/, 'Invalid branch name (alphanumeric, /, -, _, . only)');

export const FilePathSchema = z.string().min(1, 'File path cannot be empty');

export const LineNumberSchema = z.number().int().min(1, 'Line number must be positive');

export const DaysSchema = z
  .number()
  .int()
  .min(1, 'Days must be positive')
  .max(365, 'Days cannot exceed 365')
  .optional()
  .default(7);
