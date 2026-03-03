/**
 * Cron endpoint for RSS ingest. Call periodically (e.g. Vercel Cron or cron-job.org).
 * Protected by CRON_SECRET: Vercel sends Authorization: Bearer <CRON_SECRET>; or send x-cron-secret header.
 */
import { NextResponse } from 'next/server';
import { ingestRss } from '@/lib/ingest/rss';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ') && auth.slice(7) === secret) return true;
  if (request.headers.get('x-cron-secret') === secret) return true;
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await ingestRss();
    return NextResponse.json({
      ok: true,
      added: result.added,
      errors: result.errors,
    });
  } catch (e) {
    console.error('Cron ingest failed', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Ingest failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
