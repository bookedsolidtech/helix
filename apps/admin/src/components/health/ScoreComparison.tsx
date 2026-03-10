'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentHealth } from '@/lib/health-scorer';
import type { McpComponentHealth } from '@/lib/mcp-client';

interface ScoreComparisonProps {
  /** Admin's 17-dimension health scores */
  adminScores: ComponentHealth[];
  /** wc-tools CEM-derived scores (may be null if MCP unavailable) */
  mcpScores: McpComponentHealth[] | null;
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold',
        grade === 'A'
          ? 'text-emerald-400 bg-emerald-400/10'
          : grade === 'B'
            ? 'text-blue-400 bg-blue-400/10'
            : grade === 'C'
              ? 'text-amber-400 bg-amber-400/10'
              : grade === 'D'
                ? 'text-orange-400 bg-orange-400/10'
                : 'text-red-400 bg-red-400/10',
      )}
    >
      {grade}
    </span>
  );
}

export function ScoreComparison({ adminScores, mcpScores }: ScoreComparisonProps) {
  const mcpMap = new Map<string, McpComponentHealth>();
  if (mcpScores) {
    for (const s of mcpScores) {
      mcpMap.set(s.tagName, s);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Score Comparison: Admin vs MCP</CardTitle>
            <CardDescription>
              Admin 17-dimension gated scoring vs wc-tools CEM-derived scores
            </CardDescription>
          </div>
          {!mcpScores && (
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
              MCP unavailable
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-white/[0.04]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                <th className="py-2 pr-3 pl-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Component
                </th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Score
                </th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Grade
                </th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  MCP Score
                </th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  MCP Grade
                </th>
                <th className="py-2 px-3 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Delta
                </th>
                <th className="py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Dimensions
                </th>
              </tr>
            </thead>
            <tbody>
              {adminScores.map((admin) => {
                const mcp = mcpMap.get(admin.tagName);
                const delta = mcp ? admin.overallScore - mcp.score : null;

                return (
                  <tr
                    key={admin.tagName}
                    className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2 pr-3 pl-3">
                      <code className="text-xs font-mono font-medium text-foreground">
                        {admin.tagName}
                      </code>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-sm font-bold tabular-nums">{admin.overallScore}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <GradeBadge grade={admin.grade} />
                    </td>
                    <td className="py-2 px-3 text-center">
                      {mcp ? (
                        <span className="text-sm font-bold tabular-nums">{mcp.score}</span>
                      ) : (
                        <span className="text-xs text-white/20">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {mcp ? (
                        <GradeBadge grade={mcp.grade} />
                      ) : (
                        <span className="text-xs text-white/20">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {delta !== null ? (
                        <span
                          className={cn(
                            'text-xs font-mono tabular-nums font-medium',
                            delta > 0
                              ? 'text-emerald-400'
                              : delta < 0
                                ? 'text-red-400'
                                : 'text-muted-foreground',
                          )}
                        >
                          {delta > 0 ? '+' : ''}
                          {delta}
                        </span>
                      ) : (
                        <span className="text-xs text-white/20">&mdash;</span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-emerald-400 tabular-nums">
                          {admin.confidenceSummary.verified}v
                        </span>
                        <span className="text-[10px] text-amber-400 tabular-nums">
                          {admin.confidenceSummary.heuristic}h
                        </span>
                        <span className="text-[10px] text-red-400 tabular-nums">
                          {admin.confidenceSummary.untested}u
                        </span>
                        {mcp && (
                          <>
                            <span className="text-[10px] text-white/10 mx-0.5">|</span>
                            <span className="text-[10px] text-muted-foreground tabular-nums">
                              {Object.keys(mcp.dimensions).length} CEM
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
          <span>Admin: 17-dimension gated scoring (v = verified, h = heuristic, u = untested)</span>
          <span>MCP: CEM-derived 6-dimension scoring</span>
        </div>
      </CardContent>
    </Card>
  );
}
