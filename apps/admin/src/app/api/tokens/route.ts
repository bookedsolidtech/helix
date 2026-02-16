import { NextResponse } from 'next/server';
import { buildTokenResponse } from '@/lib/token-api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tokens
 * Returns the complete design token payload: all light tokens, dark overrides,
 * category groupings, and summary statistics.
 */
export async function GET(): Promise<NextResponse> {
  const response = buildTokenResponse();
  return NextResponse.json(response);
}
