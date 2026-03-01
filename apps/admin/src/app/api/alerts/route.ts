/**
 * Alert configuration REST API.
 * GET  /api/alerts — return current alert config
 * POST /api/alerts — save new alert config
 */
import { NextResponse } from 'next/server';
import { loadAlertConfig, saveAlertConfig, type AlertConfig } from '@/lib/alert-config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/alerts
 * Returns the current alert configuration.
 */
export function GET(): NextResponse {
  try {
    const config = loadAlertConfig();
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load alert config', detail: message }, { status: 500 });
  }
}

interface AlertConfigBody {
  webhookUrl?: unknown;
  emailRecipients?: unknown;
  healthThreshold?: unknown;
  enabled?: unknown;
}

/**
 * POST /api/alerts
 * Saves a new alert configuration.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as AlertConfigBody;

    if (typeof body.webhookUrl !== 'string') {
      return NextResponse.json({ error: 'webhookUrl must be a string' }, { status: 400 });
    }
    if (!Array.isArray(body.emailRecipients)) {
      return NextResponse.json({ error: 'emailRecipients must be an array' }, { status: 400 });
    }
    if (typeof body.healthThreshold !== 'number') {
      return NextResponse.json({ error: 'healthThreshold must be a number' }, { status: 400 });
    }
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
    }

    const config: AlertConfig = {
      webhookUrl: body.webhookUrl,
      emailRecipients: (body.emailRecipients as unknown[]).filter(
        (e): e is string => typeof e === 'string',
      ),
      healthThreshold: Math.max(0, Math.min(100, body.healthThreshold)),
      enabled: body.enabled,
    };

    saveAlertConfig(config);
    return NextResponse.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save alert config', detail: message }, { status: 500 });
  }
}
