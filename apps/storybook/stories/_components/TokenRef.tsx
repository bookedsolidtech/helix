import * as React from 'react';

/**
 * TokenRef — inline click-to-copy chip for a token reference.
 *
 * Renders as a button styled to look like inline code. Click copies
 * `var(<token>)` (default) or the literal `value` prop to the clipboard
 * and flashes a "copied" affordance for 800ms.
 *
 * Use this anywhere a token name appears in prose, code blocks, or
 * tables so every token reference on the docs surface is copy-affordable
 * — not just swatches.
 *
 *   <TokenRef token="--hx-color-primary-600" />
 *     → button labelled "--hx-color-primary-600"; copies "var(--hx-color-primary-600)"
 *
 *   <TokenRef token="--hx-color-primary-600" copyValue="--hx-color-primary-600" />
 *     → copies the bare token name (no `var(...)` wrapping).
 *
 *   <TokenRef token="hx-button[variant='primary']" copyValue="hx-button[variant='primary']" />
 *     → renders + copies an arbitrary string (selector, snippet).
 */

export interface TokenRefProps {
  /** Token name or arbitrary string to display (e.g. `--hx-color-primary-600`). */
  token: string;
  /**
   * Optional override for the clipboard payload. Defaults to `var(<token>)`
   * when `token` starts with `--`, otherwise the bare `token` string.
   */
  copyValue?: string;
  /** Optional element variant — `'inline'` (default) or `'block'` for full-width chip. */
  variant?: 'inline' | 'block';
}

export function TokenRef({ token, copyValue, variant = 'inline' }: TokenRefProps) {
  const [copied, setCopied] = React.useState(false);
  const payload = copyValue ?? (token.startsWith('--') ? `var(${token})` : token);

  const handleCopy = React.useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 800);
  }, [payload]);

  return (
    <button
      type="button"
      className={`hx-docs-token-ref${variant === 'block' ? ' hx-docs-token-ref--block' : ''}${
        copied ? ' is-copied' : ''
      }`}
      onClick={handleCopy}
      title={`Copy ${payload}`}
      aria-label={`Copy ${payload} to clipboard`}
    >
      <span className="hx-docs-token-ref-label">{token}</span>
      <span className="hx-docs-token-ref-state" aria-hidden="true">
        {copied ? 'copied' : 'copy'}
      </span>
    </button>
  );
}
