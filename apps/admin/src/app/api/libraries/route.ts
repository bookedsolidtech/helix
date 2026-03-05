import { NextResponse } from 'next/server';
import { getRegistry, addLibrary } from '@/lib/library-registry';
import type { LibrarySource } from '@/lib/library-registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/libraries
 * Returns all library entries from the registry as a JSON array.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const libraries = getRegistry();
    return NextResponse.json(libraries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to load libraries', details: [message] },
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

    const validationErrors: string[] = [];

    if (!body.name) validationErrors.push('name is required');
    if (!body.source) validationErrors.push('source is required');
    if (!body.prefix) validationErrors.push('prefix is required');

    if (body.source === 'local' && !body.cemPath) {
      validationErrors.push('cemPath is required for local libraries');
    }

    if ((body.source === 'cdn' || body.source === 'npm') && !body.packageName) {
      validationErrors.push('packageName is required for cdn and npm libraries');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
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
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message, details: [message] }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to add library', details: [message] },
      { status: 500 },
    );
  }
}
