/**
 * Server-side syntax highlighting using Shiki.
 *
 * Produces pre-rendered HTML that is passed to the client CodeSnippets
 * component via dangerouslySetInnerHTML. This avoids shipping Shiki's
 * WASM + grammar bundle to the browser.
 *
 * Uses a singleton highlighter instance with lazy initialization.
 */

import { createHighlighter, type Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark-default'],
      langs: ['html', 'tsx', 'twig', 'typescript'],
    });
  }
  return highlighterPromise;
}

/**
 * Maps snippet language keys to Shiki grammar IDs.
 */
function resolveLanguage(language: string): string {
  const map: Record<string, string> = {
    html: 'html',
    tsx: 'tsx',
    twig: 'twig',
    typescript: 'typescript',
    js: 'typescript',
  };
  return map[language] ?? 'html';
}

/**
 * Highlights a code string and returns an HTML string.
 * Falls back to a plain <pre><code> block if Shiki fails.
 */
export async function highlightCode(code: string, language: string): Promise<string> {
  try {
    const highlighter = await getHighlighter();
    const lang = resolveLanguage(language);

    return highlighter.codeToHtml(code, {
      lang,
      theme: 'github-dark-default',
    });
  } catch {
    // Graceful fallback: plain preformatted text
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<pre><code>${escaped}</code></pre>`;
  }
}
