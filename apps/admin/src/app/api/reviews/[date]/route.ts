import { NextResponse } from 'next/server';
import { loadReview } from '@/lib/issues-loader';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ date: string }>;
}

/**
 * GET /api/reviews/[date]
 * Returns a single review by its date (e.g. "2026-02-15").
 * Returns 404 if the review file does not exist.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { date } = await params;
    const review = loadReview(date);

    if (!review) {
      return NextResponse.json({ error: `Review for date "${date}" not found.` }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to load review', detail: message }, { status: 500 });
  }
}
