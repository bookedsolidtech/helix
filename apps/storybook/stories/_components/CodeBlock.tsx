import * as React from 'react';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';

/**
 * Supported Shiki languages for the helix docs surface. Bundle is pinned to
 * the languages we actually author against — every additional grammar adds
 * to the preview iframe weight.
 *
 * If you need to render a language outside this list, add it to the union
 * AND verify it loads correctly via Shiki's `bundledLanguages` map (see
 * https://shiki.style/languages).
 */
export type CodeBlockLanguage =
  | 'html'
  | 'js'
  | 'jsx'
  | 'ts'
  | 'tsx'
  | 'css'
  | 'mdx'
  | 'bash'
  | 'json';

/**
 * Theme: github-dark-dimmed (Shiki bundled). Picked over vitesse-dark and
 * tokyo-night because it tracks the de-facto VS Code default for the
 * majority of helix's enterprise audience and produces the lowest-saturation
 * tokens — which keeps focus on prose.
 *
 * Background: #22272e (pulled directly from the theme JSON). The editor
 * chrome below mirrors this hex so Shiki's inline `background-color`
 * style aligns with the wrapping header / tab strip.
 */
export const CODE_BLOCK_THEME = 'github-dark-dimmed' as const;
export const CODE_BLOCK_BACKGROUND = '#22272e' as const;

/**
 * Lazy-initialized Shiki highlighter pinned to ONLY the languages/themes we
 * actually use. This avoids pulling Shiki's full bundle (which would ship
 * grammars for wolfram, cpp, emacs-lisp, etc. into the Storybook iframe —
 * verified ~2 MB of unused chunks before this pinning).
 *
 * Stored as a module-level promise so concurrent CodeBlock mounts share a
 * single highlighter instance (Shiki's grammar registry is expensive).
 */
let highlighterPromise: Promise<HighlighterCore> | null = null;
function getHighlighter(): Promise<HighlighterCore> {
  if (highlighterPromise) return highlighterPromise;
  highlighterPromise = createHighlighterCore({
    themes: [import('@shikijs/themes/github-dark-dimmed')],
    langs: [
      import('@shikijs/langs/html'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/typescript'),
      import('@shikijs/langs/tsx'),
      import('@shikijs/langs/css'),
      import('@shikijs/langs/mdx'),
      import('@shikijs/langs/bash'),
      import('@shikijs/langs/json'),
    ],
    engine: createOnigurumaEngine(import('shiki/wasm')),
  });
  return highlighterPromise;
}

/**
 * Map our public `language` prop union to the underlying Shiki grammar id.
 * `js` and `ts` are aliases (Shiki ships them under `javascript` / `typescript`).
 */
const LANG_ALIAS: Record<CodeBlockLanguage, string> = {
  html: 'html',
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  css: 'css',
  mdx: 'mdx',
  bash: 'bash',
  json: 'json',
};

export interface CodeBlockProps {
  /** Source string to highlight. Whitespace preserved verbatim. */
  code: string;
  /** Shiki grammar id. Defaults to `tsx` when omitted. */
  language?: CodeBlockLanguage;
  /** Optional filename rendered flush-left in the editor chrome header. */
  filename?: string;
  /** Toggles the copy button. Defaults `true`. */
  showCopy?: boolean;
  /**
   * When provided, Shiki output is rendered immediately during SSR/initial
   * paint via this prebuilt HTML string. Reserved for the autodoc Source
   * integration which has access to a synchronous highlighter; MDX consumers
   * can leave this undefined and rely on the async client-side path.
   */
  prerenderedHtml?: string;
}

/**
 * Helix Storybook code-display primitive. Async-renders Shiki output into a
 * dark editor surface with header chrome (filename · language pill · copy).
 * Theme is locked to `github-dark-dimmed` regardless of the active Storybook
 * theme — code blocks are always dark, matching Stripe / Vercel / MDN docs.
 *
 * Accessibility:
 * - The copy button has an accessible name ("Copy code") via aria-label and
 *   announces state via aria-live polite region (sr-only span).
 * - `role="region"` on the wrapper with the filename (when present) as
 *   the accessible name lets AT users skip past code blocks.
 * - In `forced-colors` mode the chrome reverts to system colors so high-
 *   contrast users still see distinct surfaces; Shiki token colors are
 *   overridden by the UA, which is correct.
 */
export function CodeBlock({
  code,
  language = 'tsx',
  filename,
  showCopy = true,
  prerenderedHtml,
}: CodeBlockProps) {
  const [html, setHtml] = React.useState<string | null>(prerenderedHtml ?? null);
  const [copied, setCopied] = React.useState(false);
  const copyTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (prerenderedHtml) {
      setHtml(prerenderedHtml);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const highlighter = await getHighlighter();
        const out = highlighter.codeToHtml(code, {
          lang: LANG_ALIAS[language],
          theme: CODE_BLOCK_THEME,
        });
        if (!cancelled) setHtml(out);
      } catch {
        // Shiki failed to load grammar/theme — fall back to a plain <pre>
        // so users still see the source rather than a blank skeleton.
        if (!cancelled) {
          setHtml(`<pre class="shiki" tabindex="0"><code>${escapeHtml(code)}</code></pre>`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language, prerenderedHtml]);

  // Tear down the "copied" state timer on unmount so React state updates
  // don't fire after the component is gone.
  React.useEffect(
    () => () => {
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (copyTimerRef.current != null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard write blocked (insecure context, permissions). Silent
      // failure is acceptable here — users can still select the code.
    }
  }, [code]);

  // Wrapper provides the dark surface, header bar, and rounded corners.
  // Shiki's inline `background-color` matches CODE_BLOCK_BACKGROUND so the
  // header bar and code surface read as one unit.
  const headerLabelId = React.useId();
  const labelledById = filename ? headerLabelId : undefined;

  return (
    <div
      className="hx-docs-code-editor"
      role="region"
      aria-labelledby={labelledById}
      data-language={language}
    >
      <div className="hx-docs-code-editor-header">
        <div className="hx-docs-code-editor-filename" id={labelledById}>
          {filename ?? <span className="hx-docs-code-editor-filename-placeholder" aria-hidden />}
        </div>
        <div className="hx-docs-code-editor-meta">
          <span className="hx-docs-code-editor-language">{language}</span>
          {showCopy ? (
            <button
              type="button"
              className="hx-docs-code-editor-copy"
              onClick={onCopy}
              aria-label={copied ? 'Code copied to clipboard' : 'Copy code'}
              data-copied={copied || undefined}
            >
              <span aria-hidden="true">{copied ? 'Copied' : 'Copy'}</span>
              <span className="hx-docs-sr-only" aria-live="polite">
                {copied ? 'Code copied to clipboard' : ''}
              </span>
            </button>
          ) : null}
        </div>
      </div>
      <div
        className="hx-docs-code-editor-body"
        // Shiki output is server-trusted (we own the input string and the
        // grammar). dangerouslySetInnerHTML is the documented integration
        // path — the rendered HTML is a deliberately limited <pre><code>
        // tree with span class names for token colors.
        dangerouslySetInnerHTML={
          html
            ? { __html: html }
            : { __html: `<pre class="shiki shiki-loading"><code>${escapeHtml(code)}</code></pre>` }
        }
      />
    </div>
  );
}

/**
 * Minimal HTML entity escape for the loading-state fallback. Shiki's own
 * output is already escaped — this only covers the pre-highlighter paint.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
