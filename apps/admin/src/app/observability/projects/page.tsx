/**
 * Multi-project view — Panopticon v2.
 * Lists all consumer projects with version drift status and component usage.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllProjects } from '@/lib/projects-data';
import { detectVersionDrift, type VersionDriftResult } from '@/lib/version-drift-detector';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

function driftBadgeClass(level: VersionDriftResult['driftLevel']): string {
  switch (level) {
    case 'current':
      return 'bg-green-500/15 text-green-400 border border-green-500/30';
    case 'minor':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    case 'major':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'critical':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
  }
}

function envBadgeClass(env: string): string {
  switch (env) {
    case 'production':
      return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
    case 'staging':
      return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
    default:
      return 'bg-muted text-muted-foreground border border-border';
  }
}

function typeBadgeClass(type: string): string {
  switch (type) {
    case 'drupal':
      return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    case 'react':
      return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
    case 'angular':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
    case 'vue':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    default:
      return 'bg-muted text-muted-foreground border border-border';
  }
}

export default function ProjectsPage(): React.JSX.Element {
  const projects = getAllProjects();
  const driftResults = detectVersionDrift();
  const driftMap = new Map(driftResults.map((r) => [r.projectId, r]));

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
        <h1 className="text-2xl font-bold tracking-tight">Consumer Projects</h1>
        <p className="text-muted-foreground mt-1">
          {projects.length} projects using @wc-2026/library.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Registry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Environment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Version</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Drift</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Components</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => {
                  const drift = driftMap.get(project.id);
                  return (
                    <tr
                      key={project.id}
                      className={cn(
                        'border-b border-border last:border-0',
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/20',
                      )}
                    >
                      <td className="px-6 py-4 font-medium">{project.name}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            typeBadgeClass(project.type),
                          )}
                        >
                          {project.type}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            envBadgeClass(project.environment),
                          )}
                        >
                          {project.environment}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {project.version}
                      </td>
                      <td className="px-4 py-4">
                        {drift ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                              driftBadgeClass(drift.driftLevel),
                            )}
                          >
                            {drift.driftLevel}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {project.components.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono bg-muted text-muted-foreground"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{project.lastUpdated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Drift summary */}
      <Card>
        <CardHeader>
          <CardTitle>Version Drift Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(['current', 'minor', 'major', 'critical'] as const).map((level) => {
              const count = driftResults.filter((r) => r.driftLevel === level).length;
              return (
                <div key={level} className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p
                    className={cn(
                      'text-xs mt-1 capitalize font-medium',
                      level === 'current' && 'text-green-400',
                      level === 'minor' && 'text-yellow-400',
                      level === 'major' && 'text-orange-400',
                      level === 'critical' && 'text-red-400',
                    )}
                  >
                    {level}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
