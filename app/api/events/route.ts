import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { events, sources } from '@/lib/db/schema';
import { desc, eq, sql, and, gte, lte, ilike, or } from 'drizzle-orm';

const eventTypeValues = [
  'breaking_news',
  'official_statement',
  'diplomatic',
  'military',
  'humanitarian',
  'fact_check',
] as const;

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';
    const eventType = searchParams.get('eventType') ?? '';
    const actor = searchParams.get('actor') ?? '';
    const sourceType = searchParams.get('sourceType') ?? '';
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    const conditions = [];

    if (q.trim()) {
      conditions.push(
        or(
          ilike(events.title, `%${q.trim()}%`),
          ilike(events.body, `%${q.trim()}%`)
        )!
      );
    }
    if (eventType && eventTypeValues.includes(eventType as (typeof eventTypeValues)[number])) {
      conditions.push(eq(events.eventType, eventType));
    }
    if (actor.trim()) {
      conditions.push(
        sql`${events.actors} @> ${JSON.stringify([actor.trim()])}::jsonb`
      );
    }
    if (sourceType) {
      conditions.push(eq(sources.type, sourceType));
    }
    if (from) {
      conditions.push(gte(events.occurredAt, new Date(from)));
    }
    if (to) {
      conditions.push(lte(events.occurredAt, new Date(to)));
    }

    let query = db
      .select({
        id: events.id,
        title: events.title,
        body: events.body,
        eventType: events.eventType,
        occurredAt: events.occurredAt,
        ingestedAt: events.ingestedAt,
        sourceId: events.sourceId,
        sourceUrl: events.sourceUrl,
        location: events.location,
        lat: events.lat,
        lon: events.lon,
        actors: events.actors,
        escalationLevel: events.escalationLevel,
        isUnconfirmed: events.isUnconfirmed,
        sourceName: sources.name,
        sourceType: sources.type,
      })
      .from(events)
      .leftJoin(sources, eq(events.sourceId, sources.id))
      .$dynamic();

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query
      .orderBy(desc(events.occurredAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      events: rows,
      nextOffset: offset + rows.length,
    });
  } catch (e) {
    console.error('API events GET failed', e);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
