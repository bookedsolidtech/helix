'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LibraryEntry, LibrarySource } from '@/lib/library-registry';
import { Pencil, Trash2 } from 'lucide-react';

interface LibraryCardProps {
  library: LibraryEntry;
  onEdit: (library: LibraryEntry) => void;
  onDelete: (library: LibraryEntry) => void;
}

function sourceBadgeClass(source: LibrarySource): string {
  switch (source) {
    case 'local':
      return 'border-blue-500/30 text-blue-400 bg-blue-500/10';
    case 'cdn':
      return 'border-purple-500/30 text-purple-400 bg-purple-500/10';
    case 'npm':
      return 'border-green-500/30 text-green-400 bg-green-500/10';
  }
}

function formatLastScored(lastScored: string | null): string {
  if (!lastScored) return 'Never scored';
  const date = new Date(lastScored);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function LibraryCard({ library, onEdit, onDelete }: LibraryCardProps): React.JSX.Element {
  const isProtected = library.isDefault;

  return (
    <Card className="flex flex-col transition-colors hover:border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground truncate">{library.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className="font-mono text-[10px] border-white/10 text-muted-foreground"
              >
                {library.id}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-[10px] font-semibold', sourceBadgeClass(library.source))}
              >
                {library.source}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(library)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              aria-label={`Edit ${library.name}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <div className="relative group">
              <button
                onClick={() => !isProtected && onDelete(library)}
                disabled={isProtected}
                className={cn(
                  'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
                  isProtected
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-muted-foreground hover:bg-red-500/10 hover:text-red-400',
                )}
                aria-label={
                  isProtected ? 'Cannot delete the default library' : `Delete ${library.name}`
                }
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {isProtected && (
                <div className="absolute right-0 top-full mt-1.5 z-10 hidden group-hover:block">
                  <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-muted-foreground shadow-lg whitespace-nowrap">
                    Default library cannot be deleted
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Prefix</span>
            <span className="font-mono text-xs bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5 text-foreground">
              {library.prefix}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Components</span>
            <span className="font-semibold tabular-nums text-foreground">
              {library.componentCount}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Last scored</span>
            <span
              className={cn(
                'text-xs',
                library.lastScored ? 'text-foreground' : 'text-muted-foreground/60 italic',
              )}
            >
              {formatLastScored(library.lastScored)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
