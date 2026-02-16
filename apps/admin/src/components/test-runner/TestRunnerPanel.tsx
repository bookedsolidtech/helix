'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { TestProgressBar } from './TestProgressBar';
import { TestSummaryCharts } from './TestSummaryCharts';
import { TestResultsTable } from './TestResultsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AllTestResults } from '@/lib/test-results-reader';

interface StreamResult {
  component: string;
  suite: string;
  test: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  completed: number;
}

interface TestRunnerPanelProps {
  initialResults: AllTestResults | null;
}

// ── Rotating flavor messages ─────────────────────────────────────────

const FLAVOR_MESSAGES = [
  'Warming up the pixel engines',
  'Interrogating shadow DOMs',
  'Cross-examining ARIA attributes',
  'Shaking down event listeners',
  'Measuring every last CSS token',
  'Stress-testing keyboard navigation',
  'Grilling focus traps for weaknesses',
  'Auditing color contrast ratios',
  'Poking buttons to see what breaks',
  'Confirming form validity ceremonies',
  'Making sure slots render on time',
  'Running axe-core with extreme prejudice',
  'Verifying ElementInternals handshakes',
  'Dilly-dallying with the DOM',
  'Double-checking the vibe',
  'Asking Chromium nicely to cooperate',
  'Simulating aggressive user clicks',
  'Ensuring nothing leaks from shadow boundaries',
  'Consulting the accessibility oracle',
  'Polishing the last assertion',
];

