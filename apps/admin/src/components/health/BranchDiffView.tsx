'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { McpHealthDiff } from '@/lib/mcp-client';

interface BranchDiffViewProps {
  diff: McpHealthDiff;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        No change
      </Badge>
    );
  }
  const positive = delta > 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-mono tabular-nums',
        positive
          ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
          : 'border-red-500/30 text-red-400 bg-red-500/10',
      )}
    >
      {positive ? '+' : ''}
      {delta}
    </Badge>
  );
}

export function BranchDiffView({ diff }: BranchDiffViewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Branch Health Diff</CardTitle>
            <CardDescription>
              Comparing current branch vs main for &lt;{diff.tagName}&gt;
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Score Delta</span>
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  diff.scoreDelta > 0
                    ? 'text-emerald-400'
                    : diff.scoreDelta < 0
                      ? 'text-red-400'
                      : 'text-muted-foreground',
                )}
              >
                {diff.scoreDelta > 0 ? '+' : ''}
                {diff.scoreDelta}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  diff.improved
                    ? 'border-emerald-500/30 text-emerald-400'
                    : diff.regressed
                      ? 'border-red-500/30 text-red-400'
                      : 'border-muted text-muted-foreground',
                )}
              >
                {diff.improved ? 'Improved' : diff.regressed ? 'Regressed' : 'Stable'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Base (main)</p>
            <p className="text-3xl font-bold tabular-nums">{diff.base.score}</p>
            <p className="text-xs text-muted-foreground mt-1">Grade: {diff.base.grade}</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Current</p>
            <p className="text-3xl font-bold tabular-nums">{diff.current.score}</p>
            <p className="text-xs text-muted-foreground mt-1">Grade: {diff.current.grade}</p>
          </div>
        </div>

        {/* Changed dimensions table */}
        {diff.changedDimensions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dimension</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead className="text-right">Delta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diff.changedDimensions.map((d) => (
                <TableRow key={d.dimension}>
                  <TableCell className="text-sm">{d.dimension}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {d.before}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {d.after}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeltaBadge delta={d.delta} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No dimension changes detected between branches.
          </p>
        )}

        {/* Issues comparison */}
        {(diff.base.issues.length > 0 || diff.current.issues.length > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Base Issues ({diff.base.issues.length})
              </p>
              <div className="space-y-1">
                {diff.base.issues.map((issue, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">
                    {issue}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Current Issues ({diff.current.issues.length})
              </p>
              <div className="space-y-1">
                {diff.current.issues.map((issue, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">
                    {issue}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
