import { NextResponse } from 'next/server';
import { loadIssues, saveIssues } from '@/lib/issues-loader';
import type { IssueStatus, StatusChange } from '@/types/issues';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/issues/[id]
 * Returns a single issue by its id (case-insensitive match).
 * Returns 404 if not found.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const data = loadIssues();
    const issue = data.issues.find((i) => i.id.toLowerCase() === id.toLowerCase());

    if (!issue) {
      return NextResponse.json({ error: `Issue "${id}" not found.` }, { status: 404 });
    }

    return NextResponse.json(issue);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to load issue', detail: message }, { status: 500 });
  }
}

interface PatchIssueBody {
  status?: IssueStatus;
  owner?: string;
  notes?: string;
  tags?: string[];
}

/**
 * PATCH /api/issues/[id]
 * Updates an existing issue. Supports partial updates.
 *
 * Body (JSON):
 *  - status: new issue status (triggers statusHistory entry)
 *  - owner: new owner assignment
 *  - notes: a string to append to the notes array
 *  - tags: array of strings to replace the current tags
 *
 * Status transitions:
 *  - Any status change appends to statusHistory
 *  - Changing to "complete" sets resolvedAt
 *  - Changing FROM "complete" clears resolvedAt
 */
export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchIssueBody;
    const data = loadIssues();

    const issueIndex = data.issues.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());

    if (issueIndex === -1) {
      return NextResponse.json({ error: `Issue "${id}" not found.` }, { status: 404 });
    }

    const issue = data.issues[issueIndex];
    const now = new Date().toISOString();

    // Handle status change
    if (body.status !== undefined && body.status !== issue.status) {
      const change: StatusChange = {
        from: issue.status,
        to: body.status,
        date: now,
        changedBy: 'manual',
      };
      issue.statusHistory.push(change);

      // Set resolvedAt when moving to complete
      if (body.status === 'complete') {
        issue.resolvedAt = now;
      }

      // Clear resolvedAt when moving away from complete
      if (issue.status === 'complete' && body.status !== 'complete') {
        issue.resolvedAt = undefined;
      }

      issue.status = body.status;
    }

    // Handle owner change
    if (body.owner !== undefined) {
      issue.owner = body.owner;
    }

    // Handle notes append
    if (body.notes !== undefined) {
      if (!issue.notes) {
        issue.notes = [];
      }
      issue.notes.push(body.notes);
    }

    // Handle tags replacement
    if (body.tags !== undefined) {
      issue.tags = body.tags;
    }

    issue.updatedAt = now;
    data.issues[issueIndex] = issue;
    saveIssues(data);

    return NextResponse.json(issue);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to update issue', detail: message }, { status: 500 });
  }
}