export function TestRunnerPanel({ initialResults }: TestRunnerPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<StreamResult[]>([]);
  const [passed, setPassed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState<AllTestResults | null>(initialResults);

  // Per-component streaming state
  const [currentComponent, setCurrentComponent] = useState<string | null>(null);
  const [completedFiles, setCompletedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [componentList, setComponentList] = useState<string[]>([]);

  // Rotating flavor message
  const [flavorIndex, setFlavorIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flavorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isDev = process.env.NODE_ENV === 'development' || typeof window !== 'undefined';

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setPassed(0);
    setFailed(0);
    setCompleted(false);
    setElapsed(0);
    setCurrentComponent(null);
    setCompletedFiles(0);
    setTotalFiles(0);
    setComponentList([]);
    setFlavorIndex(0);

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);

    // Rotate flavor messages every 3 seconds
    flavorRef.current = setInterval(() => {
      setFlavorIndex((prev) => (prev + 1) % FLAVOR_MESSAGES.length);
    }, 3000);

    try {
      const response = await fetch('/api/tests/run', { method: 'POST' });
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const dataLine = line.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine.slice(6)) as Record<string, unknown>;

            if (data.type === 'started') {
              if (typeof data.totalFiles === 'number') {
                setTotalFiles(data.totalFiles);
              }
              if (Array.isArray(data.files)) {
                setComponentList(data.files as string[]);
              }
            } else if (data.type === 'heartbeat') {
              setElapsed(data.elapsed as number);
            } else if (data.type === 'component-start') {
              setCurrentComponent(data.component as string);
            } else if (data.type === 'result') {
              const result = data as unknown as StreamResult;
              setResults((prev) => [...prev, result]);
              if (result.status === 'pass') {
                setPassed((p) => p + 1);
              } else if (result.status === 'fail') {
                setFailed((f) => f + 1);
              }
            } else if (data.type === 'component-complete') {
              setCompletedFiles((prev) => prev + 1);
            } else if (data.type === 'complete') {
              setCompleted(true);
              setIsRunning(false);
              setCurrentComponent(null);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              if (flavorRef.current) {
                clearInterval(flavorRef.current);
                flavorRef.current = null;
              }
              setElapsed(Date.now() - startTimeRef.current);

              try {
                const res = await fetch('/api/tests/results');
                if (res.ok) {
                  const json = (await res.json()) as AllTestResults;
                  setFinalResults(json);
                }
              } catch {
                // Cached results may not be ready yet
              }
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch {
      setIsRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (flavorRef.current) {
        clearInterval(flavorRef.current);
        flavorRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (flavorRef.current) clearInterval(flavorRef.current);
    };
  }, []);

  const totalEstimate = initialResults?.totalTests ?? 550;

  return (
    <div className="space-y-6">
      {/* Run Button + Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Runner</CardTitle>
            {isDev && (
              <button
                onClick={() => void runTests()}
                disabled={isRunning}
                className={cn(
                  'px-6 py-2.5 rounded-lg font-semibold text-sm transition-all',
                  isRunning
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]',
                )}
              >
                {isRunning ? 'Running...' : 'Run All Tests'}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isRunning && (
            <>
              <TestProgressBar
                completed={results.length}
                total={totalEstimate}
                passed={passed}
                failed={failed}
                isRunning
                elapsed={elapsed}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {currentComponent ? (
                    <>
                      <span className="text-foreground font-medium">{currentComponent}</span>
                      <span>
                        ({completedFiles}/{totalFiles} components)
                      </span>
                    </>
                  ) : (
                    <span>Discovering test files...</span>
                  )}
                </div>
                {totalFiles > 0 && (
                  <ComponentProgress
                    components={componentList}
                    completedFiles={completedFiles}
                    currentComponent={currentComponent}
                  />
                )}
              </div>
            </>
          )}
          {!isRunning && completed && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-foreground font-medium">
                  {passed + failed} tests completed
                </span>
              </div>
              <span className="text-emerald-400 font-medium">{passed} passed</span>
              {failed > 0 && <span className="text-red-400 font-medium">{failed} failed</span>}
              <span className="text-muted-foreground">{(elapsed / 1000).toFixed(1)}s</span>
            </div>
          )}
          {!isRunning && !completed && finalResults && (
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Last run: </span>
                <span className="text-foreground">
                  {new Date(finalResults.timestamp).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Results: </span>
                <span className="text-emerald-400 font-medium">
                  {finalResults.totalPassed} passed
                </span>
                {finalResults.totalFailed > 0 && (
                  <span className="text-red-400 font-medium">
                    {' '}
                    / {finalResults.totalFailed} failed
                  </span>
                )}
                <span className="text-muted-foreground"> / {finalResults.totalTests} total</span>
              </div>
            </div>
          )}
          {!isRunning && !completed && !finalResults && (
            <p className="text-sm text-muted-foreground">
              No test results found. Click &ldquo;Run All Tests&rdquo; to start.
            </p>
          )}

          {/* CLI quick reference */}
          {!isRunning && <CliSnippet />}
        </CardContent>
      </Card>

      {/* Live Status — sexy rotating message */}
      {isRunning && (
        <Card className="overflow-hidden border-blue-500/20">
          <CardContent className="p-0">
            <div className="relative">
              {/* Animated gradient bar at top */}
              <div className="h-0.5 w-full bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 bg-[length:200%_100%] animate-[bar-shimmer_2s_ease-in-out_infinite]" />

              <div className="px-6 py-5 flex items-center gap-4">
                {/* Pulsing icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                  </span>
                </div>

                {/* Component name + flavor */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Testing</span>
                    <span
                      key={currentComponent}
                      className="text-base font-semibold text-foreground font-mono animate-[fade-in_0.3s_ease-out]"
                    >
                      {currentComponent ? `<${currentComponent}>` : '...'}
                    </span>
                  </div>
                  <p
                    key={flavorIndex}
                    className="text-xs text-muted-foreground mt-0.5 italic animate-[fade-in_0.5s_ease-out]"
                  >
                    {FLAVOR_MESSAGES[flavorIndex]}...
                  </p>
                </div>

                {/* Live counters */}
                <div className="flex items-center gap-4 text-xs tabular-nums flex-shrink-0">
                  {passed > 0 && (
                    <span className="text-emerald-400 font-medium">{passed} passed</span>
                  )}
                  {failed > 0 && <span className="text-red-400 font-medium">{failed} failed</span>}
                  <span className="text-muted-foreground">{(elapsed / 1000).toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary + Component Breakdown */}
      {!isRunning && finalResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <TestSummaryCharts results={finalResults} />
            <hr className="border-white/[0.06] my-6" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Component Breakdown
            </h4>
            <TestResultsTable results={finalResults} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── CLI Snippet ──────────────────────────────────────────────────────

const CLI_COMMANDS = [
  { label: 'All tests', cmd: 'npm run test' },
  {
    label: 'Single component',
    cmd: 'cd packages/hx-library && npx vitest run src/components/hx-button/',
  },
  { label: 'Watch mode', cmd: 'cd packages/hx-library && npx vitest --watch' },
  { label: 'With coverage', cmd: 'cd packages/hx-library && npx vitest run --coverage' },
];

function CliSnippet() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(cmd: string) {
    void navigator.clipboard.writeText(cmd);
    setCopied(cmd);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mt-4 pt-4 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2.5">
        <svg
          className="w-3.5 h-3.5 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" x2="20" y1="19" y2="19" />
        </svg>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Run faster from CLI
        </span>
      </div>
      <div className="space-y-1.5">
        {CLI_COMMANDS.map(({ label, cmd }) => {
          const isCopied = copied === cmd;
          return (
            <button
              key={cmd}
              type="button"
              onClick={() => copy(cmd)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left cursor-pointer transition-all duration-300',
                isCopied
                  ? 'bg-emerald-500/10 ring-1 ring-emerald-500/20'
                  : 'bg-black/30 hover:bg-black/50',
              )}
            >
              <span className="text-[11px] text-muted-foreground w-28 shrink-0">{label}</span>
              <code className="text-xs text-emerald-400/90 font-mono flex-1 truncate">{cmd}</code>
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs shrink-0 transition-all duration-300',
                  isCopied ? 'opacity-100' : 'opacity-0',
                )}
              >
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-emerald-400 font-medium">Copied</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground/60 mt-2 italic">
        CLI runs ~10x faster — browser tests here run sequentially for visual feedback.
      </p>
    </div>
  );
}

// ── Component Progress Indicator ──────────────────────────────────────

function ComponentProgress({
  components,
  completedFiles,
  currentComponent,
}: {
  components: string[];
  completedFiles: number;
  currentComponent: string | null;
}) {
  return (
    <div className="flex items-center gap-1">
      {components.map((name, i) => {
        const isDone = i < completedFiles;
        const isCurrent = name === currentComponent;
        return (
          <div
            key={`${name}-${i}`}
            title={name}
            className={cn(
              'w-2 h-2 rounded-full transition-colors duration-300',
              isDone ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-secondary',
            )}
          />
        );
      })}
    </div>
  );
}
