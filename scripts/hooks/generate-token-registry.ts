#!/usr/bin/env tsx
/**
 * Generate Token Registry from Source of Truth
 *
 * Parses packages/hx-tokens/dist/tokens.css to create a comprehensive
 * token registry categorizing all 301 tokens into:
 * - Primitive tokens (raw color scales, space-N, size-N)
 * - Semantic tokens (--hx-color-primary, --hx-spacing-md, etc.)
 * - Component tokens (--hx-button-*, --hx-card-*, etc.)
 *
 * This ensures the design-token-enforcement hook validates against
 * the actual token definitions, not hardcoded patterns.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TokenRegistry {
  primitive: {
    patterns: string[]; // Regex pattern strings (convert to RegExp at runtime)
    tokens: string[];
  };
  semantic: {
    patterns: string[]; // Regex pattern strings (convert to RegExp at runtime)
    tokens: string[];
  };
  component: {
    patterns: string[]; // Regex pattern strings (convert to RegExp at runtime)
    tokens: string[];
  };
  all: string[];
  metadata: {
    totalCount: number;
    primitiveCount: number;
    semanticCount: number;
    componentCount: number;
    generatedAt: string;
    sourceFile: string;
  };
}

/**
 * Parse tokens.css to extract all token definitions
 */
function parseTokensCSS(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8');
  const tokens: string[] = [];

  // Match all CSS custom property definitions: --hx-*: value;
  const tokenRegex = /^\s*(--hx-[a-z0-9-]+):\s*[^;]+;/gm;
  let match;

  while ((match = tokenRegex.exec(content)) !== null) {
    const token = match[1];
    if (token && !tokens.includes(token)) {
      tokens.push(token);
    }
  }

  return tokens.sort();
}

/**
 * Categorize a token as primitive, semantic, or component
 */
function categorizeToken(token: string): 'primitive' | 'semantic' | 'component' {
  // Primitive patterns - raw numbered scales
  const primitivePatterns = [
    // Color scales: 0, 50, 100-900, 950
    /^--hx-color-(?:primary|secondary|accent|neutral|success|warning|error|info)-(?:0|50|[1-9]00|950)$/,
    // Raw space scale: space-0 through space-64, space-px
    /^--hx-space-(?:0|[1-9][0-9]?|px)$/,
    // Raw size scale: size-4 through size-20
    /^--hx-size-(?:4|5|6|8|10|12|16|20)$/,
  ];

  for (const pattern of primitivePatterns) {
    if (pattern.test(token)) {
      return 'primitive';
    }
  }

  // Component tokens - specific component overrides
  const componentPatterns = [/^--hx-(?:input|button|card|modal|dropdown|tooltip)-/];

  for (const pattern of componentPatterns) {
    if (pattern.test(token)) {
      return 'component';
    }
  }

  // Everything else is semantic (public API)
  return 'semantic';
}

/**
 * Generate optimized regex patterns for each category
 * Returns string patterns that can be converted to RegExp at runtime
 */
function generatePatterns(tokens: string[]): string[] {
  if (tokens.length === 0) return [];

  // For efficiency with large token lists, create a single alternation pattern
  // Escape special regex characters in token names
  const escapedTokens = tokens.map((t) => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));

  // Create exact match pattern
  const pattern = `^(?:${escapedTokens.join('|')})$`;

  return [pattern];
}

/**
 * Generate token registry from source of truth
 */
export function generateTokenRegistry(tokensFilePath: string): TokenRegistry {
  const allTokens = parseTokensCSS(tokensFilePath);

  const primitive: string[] = [];
  const semantic: string[] = [];
  const component: string[] = [];

  // Categorize all tokens
  for (const token of allTokens) {
    const category = categorizeToken(token);
    if (category === 'primitive') {
      primitive.push(token);
    } else if (category === 'semantic') {
      semantic.push(token);
    } else {
      component.push(token);
    }
  }

  // Generate optimized patterns
  const registry: TokenRegistry = {
    primitive: {
      patterns: generatePatterns(primitive),
      tokens: primitive,
    },
    semantic: {
      patterns: generatePatterns(semantic),
      tokens: semantic,
    },
    component: {
      patterns: generatePatterns(component),
      tokens: component,
    },
    all: allTokens,
    metadata: {
      totalCount: allTokens.length,
      primitiveCount: primitive.length,
      semanticCount: semantic.length,
      componentCount: component.length,
      generatedAt: new Date().toISOString(),
      sourceFile: tokensFilePath,
    },
  };

  return registry;
}

/**
 * Write registry to JSON file
 */
export function writeRegistry(registry: TokenRegistry, outputPath: string): void {
  const json = JSON.stringify(registry, null, 2);
  writeFileSync(outputPath, json, 'utf-8');
  console.log(`[INFO] Generated token registry: ${outputPath}`);
  console.log(`[INFO] Total tokens: ${registry.metadata.totalCount}`);
  console.log(`[INFO] - Primitive: ${registry.metadata.primitiveCount}`);
  console.log(`[INFO] - Semantic: ${registry.metadata.semanticCount}`);
  console.log(`[INFO] - Component: ${registry.metadata.componentCount}`);
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const tokensPath = join(process.cwd(), 'packages/hx-tokens/dist/tokens.css');
  const outputPath = join(process.cwd(), 'scripts/hooks/token-registry.json');

  console.log('[INFO] Generating token registry from source of truth...');
  console.log(`[INFO] Source: ${tokensPath}`);

  const registry = generateTokenRegistry(tokensPath);
  writeRegistry(registry, outputPath);

  console.log('[SUCCESS] Token registry generated successfully');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('[ERROR] Failed to generate token registry:', error);
    process.exit(1);
  });
}
