import { NextResponse } from 'next/server';
import { buildCategoryResponse } from '@/lib/token-api';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ category: string }>;
}

/**
 * GET /api/tokens/[category]
 * Returns tokens for a specific category (e.g., color, space, font).
 *
 * Color tokens are enriched with resolved hex values and contrast colors.
 * Returns 404 if the category does not exist in the token system.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const { category } = await params;
  const response = buildCategoryResponse(category);

  if (!response) {
    return NextResponse.json(
      {
        error: `Category "${category}" not found.`,
        hint: 'Use GET /api/tokens to see available categories.',
      },
      { status: 404 },
    );
  }

  return NextResponse.json(response);
}
