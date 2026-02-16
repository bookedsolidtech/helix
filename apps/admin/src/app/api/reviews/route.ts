import { NextResponse } from 'next/server';
import { loadReviewsIndex } from '@/lib/issues-loader';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews
 * Returns the reviews index containing all review snapshots.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const index = loadReviewsIndex();
    return NextResponse.json(index);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to load reviews index', detail: message },
      { status: 500 },
    );
  }
}
