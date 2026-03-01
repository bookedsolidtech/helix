/**
 * Panopticon v2 — Observability Hub.
 * Top-level overview of multi-project health, errors, and version drift.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllProjects } from '@/lib/projects-data';
import { getDriftingProjects } from '@/lib/version-drift-detector';
import { loadErrorTrackingData } from '@/lib/error-tracker';
import { computeUsageAnalytics } from '@/lib/usage-analytics';
import { getLatestSnapshot } from '@/lib/health-history-reader';
import {
  Layers,
  AlertTriangle,
  TrendingUp,
  GitMerge,
  BarChart2,
  Bell,
  ArrowRight,
} from 'lucide-react';

export default function ObservabilityPage(): React.JSX.Element {
  const projects = getAllProjects();
  const driftingProjects = getDriftingProjects();
  const errorData = loadErrorTrackingData();
  const analytics = computeUsageAnalytics();
  const latestSnapshot = getLatestSnapshot();

  const averageHealth = latestSnapshot
    ? Math.round(latestSnapshot.summary.averageScore)
    : null;

  const overviewCards = [
    {
      title: 'Consumer Projects',
      value: projects.length,
      sub: `${projects.filter((p) => p.environment === 'production').length} in production`,
      icon: <Layers className="w-5 h-5 text-blue-400" />,
      href: '/observability/projects',
      color: 'border-blue-500/20',
    },
    {
      title: 'Average Health Score',
      value: averageHealth !== null ? `${averageHealth}` : 'N/A',
      sub: latestSnapshot
        ? `Grade ${latestSnapshot.summary.averageGrade} across ${latestSnapshot.summary.totalComponents} components`
        : 'No snapshots recorded yet',
      icon: <TrendingUp className="w-5 h-5 text-green-400" />,
      href: '/observability/trends',
      color: 'border-green-500/20',
    },
    {
      title: 'Unresolved Errors',
      value: errorData.summary.unresolved,
      sub: `${errorData.summary.total} total tracked`,
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
      href: '/observability/errors',
      color: 'border-red-500/20',
    },
    {
      title: 'Version Drift',
      value: driftingProjects.length,
      sub: `${driftingProjects.filter((p) => p.driftLevel === 'critical').length} critical`,
      icon: <GitMerge className="w-5 h-5 text-yellow-400" />,
      href: '/observability/projects',
      color: 'border-yellow-500/20',
    },
  ];

  const subSections = [
    {
      href: '/observability/projects',
      icon: <Layers className="w-5 h-5" />,
      title: 'Multi-Project View',
      description: 'All consumer projects, versions, and component usage.',
    },
    {
      href: '/observability/analytics',
      icon: <BarChart2 className="w-5 h-5" />,
      title: 'Usage Analytics',
      description: `${analytics.adoptionRate}% component adoption across projects.`,
    },
    {
      href: '/observability/errors',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Error Tracking',
      description: 'Render failures, a11y violations, type errors.',
    },
    {
      href: '/observability/trends',
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Health Trends',
      description: 'Time series health scores per component.',
    },
    {
      href: '/observability/alerts',
      icon: <Bell className="w-5 h-5" />,
      title: 'Alerting',
      description: 'Configure webhooks and email notifications.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Observability Hub</h1>
        <p className="text-muted-foreground mt-1">
          Panopticon v2 — Multi-project health, usage analytics, and alerting.
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {overviewCards.map((card) => (
          <Link key={card.href + card.title} href={card.href}>
            <Card
              className={`border ${card.color} hover:bg-accent/40 transition-colors cursor-pointer`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Sub-section links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="hover:bg-accent/40 transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground mt-0.5">{section.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{section.title}</p>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
