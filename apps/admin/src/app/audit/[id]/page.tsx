'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Copy, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { AuditReport, CriticalIssue, ComponentGrade } from '@/lib/audit-report';

interface AuditPageProps {
  params: Promise<{ id: string }>;
}

function GradeBadge({ grade }: { grade: 'A' | 'B' | 'C' | 'D' | 'F' }) {
  const colorMap: Record<string, string> = {
    A: 'bg-green-500/20 text-green-400 border-green-500/30',
    B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    C: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    D: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    F: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-bold ${colorMap[grade] ?? colorMap['F']}`}
    >
      {grade}
    </span>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F' }) {
  const colorMap: Record<string, string> = {
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-yellow-400',
    D: 'text-orange-400',
    F: 'text-red-400',
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-6xl font-black ${colorMap[grade] ?? colorMap['F']}`}>{score}</div>
      <div className="text-2xl font-bold text-muted-foreground">/ 100</div>
      <GradeBadge grade={grade} />
    </div>
  );
}

function SeverityIcon({ severity }: { severity: CriticalIssue['severity'] }) {
  if (severity === 'critical')
    return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />;
  return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />;
}

function DimensionRow({
  name,
  averageScore,
  passed,
}: {
  name: string;
  averageScore: number;
  passed: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 text-sm text-foreground">{name}</div>
      <div className="w-24 bg-white/[0.06] rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${averageScore}%` }}
        />
      </div>
      <div className="w-10 text-right text-xs text-muted-foreground">{averageScore}%</div>
      {passed ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400" />
      )}
    </div>
  );
}

export default function AuditPage({ params }: AuditPageProps) {
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Resolve the id param on first render
  const resolveId = useCallback(async () => {
    const resolved = await params;
    return resolved.id;
  }, [params]);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = libraryId ?? (await resolveId());
      setLibraryId(id);
      const res = await fetch(`/api/audit/${id}`);
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as AuditReport;
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  }, [libraryId, resolveId]);

  // Resolve id on mount to populate breadcrumb and button target
  if (!libraryId) {
    resolveId()
      .then((id) => setLibraryId(id))
      .catch(() => {});
  }

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const handleDownloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${report.libraryId}-${report.timestamp.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          <h1 className="text-2xl font-bold tracking-tight">Library Audit</h1>
          <p className="text-muted-foreground mt-1">
            One-shot comprehensive report card for{' '}
            <span className="text-foreground font-medium">{libraryId ?? '…'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download JSON
              </button>
            </>
          )}
          <button
            onClick={() => void runAudit()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-4 h-4" />
            {loading ? 'Running Audit…' : 'Run Audit'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && !error && (
        <div className="p-12 rounded-xl border border-white/[0.08] bg-white/[0.02] text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-lg font-medium text-foreground mb-2">No report yet</div>
          <div className="text-sm text-muted-foreground mb-6">
            Click <strong>Run Audit</strong> to analyze this library across all quality dimensions.
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 rounded-xl border border-white/[0.08] bg-white/[0.02] text-center">
          <div className="text-4xl mb-4 animate-pulse">⚙️</div>
          <div className="text-lg font-medium text-foreground mb-2">Running audit…</div>
          <div className="text-sm text-muted-foreground">
            Analyzing health, accessibility, CEM quality, and bundle size in parallel.
          </div>
        </div>
      )}

      {/* Report */}
      {report && !loading && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="p-8 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center gap-8">
            <ScoreRing score={report.overallScore} grade={report.overallGrade} />
            <div className="flex-1 space-y-2">
              <div className="text-xl font-bold text-foreground">{report.libraryName}</div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  Scoring Tier:{' '}
                  <strong className="text-foreground">
                    {report.scoringTier === 'full' ? 'Full (17 dimensions)' : 'CEM-only'}
                  </strong>
                </span>
                <span>•</span>
                <span>{new Date(report.timestamp).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-lg font-bold text-foreground">
                    {report.health.averageScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Health Score</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-lg font-bold text-foreground">
                    {report.accessibility.averageScore}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Accessibility</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-lg font-bold text-foreground">
                    {report.cemQuality.averageCompleteness}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">CEM Quality</div>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Issues */}
          {report.criticalIssues.length > 0 && (
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-base font-semibold text-foreground mb-4">Critical Issues</h2>
              <div className="space-y-3">
                {report.criticalIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                  >
                    <SeverityIcon severity={issue.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        <span className="text-blue-400">{issue.component}</span>
                        {' · '}
                        {issue.dimension}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{issue.message}</div>
                      <div className="text-xs text-green-400 mt-1">Fix: {issue.fix}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dimension Breakdown */}
          {report.health.dimensionSummary.length > 0 && (
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-base font-semibold text-foreground mb-4">Health Dimensions</h2>
              <div>
                {report.health.dimensionSummary.map((dim) => (
                  <DimensionRow key={dim.name} {...dim} />
                ))}
              </div>
            </div>
          )}

          {/* Accessibility & CEM side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground">Accessibility</h2>
                <GradeBadge grade={report.accessibility.grade} />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {report.accessibility.averageScore}%
              </div>
              <div className="text-xs text-muted-foreground">
                {report.accessibility.passedComponents} / {report.accessibility.totalComponents}{' '}
                components passed (≥70%)
              </div>
            </div>
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground">CEM Quality</h2>
                <GradeBadge grade={report.cemQuality.grade} />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {report.cemQuality.averageCompleteness}%
              </div>
              <div className="text-xs text-muted-foreground">
                {report.cemQuality.fullyDocumented} / {report.cemQuality.totalComponents} fully
                documented (≥90%)
              </div>
            </div>
          </div>

          {/* Bundle Size */}
          {report.bundleSize && (
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-foreground">Bundle Size</h2>
                {report.bundleSize.underBudget ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    <CheckCircle className="w-3.5 h-3.5" /> Under budget
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                    <XCircle className="w-3.5 h-3.5" /> Over budget
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {(report.bundleSize.totalGzipBytes / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Total gzipped</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {(report.bundleSize.averageGzipBytes / 1024).toFixed(1)} KB
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Average per component</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">
                    {report.bundleSize.componentCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Components measured</div>
                </div>
              </div>
            </div>
          )}

          {/* Component Grades */}
          {report.componentGrades.length > 0 && (
            <div className="p-6 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <h2 className="text-base font-semibold text-foreground mb-4">Component Grades</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {report.componentGrades.map((cg: ComponentGrade) => (
                  <div
                    key={cg.tagName}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]"
                  >
                    <span className="text-sm font-mono text-foreground">{cg.tagName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{cg.score}</span>
                      <GradeBadge grade={cg.grade} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
