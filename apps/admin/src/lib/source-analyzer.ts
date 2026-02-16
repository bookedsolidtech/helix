/**
 * Source file analyzer.
 * Reads component source files for display and analysis in the admin dashboard.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { getComponentDirectory } from './cem-parser';

export interface SourceInfo {
  tagName: string;
  filePath: string;
  relativePath: string;
  exists: boolean;
  lineCount: number;
  sizeBytes: number;
  lastModified: Date | null;
  hasStyles: boolean;
  hasStories: boolean;
  hasIndex: boolean;
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), '../../packages/hx-library');
}

export function getSourceInfo(tagName: string): SourceInfo {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const componentDir = resolve(libRoot, `src/components/${dir}`);
  const mainFile = resolve(componentDir, `${tagName}.ts`);
  const stylesFile = resolve(componentDir, `${tagName}.styles.ts`);
  const storiesFile = resolve(componentDir, `${dir}.stories.ts`);
  const indexFile = resolve(componentDir, 'index.ts');

  const fileExists = existsSync(mainFile);
  let lineCount = 0;
  let sizeBytes = 0;
  let lastModified: Date | null = null;

  if (fileExists) {
    const content = readFileSync(mainFile, 'utf-8');
    lineCount = content.split('\n').length;
    const stat = statSync(mainFile);
    sizeBytes = stat.size;
    lastModified = stat.mtime;
  }

  return {
    tagName,
    filePath: mainFile,
    relativePath: `src/components/${dir}/${tagName}.ts`,
    exists: fileExists,
    lineCount,
    sizeBytes,
    lastModified,
    hasStyles: existsSync(stylesFile),
    hasStories: existsSync(storiesFile),
    hasIndex: existsSync(indexFile),
  };
}

export function getSourceContent(tagName: string): string | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const mainFile = resolve(libRoot, `src/components/${dir}/${tagName}.ts`);
  try {
    return readFileSync(mainFile, 'utf-8');
  } catch {
    return null;
  }
}

export async function getAllSourceInfo(): Promise<SourceInfo[]> {
  const { getAllComponentNames } = await import('./cem-parser');
  const names = getAllComponentNames();
  return names.map(getSourceInfo);
}
