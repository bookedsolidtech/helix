/**
 * Story Coverage Analyzer.
 * Parses story files and counts exported stories against expected component variants.
 * Replaces binary file-exists check with actual story-to-variant ratio.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getComponentDirectory, getComponentData } from "./cem-parser";

export interface StoryCoverageResult {
  tagName: string;
  score: number;
  storyCount: number;
  expectedVariants: number;
  storyNames: string[];
  variantSources: VariantSource[];
  detail: string;
}

export interface VariantSource {
  property: string;
  values: string[];
}

function getLibraryRoot(): string {
  return resolve(process.cwd(), "../../packages/wc-library");
}

function countExportedStories(storyContent: string): { count: number; names: string[] } {
  const names: string[] = [];

  // Match named exports: export const Primary: Story = ...
  const namedExports = storyContent.matchAll(
    /export\s+const\s+(\w+)\s*(?::\s*\w+)?\s*=/g
  );
  for (const match of namedExports) {
    const name = match[1];
    // Skip meta default export
    if (name === "default" || name === "meta") continue;
    names.push(name);
  }

  return { count: names.length, names };
}

function extractExpectedVariants(tagName: string): VariantSource[] {
  const data = getComponentData(tagName);
  if (!data) return [];

  const variants: VariantSource[] = [];

  for (const prop of data.properties) {
    // Look for union types like "'primary' | 'secondary' | 'ghost'"
    const unionMatch = prop.type.match(/^'[^']+'/);
    if (unionMatch) {
      const values = [...prop.type.matchAll(/'([^']+)'/g)].map((m) => m[1]);
      if (values.length >= 2) {
        variants.push({ property: prop.name, values });
      }
    }
  }

  return variants;
}

function calculateExpectedStoryCount(variants: VariantSource[]): number {
  // Base stories: Default + each variant value + key states (disabled, error, etc.)
  // Minimum expected = sum of all variant values + 1 (default) + 1 (composition/form)
  const variantCount = variants.reduce((sum, v) => sum + v.values.length, 0);
  // At minimum we expect: 1 default + variant values
  return Math.max(variantCount + 1, 3);
}

export function analyzeStoryCoverage(tagName: string): StoryCoverageResult | null {
  const libRoot = getLibraryRoot();
  const dir = getComponentDirectory(tagName);
  const storyPath = resolve(libRoot, `src/components/${dir}/${tagName}.stories.ts`);

  if (!existsSync(storyPath)) {
    return {
      tagName,
      score: 0,
      storyCount: 0,
      expectedVariants: 0,
      storyNames: [],
      variantSources: [],
      detail: "No story file found",
    };
  }

  let content: string;
  try {
    content = readFileSync(storyPath, "utf-8");
  } catch {
    return null;
  }

  const { count, names } = countExportedStories(content);
  const variantSources = extractExpectedVariants(tagName);
  const expectedVariants = calculateExpectedStoryCount(variantSources);

  // Score: ratio of actual stories to expected, capped at 100
  const ratio = expectedVariants > 0 ? count / expectedVariants : (count > 0 ? 1 : 0);
  const score = Math.min(Math.round(ratio * 100), 100);

  const detail = `${count} stories (expected ~${expectedVariants} for ${variantSources.length} variant properties)`;

  return {
    tagName,
    score,
    storyCount: count,
    expectedVariants,
    storyNames: names,
    variantSources,
    detail,
  };
}
