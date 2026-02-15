"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { TestProgressBar } from "./TestProgressBar";
import { TestResultRow } from "./TestResultRow";
import { TestSummaryCharts } from "./TestSummaryCharts";
import { TestResultsTable } from "./TestResultsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AllTestResults } from "@/lib/test-results-reader";

interface StreamResult {
  component: string;
  suite: string;
  test: string;
  status: "pass" | "fail" | "skip";
  duration: number;
  completed: number;
}

interface TestRunnerPanelProps {
  initialResults: AllTestResults | null;
}

export function TestRunnerPanel({ initialResults }: TestRunnerPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<StreamResult[]>([]);
  const [passed, setPassed] = useState(0);
  const [failed, setFailed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState<AllTestResults | null>(initialResults);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const isDev = process.env.NODE_ENV === "development" || typeof window !== "undefined";

  const scrollToBottom = useCallback(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (results.length > 0) {
      scrollToBottom();
    }
  }, [results.length, scrollToBottom]);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setPassed(0);
    setFailed(0);
    setCompleted(false);
    setElapsed(0);

    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);

    try {
      const response = await fetch("/api/tests/run", { method: "POST" });
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as Record<string, unknown>;

            if (data.type === "result") {
              const result = data as unknown as StreamResult;
              setResults((prev) => [...prev, result]);
              if (result.status === "pass") {
                setPassed((p) => p + 1);
              } else if (result.status === "fail") {
                setFailed((f) => f + 1);
              }
            } else if (data.type === "complete") {
              setCompleted(true);
              setIsRunning(false);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setElapsed(Date.now() - startTimeRef.current);

              // Fetch authoritative results
              try {
                const res = await fetch("/api/tests/results");
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
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const totalEstimate = initialResults?.totalTests ?? 112;

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
                  "px-6 py-2.5 rounded-lg font-semibold text-sm transition-all",
                  isRunning
                    ? "bg-secondary text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                )}
              >
                {isRunning ? "Running..." : "Run All Tests"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(isRunning || completed) && (
            <TestProgressBar
              completed={results.length}
              total={completed ? results.length : totalEstimate}
              passed={passed}
              failed={failed}
              isRunning={isRunning}
              elapsed={elapsed}
            />
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
                <span className="text-emerald-400 font-medium">{finalResults.totalPassed} passed</span>
                {finalResults.totalFailed > 0 && (
                  <span className="text-red-400 font-medium"> / {finalResults.totalFailed} failed</span>
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
        </CardContent>
      </Card>

      {/* Live Results Stream */}
      {(isRunning || (completed && results.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto space-y-0.5">
              {results.map((r, i) => (
                <TestResultRow
                  key={`${r.component}-${r.test}-${i}`}
                  component={r.component}
                  suite={r.suite}
                  test={r.test}
                  status={r.status}
                  duration={r.duration}
                  isNew={i === results.length - 1 && isRunning}
                />
              ))}
              <div ref={resultsEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Charts */}
      {!isRunning && finalResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <TestSummaryCharts results={finalResults} />
          </CardContent>
        </Card>
      )}

      {/* Full Results Table */}
      {!isRunning && finalResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <TestResultsTable
              tests={finalResults.tests}
              components={finalResults.components.map((c) => c.component)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
