'use client';

import { cn } from '@/lib/utils';

interface TestProgressBarProps {
  completed: number;
  total: number;
  passed: number;
  failed: number;
  isRunning: boolean;
  elapsed: number;
}

export function TestProgressBar({
  completed,
  total,
  passed,
  failed,
  isRunning,
  elapsed,
}: TestProgressBarProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isDone = !isRunning && completed > 0;
  const hasFailures = failed > 0;
  const isStarting = isRunning && completed === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          {isRunning && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          )}
          <span className="font-mono tabular-nums text-foreground">
            {isStarting ? 'Launching browser...' : `${completed}/${total > 0 ? total : '?'} tests`}
          </span>
          {isRunning && (
            <span className="text-muted-foreground tabular-nums">
              {(elapsed / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {isStarting && (
            <span className="text-blue-400 font-medium">Starting Vitest + Chromium</span>
          )}
          {passed > 0 && <span className="text-emerald-400 font-medium">{passed} passed</span>}
          {failed > 0 && <span className="text-red-400 font-medium">{failed} failed</span>}
        </div>
      </div>

      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        {isStarting ? (
          <div className="h-full w-full bg-blue-500/30 rounded-full overflow-hidden relative">
            <div
              className="absolute inset-0 bg-blue-500 rounded-full"
              style={{
                animation: 'indeterminate-bar 1.5s ease-in-out infinite',
              }}
            />
          </div>
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              isRunning
                ? 'bg-blue-500'
                : isDone && hasFailures
                  ? 'bg-red-500'
                  : isDone
                    ? 'bg-emerald-500'
                    : 'bg-secondary',
            )}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
