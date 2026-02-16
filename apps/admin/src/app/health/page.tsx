import Link from 'next/link';
import { scoreAllComponents } from '@/lib/health-scorer';
import {
  getAllComponentTrends,
  getPlatformTrend,
  getLatestSnapshot,
} from '@/lib/health-history-reader';
import { saveHealthSnapshot } from '@/lib/health-history-writer';
import { HealthDashboard } from '@/components/health/HealthDashboard';
import { ArrowLeft, Download } from 'lucide-react';

export default async function HealthPage() {
  // Score all components
  const components = await scoreAllComponents();

  // Save current snapshot (automatically on every page load for now)
  // In production, this would be triggered by a cron job
  saveHealthSnapshot(components);

  // Get trend data
  const trends = getAllComponentTrends(30);
  const platformTrend = getPlatformTrend(30);

  // Get latest snapshot for metadata
  const latest = getLatestSnapshot();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Component Health Center</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive health tracking with 17 quality dimensions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {latest && (
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Last Updated</div>
              <div className="font-medium text-foreground">{latest.date}</div>
            </div>
          )}
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <HealthDashboard components={components} trends={trends} platformTrend={platformTrend} />

      {/* Info Footer */}
      <div className="mt-8 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04] text-sm text-muted-foreground">
        <div className="font-medium text-foreground mb-2">About Health Scoring</div>
        <div className="space-y-1">
          <p>
            • <strong>17 Dimensions</strong>: API Documentation, CEM Completeness, Story Coverage,
            Docs Coverage, Type Safety, Test Coverage, Accessibility, Bundle Size, Token Compliance,
            Visual Regression, Cross-Browser, Drupal Readiness, Code Quality, Lit Best Practices,
            Security, Maintainability, Developer Experience
          </p>
          <p>
            • <strong>Sub-Metrics</strong>: Many dimensions include detailed sub-metrics for
            granular analysis
          </p>
          <p>
            • <strong>Confidence Levels</strong>: Verified (automated tooling), Heuristic (pattern
            analysis), Untested
          </p>
          <p>
            • <strong>Grades</strong>: A (90-100%), B (80-89%), C (70-79%), D (60-69%), F (&lt;60%)
          </p>
          <p>
            • <strong>Critical Dimensions</strong>: API Docs, CEM, Test Coverage, Accessibility,
            Type Safety, Docs, Security must meet thresholds for high grades
          </p>
        </div>
      </div>
    </div>
  );
}
