'use client';

/**
 * Client component for the error list with mark-resolved interactivity.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TrackedError, ErrorTrackingData } from '@/lib/error-tracker';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface Props {
  initialData: ErrorTrackingData;
}

function severityClass(severity: TrackedError['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border border-red-500/30';
    case 'high':
      return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
    case 'low':
      return 'bg-muted text-muted-foreground border border-border';
  }
}

function typeLabel(type: TrackedError['type']): string {
  switch (type) {
    case 'render-failure':
      return 'Render Failure';
    case 'a11y-violation':
      return 'A11y Violation';
    case 'type-error':
      return 'Type Error';
    case 'test-failure':
      return 'Test Failure';
  }
}

type FilterType = TrackedError['type'] | 'all';
type FilterSeverity = TrackedError['severity'] | 'all';
type FilterResolved = 'all' | 'unresolved' | 'resolved';

export function ErrorList({ initialData }: Props): React.JSX.Element {
  const [errors, setErrors] = useState<TrackedError[]>(initialData.errors);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [filterResolved, setFilterResolved] = useState<FilterResolved>('unresolved');

  function toggleResolved(id: string): void {
    setErrors((prev) =>
      prev.map((e) => (e.id === id ? { ...e, resolved: !e.resolved } : e)),
    );
  }

  const filtered = errors.filter((e) => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false;
    if (filterResolved === 'unresolved' && e.resolved) return false;
    if (filterResolved === 'resolved' && !e.resolved) return false;
    return true;
  });

  const unresolved = errors.filter((e) => !e.resolved).length;

  const TYPE_OPTIONS: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'render-failure', label: 'Render Failure' },
    { value: 'a11y-violation', label: 'A11y Violation' },
    { value: 'type-error', label: 'Type Error' },
    { value: 'test-failure', label: 'Test Failure' },
  ];

  const SEVERITY_OPTIONS: { value: FilterSeverity; label: string }[] = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const RESOLVED_OPTIONS: { value: FilterResolved; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'resolved', label: 'Resolved' },
  ];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
          const count = errors.filter((e) => e.severity === sev && !e.resolved).length;
          return (
            <Card key={sev}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xl font-bold">{count}</p>
                <p
                  className={cn(
                    'text-xs capitalize font-medium mt-0.5',
                    sev === 'critical' && 'text-red-400',
                    sev === 'high' && 'text-orange-400',
                    sev === 'medium' && 'text-yellow-400',
                    sev === 'low' && 'text-muted-foreground',
                  )}
                >
                  {sev} open
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
                className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground font-medium">Status</label>
              <select
                value={filterResolved}
                onChange={(e) => setFilterResolved(e.target.value as FilterResolved)}
                className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
              >
                {RESOLVED_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">
              {unresolved} unresolved / {errors.length} total
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error list */}
      <Card>
        <CardHeader>
          <CardTitle>Errors ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground text-center">
              No errors match the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((error) => (
                <li
                  key={error.id}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4',
                    error.resolved && 'opacity-50',
                  )}
                >
                  <button
                    onClick={() => toggleResolved(error.id)}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={error.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                    title={error.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                  >
                    {error.resolved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium">{error.component}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          severityClass(error.severity),
                        )}
                      >
                        {error.severity}
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border">
                        {typeLabel(error.type)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{error.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
