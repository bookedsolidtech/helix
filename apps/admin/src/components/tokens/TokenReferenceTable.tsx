'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { isHexColor, resolveTokenRef } from '@helixui/tokens/utils';
import { tokenMap } from '@helixui/tokens';
import type { TokenEntry } from '@helixui/tokens';

interface CategoryGroup {
  category: string;
  tokens: TokenEntry[];
  hasColors: boolean;
  hasRefs: boolean;
}

interface TokenReferenceTableProps {
  groups: CategoryGroup[];
}

const categoryLabels: Record<string, string> = {
  color: 'Colors',
  body: 'Body / Root',
  heading: 'Headings',
  space: 'Spacing',
  font: 'Typography',
  'line-height': 'Line Heights',
  'letter-spacing': 'Letter Spacing',
  border: 'Borders',
  shadow: 'Shadows',
  transition: 'Transitions',
  duration: 'Durations',
  easing: 'Easing',
  focus: 'Focus',
  state: 'State Layers',
  filter: 'Filters',
  transform: 'Transforms',
  container: 'Containers',
  input: 'Input Heights',
  divider: 'Dividers',
  'z-index': 'Z-Index',
  opacity: 'Opacity',
  size: 'Sizing',
  breakpoint: 'Breakpoints',
  'aspect-ratio': 'Aspect Ratios',
};

export function TokenReferenceTable({ groups }: TokenReferenceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const toggle = (category: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(groups.map((g) => g.category)));
  const collapseAll = () => setExpanded(new Set());

  const searchLower = search.toLowerCase();
  const filteredGroups = search
    ? groups
        .map((g) => ({
          ...g,
          tokens: g.tokens.filter(
            (t) =>
              t.name.toLowerCase().includes(searchLower) ||
              t.value.toLowerCase().includes(searchLower) ||
              t.group.toLowerCase().includes(searchLower),
          ),
        }))
        .filter((g) => g.tokens.length > 0)
    : groups;

  const totalShown = filteredGroups.reduce((sum, g) => sum + g.tokens.length, 0);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search tokens..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) {
              expandAll();
            }
          }}
          className="bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground w-64 focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">{totalShown} tokens</span>
          <button
            onClick={expandAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Expand all
          </button>
          <span className="text-border">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Category groups */}
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {filteredGroups.map((group) => {
          const isOpen = expanded.has(group.category);
          const label = categoryLabels[group.category] ?? group.category;

          // Group tokens by their sub-group for structured display
          const subgroups = new Map<string, TokenEntry[]>();
          for (const t of group.tokens) {
            const existing = subgroups.get(t.group) ?? [];
            existing.push(t);
            subgroups.set(t.group, existing);
          }

          return (
            <div key={group.category}>
              {/* Category header */}
              <button
                onClick={() => toggle(group.category)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
              >
                <span className="text-xs text-muted-foreground w-4 shrink-0">
                  {isOpen ? '\u25BC' : '\u25B6'}
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="flex-1" />
                {group.hasColors && (
                  <div className="flex gap-0.5 shrink-0">
                    {group.tokens
                      .filter((t) => isHexColor(resolveTokenRef(t.value, tokenMap)))
                      .slice(0, 8)
                      .map((t) => (
                        <span
                          key={t.name}
                          className="w-3 h-3 rounded-sm border border-border/50"
                          style={{ backgroundColor: resolveTokenRef(t.value, tokenMap) }}
                        />
                      ))}
                  </div>
                )}
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-8 text-right">
                  {group.tokens.length}
                </span>
              </button>

              {/* Expanded tokens */}
              {isOpen && (
                <div className="bg-secondary/20">
                  {Array.from(subgroups.entries()).map(([subgroup, tokens]) => (
                    <div key={subgroup}>
                      {/* Sub-group label (only if multiple sub-groups) */}
                      {subgroups.size > 1 && (
                        <div className="pl-11 pr-4 py-1.5 border-t border-border/30">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                            {subgroup}
                          </span>
                        </div>
                      )}
                      {tokens.map((token) => (
                        <div
                          key={token.name}
                          className="flex items-center gap-3 pl-11 pr-4 py-2 border-t border-border/20 hover:bg-secondary/30 transition-colors"
                        >
                          {/* Color swatch or empty space */}
                          <span className="w-4 h-4 shrink-0 flex items-center justify-center">
                            {(() => {
                              const resolved = resolveTokenRef(token.value, tokenMap);
                              return isHexColor(resolved) ? (
                                <span
                                  className="w-4 h-4 rounded-sm border border-border/50"
                                  style={{ backgroundColor: resolved }}
                                />
                              ) : null;
                            })()}
                          </span>

                          {/* Token name */}
                          <span className="font-mono text-xs text-foreground flex-1 min-w-0 truncate">
                            {token.name}
                          </span>

                          {/* Value */}
                          <span
                            className={cn(
                              'font-mono text-xs shrink-0 max-w-64 truncate text-right',
                              token.value.includes('var(')
                                ? 'text-blue-400'
                                : 'text-muted-foreground',
                            )}
                            title={token.value}
                          >
                            {token.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
