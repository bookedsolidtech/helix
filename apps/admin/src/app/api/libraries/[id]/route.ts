import { NextResponse } from 'next/server';
import { getLibrary, updateLibrary, removeLibrary } from '@/lib/library-registry';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/libraries/[id]
 * Returns a single library entry by ID.
 * Returns 404 if not found.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const library = getLibrary(id);

    if (!library) {
      return NextResponse.json({ error: `Library "${id}" not found.` }, { status: 404 });
    }

    return NextResponse.json(library);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to load library', detail: message }, { status: 500 });
  }
}

interface PatchLibraryBody {
  name?: string;
  prefix?: string;
  cemPath?: string;
  packageName?: string;
  version?: string;
  isDefault?: boolean;
  lastScored?: string | null;
  componentCount?: number;
}

/**
 * PATCH /api/libraries/[id]
 * Partially updates an existing library entry.
 *
 * Body (JSON): any subset of library fields (except id)
 */
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchLibraryBody;

    const updated = updateLibrary(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update library', detail: message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/libraries/[id]
 * Removes a library entry by ID.
 * Returns 400 if the library is the default.
 * Returns 404 if not found.
 */
export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    removeLibrary(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    if (message.includes('Cannot remove the default library')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete library', detail: message },
      { status: 500 },
    );
  }
}
