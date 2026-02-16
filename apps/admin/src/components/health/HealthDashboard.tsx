'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComponentHealth } from '@/lib/health-scorer';
import { TrendData } from '@/lib/health-history-reader';
import { ComponentDrillDown } from './ComponentDrillDown';
import { TrendChart } from './TrendChart';
import { Heatmap } from './Heatmap';
import { TeamLeaderboard } from './TeamLeaderboard';
import { TrendingUp, Target, Grid3x3, Trophy } from 'lucide-react';
import { useState } from 'react';

interface HealthDashboardProps {
  components: ComponentHealth[];
  trends: TrendData[];
  platformTrend: Array<{ date: string; averageScore: number; averageGrade: string }>;
}

export function HealthDashboard({ components, trends, platformTrend }: HealthDashboardProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentHealth | null>(null);

  const avgScore =
    components.length > 0
      ? Math.round(components.reduce((sum, c) => sum + c.overallScore, 0) / components.length)
      : 0;

  const improving = trends.filter((t) => t.trend === 'improving').length;
  const declining = trends.filter((t) => t.trend === 'declining').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Platform Health</div>
            <div className="text-3xl font-bold text-foreground mt-2">{avgScore}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {components.length} components tracked
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Improving</div>
            <div className="text-3xl font-bold text-emerald-400 mt-2">{improving}</div>
            <div className="text-xs text-muted-foreground mt-1">components trending up</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Declining</div>
            <div className="text-3xl font-bold text-red-400 mt-2">{declining}</div>
            <div className="text-xs text-muted-foreground mt-1">need attention</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Dimensions</div>
            <div className="text-3xl font-bold text-blue-400 mt-2">17</div>
            <div className="text-xs text-muted-foreground mt-1">quality metrics tracked</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <CardTitle>30-Day Platform Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart data={platformTrend} />
          </CardContent>
        </Card>

        {/* Team Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <CardTitle>Component Rankings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <TeamLeaderboard components={components} />
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-purple-400" />
            <CardTitle>Multi-Dimension Heatmap</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Click any component to see detailed drill-down
          </p>
        </CardHeader>
        <CardContent>
          <Heatmap components={components} onSelectComponent={setSelectedComponent} />
        </CardContent>
      </Card>

      {/* Component Drill-Down (Modal) */}
      {selectedComponent && (
        <Card className="border-blue-500/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <CardTitle>Component Drill-Down: &lt;{selectedComponent.tagName}&gt;</CardTitle>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ComponentDrillDown
              component={selectedComponent}
              trend={trends.find((t) => t.component === selectedComponent.tagName)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
