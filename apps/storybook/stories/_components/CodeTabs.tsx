import * as React from 'react';
import { CodeBlock, type CodeBlockLanguage } from './CodeBlock';

/**
 * One entry in a `<CodeTabs>` strip. Mirrors `CodeBlockProps` with the
 * label that drives the tab UI.
 */
export interface CodeTab {
  /** Visible label on the tab pill (e.g. "React", "HTML", "Web Component"). */
  label: string;
  /** Shiki language id for syntax highlighting. */
  language: CodeBlockLanguage;
  /** Source string for this tab. */
  code: string;
  /** Optional filename, rendered in the editor chrome below the tab strip. */
  filename?: string;
}

export interface CodeTabsProps {
  /** Tabs to render. Order is the visual tab strip order. */
  tabs: CodeTab[];
  /** Index of the tab to show on first render. Clamped to a valid range. */
  defaultTab?: number;
  /**
   * When provided, the active tab is persisted to localStorage and reflected
   * in the URL via `?codetab-{persistKey}=…`. Cross-page tabs sharing the
   * same key sync — e.g. a "React vs HTML" preference applies everywhere.
   */
  persistKey?: string;
  /** Toggles the copy button on the active tab's CodeBlock. */
  showCopy?: boolean;
}

/**
 * Resolve the initial tab index using (URL > localStorage > defaultTab > 0).
 * SSR-safe: returns the default during the first render and the effect
 * below promotes the persisted value once the client has hydrated.
 */
function resolveInitialIndex(
  tabs: CodeTab[],
  defaultTab: number | undefined,
  persistKey: string | undefined,
): number {
  const fallback = clampIndex(defaultTab ?? 0, tabs.length);
  if (typeof window === 'undefined' || !persistKey) return fallback;

  // 1. URL query param wins (deep links should override stored prefs).
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get(`codetab-${persistKey}`);
    if (fromUrl != null) {
      const idx = matchTabByLabel(tabs, fromUrl);
      if (idx >= 0) return idx;
    }
  } catch {
    /* ignore — fall through */
  }

  // 2. localStorage shadow.
  try {
    const stored = window.localStorage.getItem(`helix:storybook:codetab:${persistKey}`);
    if (stored != null) {
      const idx = matchTabByLabel(tabs, stored);
      if (idx >= 0) return idx;
    }
  } catch {
    /* storage disabled — fall through */
  }
  return fallback;
}

function clampIndex(index: number, length: number): number {
  if (length === 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

function matchTabByLabel(tabs: CodeTab[], label: string): number {
  const target = label.toLowerCase();
  return tabs.findIndex((t) => t.label.toLowerCase() === target);
}

/**
 * `<CodeTabs>` — multi-syntax code display with a tab strip above a single
 * `<CodeBlock>`. The tab strip shares the dark editor chrome with the body
 * so the entire unit reads as one editor.
 *
 * Accessibility: implements the WAI-ARIA tabs pattern (manual activation).
 * Tabs are keyboard navigable via Left/Right arrows; Home/End jump to ends.
 * Activation is on click or Space/Enter — arrow keys move focus only,
 * matching the "manual activation" pattern preferred when activation has
 * a noticeable cost (here, re-running Shiki).
 */
export function CodeTabs({ tabs, defaultTab, persistKey, showCopy = true }: CodeTabsProps) {
  const [active, setActive] = React.useState<number>(() =>
    resolveInitialIndex(tabs, defaultTab, persistKey),
  );
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const groupId = React.useId();

  // Persist active tab when it changes (after first render — initial value
  // already came from storage, this writes back any user action).
  React.useEffect(() => {
    if (!persistKey || typeof window === 'undefined') return;
    const label = tabs[active]?.label;
    if (!label) return;
    try {
      window.localStorage.setItem(`helix:storybook:codetab:${persistKey}`, label);
    } catch {
      /* storage disabled */
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(`codetab-${persistKey}`, label.toLowerCase());
      window.history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  }, [active, persistKey, tabs]);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const last = tabs.length - 1;
      let next = index;
      switch (event.key) {
        case 'ArrowRight':
          next = index === last ? 0 : index + 1;
          break;
        case 'ArrowLeft':
          next = index === 0 ? last : index - 1;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = last;
          break;
        default:
          return;
      }
      event.preventDefault();
      tabRefs.current[next]?.focus();
    },
    [tabs.length],
  );

  if (tabs.length === 0) return null;
  const safeActive = clampIndex(active, tabs.length);
  const current = tabs[safeActive];
  // Defensive: clampIndex guarantees the index is in-range when tabs.length > 0,
  // but the array-access return type is still `T | undefined` under
  // `noUncheckedIndexedAccess`. Bail rather than non-null-assert.
  if (!current) return null;

  return (
    <div
      className="hx-docs-code-editor hx-docs-code-editor--tabbed"
      data-language={current.language}
    >
      <div role="tablist" aria-label="Code language" className="hx-docs-code-editor-tabs">
        {tabs.map((tab, idx) => {
          const isActive = idx === safeActive;
          const tabId = `${groupId}-tab-${idx}`;
          const panelId = `${groupId}-panel-${idx}`;
          return (
            <button
              key={`${tab.label}-${idx}`}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              id={tabId}
              role="tab"
              type="button"
              aria-controls={panelId}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className="hx-docs-code-editor-tab"
              data-active={isActive || undefined}
              onClick={() => setActive(idx)}
              onKeyDown={(e) => onKeyDown(e, idx)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${groupId}-panel-${safeActive}`}
        aria-labelledby={`${groupId}-tab-${safeActive}`}
        className="hx-docs-code-editor-tabpanel"
      >
        <CodeBlock
          code={current.code}
          language={current.language}
          filename={current.filename}
          showCopy={showCopy}
        />
      </div>
    </div>
  );
}
