import { NextResponse } from 'next/server';
import { loadIssues, saveIssues } from '@/lib/issues-loader';
import type {
  TrackedIssue,
  IssueStatus,
  Severity,
  IssueCategory,
  IssueSource,
} from '@/types/issues';

export const dynamic = 'force-dynamic';

/**
 * GET /api/issues
 * Returns a filtered, sorted list of tracked issues.
 *
 * Query params:
 *  - severity: filter by severity level
 *  - status: filter by issue status
 *  - category: filter by issue category
 *  - reporter: filter by reporter name
 *  - search: case-insensitive match against title, description, reporter, id
 *  - sort: field name to sort by (default: "createdAt")
 *  - order: "asc" or "desc" (default: "desc")
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const reporter = searchParams.get('reporter');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    const data = loadIssues();
    let filtered = [...data.issues];

    if (severity) {
      filtered = filtered.filter((issue) => issue.severity === severity);
    }

    if (status) {
      filtered = filtered.filter((issue) => issue.status === status);
    }

    if (category) {
      filtered = filtered.filter((issue) => issue.category === category);
    }

    if (reporter) {
      filtered = filtered.filter(
        (issue) => issue.reporter.toLowerCase() === reporter.toLowerCase(),
      );
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.title.toLowerCase().includes(term) ||
          issue.description.toLowerCase().includes(term) ||
          issue.reporter.toLowerCase().includes(term) ||
          issue.id.toLowerCase().includes(term),
      );
    }

    filtered.sort((a, b) => {
      const aRecord = a as unknown as Record<string, unknown>;
      const bRecord = b as unknown as Record<string, unknown>;
      const aVal = String(aRecord[sort] ?? '');
      const bVal = String(bRecord[sort] ?? '');
      const cmp = aVal.localeCompare(bVal);
      return order === 'asc' ? cmp : -cmp;
    });

    return NextResponse.json({
      total: data.issues.length,
      filtered: filtered.length,
      issues: filtered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to load issues', detail: message }, { status: 500 });
  }
}

interface CreateIssueBody {
  title: string;
  description: string;
  severity: Severity;
  category: IssueCategory;
  tags?: string[];
  impact?: string;
  recommendation?: string;
  effort?: string;
  owner?: string;
}

/**
 * POST /api/issues
 * Creates a new manually-reported issue.
 *
 * Body (JSON):
 *  - title (required)
 *  - description (required)
 *  - severity (required)
 *  - category (required)
 *  - tags, impact, recommendation, effort, owner (optional)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateIssueBody;

    if (!body.title || !body.description || !body.severity || !body.category) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['title', 'description', 'severity', 'category'],
        },
        { status: 400 },
      );
    }

    const data = loadIssues();

    // Generate id: MANUAL-<SEVERITY>-<NNN>
    const prefix = `MANUAL-${body.severity.toUpperCase()}`;
    const existingWithPrefix = data.issues.filter((issue) => issue.id.startsWith(prefix));
    const nextNum = existingWithPrefix.length + 1;
    const id = `${prefix}-${String(nextNum).padStart(3, '0')}`;

    const now = new Date().toISOString();
    const source: IssueSource = 'manual';
    const status: IssueStatus = 'not-started';

    const newIssue: TrackedIssue = {
      id,
      title: body.title,
      description: body.description,
      severity: body.severity,
      category: body.category,
      tags: body.tags ?? [],
      status,
      statusHistory: [],
      source,
      reporter: 'manual',
      firstSeenIn: now,
      lastSeenIn: now,
      impact: body.impact,
      recommendation: body.recommendation,
      effort: body.effort,
      owner: body.owner,
      createdAt: now,
      updatedAt: now,
    };

    data.issues.push(newIssue);
    saveIssues(data);

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to create issue', detail: message }, { status: 500 });
  }
}
