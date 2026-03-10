import { NextResponse } from 'next/server';
import { getRegistry, addLibrary } from '@/lib/library-registry';
import type { LibrarySource } from '@/lib/library-registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/libraries
 * Returns all library entries from the registry.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const libraries = getRegistry();
    return NextResponse.json({ libraries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to load libraries', detail: message },
      { status: 500 },
    );
  }
}

interface CreateLibraryBody {
  name: string;
  source: LibrarySource;
  prefix: string;
  cemPath?: string;
  packageName?: string;
  version?: string;
  isDefault?: boolean;
}

/**
 * POST /api/libraries
 * Adds a new library entry to the registry.
 *
 * Body (JSON):
 *  - name (required)
 *  - source (required): "local" | "cdn" | "npm"
 *  - prefix (required): tag prefix, e.g. "hx-"
 *  - cemPath (required when source is "local")
 *  - packageName (required when source is "cdn" or "npm")
 *  - version (optional)
 *  - isDefault (optional, defaults to false)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateLibraryBody;

    if (!body.name || !body.source || !body.prefix) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['name', 'source', 'prefix'],
        },
        { status: 400 },
      );
    }

    if (body.source === 'local' && !body.cemPath) {
      return NextResponse.json(
        { error: 'cemPath is required for local libraries' },
        { status: 400 },
      );
    }

    if ((body.source === 'cdn' || body.source === 'npm') && !body.packageName) {
      return NextResponse.json(
        { error: 'packageName is required for cdn and npm libraries' },
        { status: 400 },
      );
    }

    const newEntry = addLibrary({
      name: body.name,
      source: body.source,
      prefix: body.prefix,
      cemPath: body.cemPath,
      packageName: body.packageName,
      version: body.version,
      isDefault: body.isDefault ?? false,
      lastScored: null,
      componentCount: 0,
    });

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to add library', detail: message }, { status: 500 });
  }
}
