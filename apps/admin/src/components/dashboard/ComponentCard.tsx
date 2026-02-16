'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScoreBar } from './ScoreBadge';
import { cn } from '@/lib/utils';
import { getStorybookUrl, getDocsUrl } from '@/lib/env';
import type { ComponentHealth } from '@/lib/health-scorer';
import type { ComponentTestSummary } from '@/lib/test-results-reader';

interface ComponentCardProps {
  health: ComponentHealth;
  testSummary?: ComponentTestSummary | null;
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    case 'B':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    case 'C':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    case 'D':
      return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
    default:
      return 'text-red-400 bg-red-400/10 border-red-400/30';
  }
}

export function ComponentCard({ health }: ComponentCardProps) {
  return (
    <Link href={`/components/${health.tagName}`} className="block group">
      <Card className="flex flex-col transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-mono">&lt;{health.tagName}&gt;</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{health.className}</p>
            </div>
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg border text-lg font-bold shrink-0',
                getGradeColor(health.grade),
              )}
            >
              {health.grade}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Health Score</span>
            <span className="font-bold tabular-nums">{health.overallScore}/100</span>
          </div>

          {health.dimensions
            .filter((d) => d.measured && d.score !== null)
            .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
            .slice(0, 3)
            .map((dimension) => (
              <ScoreBar key={dimension.name} score={dimension.score ?? 0} label={dimension.name} />
            ))}
        </CardContent>
        {/* Footer buttons — stopPropagation prevents Link from capturing clicks */}
        <CardFooter
          className="grid grid-cols-3 gap-2 pt-0 relative z-10"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              window.location.href = `/components/${health.tagName}`;
            }}
            className={cn(
              'inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
              'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
            )}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => {
              if (health.storyCoverage)
                window.open(
                  getStorybookUrl(health.tagName, 'docs'),
                  '_blank',
                  'noopener,noreferrer',
                );
            }}
            className={cn(
              'inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              health.storyCoverage
                ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 cursor-pointer'
                : 'bg-muted text-muted-foreground/50 border border-border cursor-default',
            )}
          >
            Story
          </button>
          <button
            type="button"
            onClick={() => {
              if (health.docsCoverage)
                window.open(getDocsUrl(health.tagName), '_blank', 'noopener,noreferrer');
            }}
            className={cn(
              'inline-flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              health.docsCoverage
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 cursor-pointer'
                : 'bg-muted text-muted-foreground/50 border border-border cursor-default',
            )}
          >
            Docs
          </button>
        </CardFooter>
      </Card>
    </Link>
  );
}
