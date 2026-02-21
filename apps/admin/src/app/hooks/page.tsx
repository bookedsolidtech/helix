import { Breadcrumb } from '@/components/dashboard/Breadcrumb';
import { getBreadcrumbItems } from '@/lib/breadcrumb-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitBranch,
  Server,
  Zap,
  TrendingUp,
  Clock,
  Users,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { hooks, mcpServers, phases, metrics, risks } from '@/lib/hooks-data';
import type { Priority } from '@/lib/hooks-data';
import { cn } from '@/lib/utils';
import { HooksPageClient } from './components/HooksPageClient';

export default function HooksPage(): React.JSX.Element {
  // Group hooks by priority
  const hooksByPriority = {
    P0: hooks.filter((h) => h.priority === 'P0'),
    P1: hooks.filter((h) => h.priority === 'P1'),
    P2: hooks.filter((h) => h.priority === 'P2'),
  };

  // Group hooks by status
  const hooksByStatus = {
    implemented: hooks.filter((h) => h.status === 'implemented'),
    planned: hooks.filter((h) => h.status === 'planned'),
    deferred: hooks.filter((h) => h.status === 'deferred'),
  };

  const implementationPercent = Math.round((hooksByStatus.implemented.length / hooks.length) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Breadcrumb items={getBreadcrumbItems('/hooks')} />
        <h1 className="text-2xl font-bold tracking-tight">Claude Code Hooks & MCP Servers</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive automation infrastructure for quality gates and developer experience
        </p>
      </div>

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Implemented</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-emerald-400">
              {hooksByStatus.implemented.length}/{hooks.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{implementationPercent}% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Planned</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-blue-400">
              {hooksByStatus.planned.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Phase 3-4 roadmap</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-purple-400">
                <Server className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">MCP Servers</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-purple-400">{mcpServers.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{phases.length} phases</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400">
                <Zap className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Speedup</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-amber-400">12x</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics.roi} ROI</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-400">
                <Users className="w-4 h-4" />
              </span>
              <span className="text-xs font-medium text-muted-foreground">Resource</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-amber-400">{metrics.totalHours}</p>
            <p className="text-xs text-muted-foreground mt-1">hours across 11 specialists</p>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Roadmap Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-blue-400">
                <Target className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-base">Implementation Roadmap</CardTitle>
                <p className="text-xs text-muted-foreground">4-phase rollout over 8 weeks</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {phases.map((phase, index) => (
              <div key={phase.phase} className="relative">
                {/* Timeline connector */}
                {index < phases.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-gradient-to-b from-blue-500/50 to-transparent" />
                )}

                <div className="flex gap-4">
                  {/* Phase badge */}
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                    <span className="text-lg font-bold text-blue-400">{phase.phase}</span>
                  </div>

                  {/* Phase content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-bold text-foreground">{phase.name}</h3>
                      <span className="text-xs text-muted-foreground">{phase.weeks}</span>
                      <span className="text-xs text-amber-400 font-medium ml-auto">
                        {phase.effort}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{phase.focus}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Hooks */}
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {phase.hooks.length} Hooks
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.hooks.map((hookId) => {
                            const hook = hooks.find((h) => h.id === hookId);
                            return (
                              <Badge
                                key={hookId}
                                variant="outline"
                                className={cn(
                                  'text-[10px] font-medium',
                                  hook?.priority === 'P0' && 'border-red-500/30 text-red-400',
                                  hook?.priority === 'P1' && 'border-amber-500/30 text-amber-400',
                                  hook?.priority === 'P2' && 'border-blue-500/30 text-blue-400',
                                )}
                              >
                                {hookId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>

                      {/* Servers */}
                      <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Server className="w-3.5 h-3.5 text-purple-400" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {phase.servers.length} MCP Servers
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {phase.servers.map((serverId) => (
                            <Badge
                              key={serverId}
                              variant="outline"
                              className="text-[10px] font-medium border-purple-500/30 text-purple-400"
                            >
                              {serverId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hooks by Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['P0', 'P1', 'P2'] as Priority[]).map((priority) => (
          <Card
            key={priority}
            className={cn(
              'transition-colors',
              priority === 'P0' && 'hover:border-red-500/30',
              priority === 'P1' && 'hover:border-amber-500/30',
              priority === 'P2' && 'hover:border-blue-500/30',
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      priority === 'P0' && 'text-red-400',
                      priority === 'P1' && 'text-amber-400',
                      priority === 'P2' && 'text-blue-400',
                    )}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">
                      {priority === 'P0' && 'Critical Priority'}
                      {priority === 'P1' && 'High Priority'}
                      {priority === 'P2' && 'Standard Priority'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {hooksByPriority[priority].length} hooks
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hooksByPriority[priority].map((hook) => (
                  <div
                    key={hook.id}
                    className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold',
                            priority === 'P0' && 'border-red-500/30 text-red-400',
                            priority === 'P1' && 'border-amber-500/30 text-amber-400',
                            priority === 'P2' && 'border-blue-500/30 text-blue-400',
                          )}
                        >
                          {hook.id}
                        </Badge>
                        <span className="font-mono text-xs font-medium text-foreground">
                          {hook.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-white/[0.06] shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {hook.executionBudget}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{hook.purpose}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {hook.owner}
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Target className="w-3 h-3" />
                        Phase {hook.phase}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Hooks & Servers Tables */}
      <HooksPageClient />

      {/* Success Metrics & Risk Mitigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Metrics */}
        <Card className="transition-colors hover:border-emerald-500/30">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-base">Success Metrics</CardTitle>
                <p className="text-xs text-muted-foreground">Expected outcomes and ROI</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <div className="text-sm font-medium text-foreground mb-1">Pre-commit Speed</div>
                  <div className="text-xs text-muted-foreground">
                    Automated checks vs manual review
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-400">12x</div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <div className="text-sm font-medium text-foreground mb-1">
                    Return on Investment
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Time saved vs implementation cost
                  </div>
                </div>
                <div className="text-3xl font-bold text-emerald-400">{metrics.roi}</div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <div className="text-sm font-medium text-foreground mb-1">Total Investment</div>
                  <div className="text-xs text-muted-foreground">
                    Across {metrics.specialists} specialist agents
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-400">{metrics.totalHours}h</div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    Hooks reduce manual code review time by{' '}
                    <span className="text-emerald-400 font-medium">85%</span>, catching issues
                    before PR submission. MCP servers provide real-time feedback during development,
                    reducing context-switching overhead by{' '}
                    <span className="text-emerald-400 font-medium">70%</span>.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Mitigation */}
        <Card className="transition-colors hover:border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <CardTitle className="text-base">Risk Mitigation</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {risks.length} identified risks with mitigation strategies
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">Risk</div>
                      <div className="text-xs text-muted-foreground">{item.risk}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 ml-6">
                    <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-emerald-400 mb-1">Mitigation</div>
                      <div className="text-xs text-muted-foreground mb-2">{item.mitigation}</div>
                      <Badge variant="outline" className="text-[10px] border-white/[0.06]">
                        <Users className="w-3 h-3 mr-1" />
                        {item.owner}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hook Workflow Examples */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="text-blue-400">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <CardTitle className="text-base">Hook Workflows</CardTitle>
              <p className="text-xs text-muted-foreground">
                Detailed execution patterns for critical hooks
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {hooks.slice(0, 6).map((hook) => (
              <div
                key={hook.id}
                className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold',
                      hook.priority === 'P0' && 'border-red-500/30 text-red-400',
                      hook.priority === 'P1' && 'border-amber-500/30 text-amber-400',
                      hook.priority === 'P2' && 'border-blue-500/30 text-blue-400',
                    )}
                  >
                    {hook.id}
                  </Badge>
                  <span className="font-mono text-sm font-medium text-foreground">{hook.name}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">{hook.workflow}</div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-muted-foreground">{hook.owner}</span>
                  <Badge variant="outline" className="text-[10px]">
                    <Clock className="w-3 h-3 mr-1" />
                    {hook.executionBudget}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
