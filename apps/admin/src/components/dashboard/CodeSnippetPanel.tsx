'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────

type TabKey = 'html' | 'react' | 'twig' | 'drupal';

interface CodeSnippetPanelProps {
  snippets: {
    html: string;
    react: string;
    twig: string;
    drupal: string;
  };
  componentTag: string;
}

// ── Tab Configuration ────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; language: string }[] = [
  { key: 'html', label: 'HTML', language: 'HTML' },
  { key: 'react', label: 'React', language: 'JSX' },
  { key: 'twig', label: 'Twig', language: 'Twig' },
  { key: 'drupal', label: 'Drupal', language: 'PHP / Twig' },
];

// ── Lightweight Syntax Highlighting ──────────────────────────────────
// Minimal regex-based tokenizer for HTML/JSX/Twig snippets.
// This avoids pulling in a heavy syntax highlighting library for what
// are short, predictable code snippets.

interface Token {
  type: 'tag' | 'attr-name' | 'attr-value' | 'comment' | 'twig' | 'string' | 'text';
  value: string;
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  // Combined pattern matches in priority order:
  // 1. Twig delimiters and expressions: {{ ... }}, {% ... %}, {# ... #}
  // 2. HTML comments: <!-- ... -->
  // 3. HTML/JSX tags: <tagName ... > or </tagName>
  // 4. Attribute name=value pairs inside tags context (handled separately)
  // 5. Plain text
  const pattern =
    /(\{[{%#][\s\S]*?[}%#]\})|(<!--[\s\S]*?-->)|(<\/?[\w-]+(?:\s[^>]*)?\s*\/?>)|([^<{]+)/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code)) !== null) {
    const [full, twig, comment, tag, text] = match;

    if (twig) {
      tokens.push({ type: 'twig', value: twig });
    } else if (comment) {
      tokens.push({ type: 'comment', value: comment });
    } else if (tag) {
      // Parse the tag into sub-tokens
      tokenizeTag(tag, tokens);
    } else if (text) {
      tokens.push({ type: 'text', value: text });
    } else if (full) {
      tokens.push({ type: 'text', value: full });
    }
  }

  return tokens;
}

function tokenizeTag(tag: string, tokens: Token[]): void {
  // Match the opening part: < or </ plus the tag name
  const openMatch = tag.match(/^(<\/?)([\w-]+)/);
  if (!openMatch) {
    tokens.push({ type: 'text', value: tag });
    return;
  }

  tokens.push({ type: 'tag', value: openMatch[1] });
  tokens.push({ type: 'tag', value: openMatch[2] });

  // The remainder after tag name, before closing > or />
  const rest = tag.slice(openMatch[0].length);

  // Parse attributes from the rest
  const _attrPattern = /([\s]+)|([\w-]+(?:=)?)("[^"]*"|'[^']*'|\{[^}]*\})|(\/>|>)/g;
  // More robust approach: just walk through the rest character by character
  // matching attribute patterns
  const simpleAttrPattern = /(\s+)|([\w@:.-]+)(?:=(["'])([^]*?)\3|=(\{[^}]*\}))?|(\/>|>)/g;

  let attrMatch: RegExpExecArray | null;
  let lastIndex = 0;

  while ((attrMatch = simpleAttrPattern.exec(rest)) !== null) {
    const [full, whitespace, attrName, , attrValue, jsxValue, closing] = attrMatch;

    // Any unmatched text between lastIndex and current match
    if (attrMatch.index > lastIndex) {
      tokens.push({ type: 'text', value: rest.slice(lastIndex, attrMatch.index) });
    }
    lastIndex = attrMatch.index + full.length;

    if (whitespace) {
      tokens.push({ type: 'text', value: whitespace });
    } else if (attrName) {
      if (attrValue !== undefined) {
        tokens.push({ type: 'attr-name', value: attrName });
        tokens.push({ type: 'text', value: '=' });
        tokens.push({ type: 'attr-value', value: `"${attrValue}"` });
      } else if (jsxValue !== undefined) {
        tokens.push({ type: 'attr-name', value: attrName });
        tokens.push({ type: 'text', value: '=' });
        tokens.push({ type: 'twig', value: jsxValue });
      } else {
        // Boolean attribute
        tokens.push({ type: 'attr-name', value: attrName });
      }
    } else if (closing) {
      tokens.push({ type: 'tag', value: closing });
    }
  }

  // Any remaining text
  if (lastIndex < rest.length) {
    tokens.push({ type: 'tag', value: rest.slice(lastIndex) });
  }
}

function renderTokens(tokens: Token[]): React.ReactNode[] {
  return tokens.map((token, i) => {
    const key = `${i}-${token.type}`;
    switch (token.type) {
      case 'tag':
        return (
          <span key={key} className="text-pink-400">
            {token.value}
          </span>
        );
      case 'attr-name':
        return (
          <span key={key} className="text-sky-300">
            {token.value}
          </span>
        );
      case 'attr-value':
        return (
          <span key={key} className="text-amber-300">
            {token.value}
          </span>
        );
      case 'string':
        return (
          <span key={key} className="text-amber-300">
            {token.value}
          </span>
        );
      case 'comment':
        return (
          <span key={key} className="text-gray-500 italic">
            {token.value}
          </span>
        );
      case 'twig':
        return (
          <span key={key} className="text-emerald-400">
            {token.value}
          </span>
        );
      case 'text':
      default:
        return (
          <span key={key} className="text-gray-300">
            {token.value}
          </span>
        );
    }
  });
}

// ── Code Block Component ─────────────────────────────────────────────

function HighlightedCode({ code }: { code: string }) {
  const _tokens = tokenize(code);
  const lines = code.split('\n');
  const _lineCount = lines.length;

  // Re-tokenize per line for line-number alignment
  return (
    <div className="flex text-[13px] leading-6">
      {/* Line numbers */}
      <div
        className="select-none pr-4 text-right text-muted-foreground/40 font-mono border-r border-border/30 mr-4 shrink-0"
        aria-hidden="true"
      >
        {lines.map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Code content */}
      <pre className="font-mono overflow-x-auto flex-1 min-w-0">
        <code>
          {lines.map((line, i) => (
            <div key={i}>{line.length > 0 ? renderTokens(tokenize(line)) : '\u00A0'}</div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ── Main Panel Component ─────────────────────────────────────────────

export function CodeSnippetPanel({ snippets, componentTag }: CodeSnippetPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('html');
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    const code = snippets[activeTab];
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [snippets, activeTab]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Reset copied state when switching tabs
  useEffect(() => {
    setCopied(false);
  }, [activeTab]);

  const activeTabConfig = TABS.find((t) => t.key === activeTab);

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">Code Snippets</h2>
        <span className="text-xs text-muted-foreground ml-1">
          Usage examples for &lt;{componentTag}&gt;
        </span>
      </div>

      {/* Code Window */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {/* macOS-style Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[oklch(0.15_0_0)] border-b border-border">
          {/* Traffic light dots */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>
            <span className="text-xs text-muted-foreground font-mono ml-2">
              {activeTabConfig?.language ?? 'Code'}
            </span>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              copied
                ? 'text-emerald-400 bg-emerald-400/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
            aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-border bg-[oklch(0.16_0_0)]">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-4 py-2 text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                activeTab === tab.key
                  ? 'text-foreground bg-card'
                  : 'text-muted-foreground hover:text-foreground/80 hover:bg-[oklch(0.19_0_0)]',
              )}
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`snippet-panel-${tab.key}`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Code Content */}
        {TABS.map((tab) => (
          <div
            key={tab.key}
            id={`snippet-panel-${tab.key}`}
            role="tabpanel"
            aria-labelledby={`snippet-tab-${tab.key}`}
            className={cn('p-4 bg-[oklch(0.12_0_0)]', activeTab === tab.key ? 'block' : 'hidden')}
          >
            <HighlightedCode code={snippets[tab.key]} />
          </div>
        ))}
      </div>
    </div>
  );
}
