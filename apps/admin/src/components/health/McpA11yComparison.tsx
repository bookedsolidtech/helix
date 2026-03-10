'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { McpAccessibilityProfile, McpAccessibilityDimension } from '@/lib/mcp-client';

interface A11yCheck {
  name: string;
  passed: boolean;
  weight: number;
  detail: string;
}

interface McpA11yComparisonProps {
  /** Admin's source-code based a11y analysis */
  adminChecks: A11yCheck[];
  adminScore: number;
  hasAxeResults: boolean;
  /** wc-tools CEM-based a11y profile */
  mcpProfile: McpAccessibilityProfile;
}

function ScoreIndicator({ score, label }: { score: number; label: string }) {
  return (
    <div className="text-center">
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400',
        )}
      >
        {score}%
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

export function McpA11yComparison({
  adminChecks,
  adminScore,
  hasAxeResults,
  mcpProfile,
}: McpA11yComparisonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">A11y: Documented vs Implemented</CardTitle>
        <CardDescription>
          Comparing admin source-code analysis against wc-tools CEM metadata profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="text-[10px]">
                Source Analysis
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  hasAxeResults
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'border-amber-500/30 text-amber-400',
                )}
              >
                {hasAxeResults ? 'axe-core verified' : 'Static only'}
              </Badge>
            </div>
            <ScoreIndicator score={adminScore} label="Implemented" />
            <div className="mt-3 space-y-1">
              {adminChecks.map((check) => (
                <div key={check.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    {check.passed ? (
                      <span className="text-emerald-400">&#10003;</span>
                    ) : (
                      <span className="text-red-400">&#10007;</span>
                    )}
                    <span className="text-muted-foreground">{check.name}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="text-[10px]">
                CEM Metadata
              </Badge>
              <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                Grade: {mcpProfile.grade}
              </Badge>
            </div>
            <ScoreIndicator score={mcpProfile.score} label="Documented" />
            <div className="mt-3 space-y-1">
              {mcpProfile.dimensions.map((dim: McpAccessibilityDimension) => (
                <div key={dim.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    {dim.score >= 80 ? (
                      <span className="text-emerald-400">&#10003;</span>
                    ) : dim.score >= 50 ? (
                      <span className="text-amber-400">~</span>
                    ) : (
                      <span className="text-red-400">&#10007;</span>
                    )}
                    <span className="text-muted-foreground">{dim.name}</span>
                  </span>
                  <span className="text-muted-foreground font-mono tabular-nums">{dim.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        {mcpProfile.summary && (
          <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5">
            <p className="text-xs text-muted-foreground">{mcpProfile.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
