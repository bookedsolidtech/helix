import { spawn } from "node:child_process";
import { resolve } from "node:path";

export const dynamic = "force-dynamic";

/**
 * POST /api/tests/run
 * Spawns vitest and streams results as SSE events.
 */
export async function POST(): Promise<Response> {
  const libraryRoot = resolve(process.cwd(), "../../packages/hx-library");

  const encoder = new TextEncoder();
  let passedTests = 0;
  let failedTests = 0;
  let completedTests = 0;

  const stream = new ReadableStream({
    start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      send({ type: "started", message: "Test run starting..." });

      const child = spawn("npx", [
        "vitest", "run",
        "--reporter=verbose",
        "--reporter=json",
        `--outputFile.json=.cache/test-results.json`,
      ], {
        cwd: libraryRoot,
        env: { ...process.env, FORCE_COLOR: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      child.stdout.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Parse vitest verbose output lines
          // Format: ✓ src/components/wc-button/wc-button.test.ts > Suite > Test Name 12ms
          // Format: × src/components/wc-button/wc-button.test.ts > Suite > Test Name 5ms
          const passMatch = trimmed.match(
            /[✓✔]\s+src\/components\/(wc-[^/]+)\/[^>]+>\s+(.+?)\s+>\s+(.+?)\s+(\d+)ms/
          );
          const failMatch = trimmed.match(
            /[×✗]\s+src\/components\/(wc-[^/]+)\/[^>]+>\s+(.+?)\s+>\s+(.+?)\s+(\d+)ms/
          );

          if (passMatch) {
            completedTests++;
            passedTests++;
            send({
              type: "result",
              component: passMatch[1],
              suite: passMatch[2],
              test: passMatch[3],
              status: "pass",
              duration: parseInt(passMatch[4], 10),
              completed: completedTests,
            });
          } else if (failMatch) {
            completedTests++;
            failedTests++;
            send({
              type: "result",
              component: failMatch[1],
              suite: failMatch[2],
              test: failMatch[3],
              status: "fail",
              duration: parseInt(failMatch[4], 10),
              completed: completedTests,
            });
          }

          // Parse test count from summary line (for future progress reporting)
          // Format: "Tests  110 passed (110)"  or  "Tests  108 passed | 2 failed (110)"
        }
      });

      child.stderr.on("data", (_chunk: Buffer) => {
        // stderr captured but not forwarded to client
      });

      child.on("close", (code) => {
        send({
          type: "complete",
          passed: passedTests,
          failed: failedTests,
          total: completedTests,
          exitCode: code,
        });
        controller.close();
      });

      child.on("error", (err) => {
        send({
          type: "error",
          message: err.message,
        });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
