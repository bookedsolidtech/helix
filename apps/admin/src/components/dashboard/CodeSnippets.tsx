'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────

interface SnippetTab {
  framework: string;
  label: string;
  code: string;
  /** Pre-rendered HTML from server-side Shiki highlighting */
  highlightedHtml: string;
}

interface CodeSnippetsProps {
  tabs: SnippetTab[];
  className?: string;
}

// ── Framework Icons ──────────────────────────────────────────────────

function HtmlIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.75 1.75L2.625 11.375L7 12.25L11.375 11.375L12.25 1.75H1.75Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.375 4.375H9.625L9.1875 7.875H4.8125L5.25 9.625L7 10.0625L8.75 9.625"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReactIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="1.25" fill="currentColor" />
      <ellipse cx="7" cy="7" rx="5.5" ry="2.25" stroke="currentColor" strokeWidth="1" />
      <ellipse
        cx="7"
        cy="7"
        rx="5.5"
        ry="2.25"
        stroke="currentColor"
        strokeWidth="1"
        transform="rotate(60 7 7)"
      />
      <ellipse
        cx="7"
        cy="7"
        rx="5.5"
        ry="2.25"
        stroke="currentColor"
        strokeWidth="1"
        transform="rotate(120 7 7)"
      />
    </svg>
  );
}

function TwigIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 1.75C5.25 3.5 4.375 5.25 4.375 7C4.375 9.625 5.6875 11.375 7 12.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M7 1.75C8.75 3.5 9.625 5.25 9.625 7C9.625 9.625 8.3125 11.375 7 12.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M2.625 5.25H11.375" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path
        d="M3.0625 8.75H10.9375"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DrupalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 1.75C7 1.75 4.375 4.375 4.375 7.4375C4.375 8.89062 5.54688 10.9375 7 10.9375C8.45312 10.9375 9.625 8.89062 9.625 7.4375C9.625 4.375 7 1.75 7 1.75Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="11.375" r="0.875" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

const frameworkIcons: Record<string, ReactNode> = {
  html: <HtmlIcon />,
  react: <ReactIcon />,
  twig: <TwigIcon />,
  drupal: <DrupalIcon />,
};

// ── Copy Button ──────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent',
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
            <rect
              x="4"
              y="4"
              width="6.5"
              height="6.5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M8 4V2.5C8 1.94772 7.55228 1.5 7 1.5H2.5C1.94772 1.5 1.5 1.94772 1.5 2.5V7C1.5 7.55228 1.94772 8 2.5 8H4"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function CodeSnippets({ tabs, className }: CodeSnippetsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.framework ?? 'html');

  const activeSnippet = tabs.find((t) => t.framework === activeTab) ?? tabs[0];

  if (!activeSnippet) return null;

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-2">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.framework}
              onClick={() => setActiveTab(tab.framework)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative min-h-[44px]',
                activeTab === tab.framework
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70',
              )}
            >
              {frameworkIcons[tab.framework]}
              {tab.label}
              {activeTab === tab.framework && (
                <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        <div className="pr-1">
          <CopyButton text={activeSnippet.code} />
        </div>
      </div>

      {/* Code panel */}
      <div className="relative">
        <div
          className="overflow-x-auto p-5 text-sm leading-relaxed [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:!p-0 [&_code]:!bg-transparent [&_.shiki]:!bg-transparent"
          dangerouslySetInnerHTML={{ __html: activeSnippet.highlightedHtml }}
        />
      </div>
    </div>
  );
}

export type { SnippetTab, CodeSnippetsProps };
