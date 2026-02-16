import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { globSync } from 'node:fs';
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Vercel

/**
 * POST /api/tests/run
 *
 * Runs vitest per-component-file sequentially and streams results as SSE.
 *
 * Why per-file? Vitest browser mode (Playwright/Chromium) buffers all verbose
 * stdout internally and delivers it in one burst when the entire suite completes.
 * By running each test file as a separate vitest invocation with --reporter=json,
 * we get deterministic progress boundaries: each file completes, we parse its JSON
 * output, and immediately stream the results to the client.
 *
 * SSE event types:
 *   - started:            { type, message, totalFiles, files[] }
 *   - heartbeat:          { type, elapsed, phase, completedFiles, totalFiles, completedTests, passed, failed }
 *   - component-start:    { type, component, fileIndex, totalFiles }
 *   - result:             { type, component, suite, test, status, duration, completed }
 *   - component-complete: { type, component, passed, failed, total, duration, fileIndex }
 *   - complete:           { type, passed, failed, total, duration, exitCode }
 *   - error:              { type, message }
 */
export async function POST(): Promise<Response> {
  const libraryRoot = resolve(process.cwd(), '../../packages/hx-library');

  const encoder = new TextEncoder();
  const startTime = Date.now();

  // Discover test files
  const testFiles = globSync('src/components/hx-*/hx-*.test.ts', {
    cwd: libraryRoot,
  }).sort();

  const stream = new ReadableStream({
    start(controller) {
      // Flush proxy buffers with a 2KB SSE comment
      controller.enqueue(encoder.encode(`: ${' '.repeat(2048)}\n\n`));

      let totalPassed = 0;
      let totalFailed = 0;
      let totalCompleted = 0;
      let completedFiles = 0;
      let aborted = false;

      function send(data: Record<string, unknown>) {
        if (aborted) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          aborted = true;
        }
      }

      // Extract component name from path like "src/components/hx-button/hx-button.test.ts"
      function componentFromPath(filePath: string): string {
        const match = filePath.match(/components\/(hx-[\w-]+)\//);
        return match?.[1] ?? 'unknown';
      }

      send({
        type: 'started',
        message: 'Launching browser test runner...',
        totalFiles: testFiles.length,
        files: testFiles.map((f) => componentFromPath(f)),
      });

      // Heartbeat keeps the connection alive
      const heartbeat = setInterval(() => {
        send({
          type: 'heartbeat',
          elapsed: Date.now() - startTime,
          phase:
            completedFiles === 0
              ? 'starting'
              : completedFiles < testFiles.length
                ? 'running'
                : 'finishing',
          completedFiles,
          totalFiles: testFiles.length,
          completedTests: totalCompleted,
          passed: totalPassed,
          failed: totalFailed,
        });
      }, 500);

      // Ensure .cache directory exists
      const cacheDir = resolve(libraryRoot, '.cache');
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }

      // Run each test file sequentially
      const perFileResults: VitestFileJson[] = [];

      async function runFile(filePath: string, fileIndex: number): Promise<number> {
        const component = componentFromPath(filePath);
        const outputFile = resolve(cacheDir, `test-results-${component}.json`);

        send({
          type: 'component-start',
          component,
          fileIndex,
          totalFiles: testFiles.length,
        });

        return new Promise<number>((resolvePromise) => {
          const child = spawn(
            'npx',
            ['vitest', 'run', filePath, '--reporter=json', `--outputFile.json=${outputFile}`],
            {
              cwd: libraryRoot,
              env: { ...process.env, FORCE_COLOR: '0', CI: 'true' },
              stdio: ['ignore', 'pipe', 'pipe'],
            },
          );

          // We don't need stdout for parsing (we read the JSON file),
          // but we must consume the streams to prevent backpressure stalls.
          child.stdout.resume();
          child.stderr.resume();

          child.on('close', (code) => {
            // Parse the JSON output file
            let fileResult: VitestFileJson | null = null;
            try {
              if (existsSync(outputFile)) {
                const raw = readFileSync(outputFile, 'utf-8');
                fileResult = JSON.parse(raw) as VitestFileJson;
                perFileResults.push(fileResult);
              }
            } catch {
              // JSON parse failed -- file may be incomplete on test crash
            }

            let filePassed = 0;
            let fileFailed = 0;
            let fileTotal = 0;
            let fileDuration = 0;

            if (fileResult?.testResults) {
              for (const testFile of fileResult.testResults) {
                for (const assertion of testFile.assertionResults) {
                  const status: 'pass' | 'fail' | 'skip' =
                    assertion.status === 'passed'
                      ? 'pass'
                      : assertion.status === 'failed'
                        ? 'fail'
                        : 'skip';
                  const duration = assertion.duration ?? 0;
                  const suite =
                    assertion.ancestorTitles[1] ?? assertion.ancestorTitles[0] ?? 'default';

                  totalCompleted++;
                  fileTotal++;
                  fileDuration += duration;

                  if (status === 'pass') {
                    totalPassed++;
                    filePassed++;
                  } else if (status === 'fail') {
                    totalFailed++;
                    fileFailed++;
                  }

                  send({
                    type: 'result',
                    component,
                    suite,
                    test: assertion.title,
                    status,
                    duration,
                    completed: totalCompleted,
                  });
                }
              }
            }

            completedFiles++;

            send({
              type: 'component-complete',
              component,
              passed: filePassed,
              failed: fileFailed,
              total: fileTotal,
              duration: fileDuration,
              fileIndex,
            });

            resolvePromise(code ?? 1);
          });

          child.on('error', (err) => {
            completedFiles++;
            send({
              type: 'component-complete',
              component,
              passed: 0,
              failed: 0,
              total: 0,
              duration: 0,
              fileIndex,
              error: err.message,
            });
            resolvePromise(1);
          });
        });
      }

      // Run all files sequentially, then finalize
      (async () => {
        let hasFailures = false;

        for (let i = 0; i < testFiles.length; i++) {
          if (aborted) break;
          const exitCode = await runFile(testFiles[i], i);
          if (exitCode !== 0) hasFailures = true;
        }

        // Merge per-file JSON results into canonical output
        try {
          const merged = mergeResults(perFileResults);
          writeFileSync(resolve(cacheDir, 'test-results.json'), JSON.stringify(merged, null, 2));
        } catch {
          // Non-fatal: summary view will use whatever was last written
        }

        // Clean up per-component temp files
        for (const file of testFiles) {
          const component = componentFromPath(file);
          const tmpFile = resolve(cacheDir, `test-results-${component}.json`);
          try {
            if (existsSync(tmpFile)) {
              unlinkSync(tmpFile);
            }
          } catch {
            // Non-fatal
          }
        }

        clearInterval(heartbeat);

        send({
          type: 'complete',
          passed: totalPassed,
          failed: totalFailed,
          total: totalCompleted,
          duration: Date.now() - startTime,
          exitCode: hasFailures ? 1 : 0,
        });

        try {
          controller.close();
        } catch {
          // Already closed
        }
      })().catch((err: Error) => {
        clearInterval(heartbeat);
        send({ type: 'error', message: err.message });
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}

// ── Vitest JSON types (subset we need) ──────────────────────────────────

interface VitestAssertionResult {
  ancestorTitles: string[];
  title: string;
  fullName: string;
  status: 'passed' | 'failed' | 'pending';
  duration: number | null;
  failureMessages: string[];
  meta?: Record<string, unknown>;
}

interface VitestTestResult {
  assertionResults: VitestAssertionResult[];
  startTime: number;
  endTime: number;
  status: string;
  message: string;
  name: string;
}

interface VitestFileJson {
  numTotalTestSuites: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  numPendingTestSuites: number;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  startTime: number;
  success: boolean;
  testResults: VitestTestResult[];
  snapshot?: Record<string, unknown>;
  coverageMap?: Record<string, unknown>;
}

// ── Merge per-file JSON results ─────────────────────────────────────────

function mergeResults(fileResults: VitestFileJson[]): VitestFileJson {
  if (fileResults.length === 0) {
    return {
      numTotalTestSuites: 0,
      numPassedTestSuites: 0,
      numFailedTestSuites: 0,
      numPendingTestSuites: 0,
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      startTime: Date.now(),
      success: true,
      testResults: [],
    };
  }

  const merged: VitestFileJson = {
    numTotalTestSuites: 0,
    numPassedTestSuites: 0,
    numFailedTestSuites: 0,
    numPendingTestSuites: 0,
    numTotalTests: 0,
    numPassedTests: 0,
    numFailedTests: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    startTime: Math.min(...fileResults.map((r) => r.startTime)),
    success: fileResults.every((r) => r.success),
    testResults: [],
    snapshot: {},
  };

  for (const result of fileResults) {
    merged.numTotalTestSuites += result.numTotalTestSuites;
    merged.numPassedTestSuites += result.numPassedTestSuites;
    merged.numFailedTestSuites += result.numFailedTestSuites;
    merged.numPendingTestSuites += result.numPendingTestSuites;
    merged.numTotalTests += result.numTotalTests;
    merged.numPassedTests += result.numPassedTests;
    merged.numFailedTests += result.numFailedTests;
    merged.numPendingTests += result.numPendingTests;
    merged.numTodoTests += result.numTodoTests;
    merged.testResults.push(...result.testResults);
  }

  return merged;
}
