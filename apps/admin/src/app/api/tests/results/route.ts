import { NextResponse } from 'next/server';
import { getAllTestResults } from '@/lib/test-results-reader';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tests/results
 * Returns the cached test results from the last vitest run.
 */
export async function GET(): Promise<NextResponse> {
  const results = getAllTestResults();

  if (!results) {
    return NextResponse.json({ error: 'No test results found. Run tests first.' }, { status: 404 });
  }

  return NextResponse.json(results);
}
