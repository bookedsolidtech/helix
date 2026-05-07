import * as React from 'react';

/**
 * React hooks for reading resolved CSS custom property values from the
 * active cascade.
 *
 * These hooks exist because the docs MDX components (TokenSwatchGrid,
 * SurfaceCard, ContrastMatrix) used to read tokens at module-evaluation
 * time from `@helixui/tokens`'s static `tokenEntries`/`tokenMap`. That
 * shape only reflects the Apex/light defaults — when the Storybook
 * toolbar flips brand→Meridian or theme→dark, the *swatch backgrounds*
 * change (because the underlying `var(--hx-color-*)` is reactive in CSS)
 * but the *displayed hex labels* and *computed contrast ratios* stay
 * frozen at the build-time defaults.
 *
 * Reading from `getComputedStyle(document.documentElement)` instead
 * lets the labels follow the toolbar live. A MutationObserver on the
 * `data-theme` and `data-brand` attributes (which the preview / manager
 * head scripts toggle on `<html>`) is the cheapest way to be notified
 * when the cascade has changed, without polling on every paint.
 *
 * SSR / build-time:
 *   Storybook's MDX docs render is client-only, but the Vite build still
 *   evaluates these modules during prerender. All DOM access is guarded
 *   by `typeof window === 'undefined'` and lazy-initialized so the hook
 *   never reaches for `document`/`window` outside the browser.
 */

const CASCADE_ATTRS = ['data-theme', 'data-brand'];

function readToken(tokenName: string, target: HTMLElement | null): string {
  if (typeof window === 'undefined') return '';
  const el = target ?? document.documentElement;
  return getComputedStyle(el).getPropertyValue(tokenName).trim();
}

/**
 * Subscribe to the resolved value of a single CSS custom property in
 * the active cascade. Returns the empty string during SSR.
 */
export function useResolvedToken(tokenName: string, target?: HTMLElement | null): string {
  const [value, setValue] = React.useState<string>(() => readToken(tokenName, target ?? null));

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      setValue(readToken(tokenName, target ?? null));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: CASCADE_ATTRS,
    });
    return () => observer.disconnect();
  }, [tokenName, target]);

  return value;
}

/**
 * Subscribe to a stable list of CSS custom properties. Returns a frozen
 * array of resolved values whose indexes mirror the input. Re-reads on
 * every `data-theme` / `data-brand` mutation on `<html>`.
 *
 * Pass a referentially stable token list (via `useMemo` in the caller)
 * to avoid re-subscribing on every render.
 */
export function useResolvedTokens(
  tokenNames: readonly string[],
  target?: HTMLElement | null,
): readonly string[] {
  const [values, setValues] = React.useState<readonly string[]>(() =>
    tokenNames.map((name) => readToken(name, target ?? null)),
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      setValues(tokenNames.map((name) => readToken(name, target ?? null)));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: CASCADE_ATTRS,
    });
    return () => observer.disconnect();
    // tokenNames is a readonly array; callers are expected to memoize it.
  }, [tokenNames, target]);

  return values;
}

/**
 * One-shot synchronous read for non-React call sites that already know
 * they're inside an effect. Returns the empty string during SSR.
 */
export function readResolvedToken(tokenName: string, target?: HTMLElement | null): string {
  return readToken(tokenName, target ?? null);
}
