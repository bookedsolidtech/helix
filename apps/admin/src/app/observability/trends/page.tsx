/**
 * Health Trends — Panopticon v2.
 * Time series health scores for all components.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllComponentTrends, getPlatformTrend } from '@/lib/health-history-reader';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function TrendIcon({ trend }: { trend: 'improving' | 'declining' | 'stable' }): React.JSX.Element {
  if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function trendTextClass(trend: 'improving' | 'declining' | 'stable'): string {
  if (trend === 'improving') return 'text-green-400';
  if (trend === 'declining') return 'text-red-400';
  return 'text-muted-foreground';
}

function scoreBarClass(score: number): string {
  if (score >= 80) return 'bg-green-500/70';
  if (score >= 60) return 'bg-yellow-500/70';
  return 'bg-red-500/70';
}

export default function TrendsPage(): React.JSX.Element {
  const componentTrends = getAllComponentTrends(30);
  const platformTrend = getPlatformTrend(30);

  const hasData = componentTrends.length > 0 || platformTrend.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/observability"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Observability Hub
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Health Score Trends</h1>
        <p className="text-muted-foreground mt-1">
          30-day health score history across all components.
        </p>
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              No health history data yet. Visit the{' '}
              <Link href="/health" className="underline hover:text-foreground">
                Health Center
              </Link>{' '}
              to generate the first snapshot.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Platform-wide trend */}
          {platformTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Platform-Wide Average Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Avg Score</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {platformTrend.slice(-10).map((entry) => (
                        <tr key={entry.date} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4 text-muted-foreground">{entry.date}</td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', scoreBarClass(entry.averageScore))}
                                  style={{ width: `${entry.averageScore}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs">{entry.averageScore.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-2 font-mono text-xs font-bold">{entry.averageGrade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-component trends */}
          <Card>
            <CardHeader>
              <CardTitle>Component Health Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-6 py-3 font-medium text-muted-foreground">Component</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Current Score</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Previous Score</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Change</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Trend</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">History (newest first)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentTrends.map((trend, idx) => (
                      <tr
                        key={trend.component}
                        className={cn(
                          'border-b border-border last:border-0',
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                        )}
                      >
                        <td className="px-6 py-4 font-mono font-medium">{trend.component}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', scoreBarClass(trend.currentScore))}
                                style={{ width: `${trend.currentScore}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs">{trend.currentScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                          {trend.previousScore}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              'text-xs font-medium',
                              trendTextClass(trend.trend),
                            )}
                          >
                            {trend.changePercent > 0 ? '+' : ''}
                            {trend.changePercent}%
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <TrendIcon trend={trend.trend} />
                            <span className={cn('text-xs capitalize', trendTextClass(trend.trend))}>
                              {trend.trend}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1">
                            {[...trend.history]
                              .reverse()
                              .slice(0, 10)
                              .map((entry) => (
                                <div
                                  key={entry.date}
                                  className="relative group"
                                  title={`${entry.date}: ${entry.score} (${entry.grade})`}
                                >
                                  <div
                                    className={cn(
                                      'w-2 rounded-sm',
                                      scoreBarClass(entry.score),
                                    )}
                                    style={{ height: `${Math.max(4, Math.round(entry.score / 10) * 2)}px` }}
                                  />
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
