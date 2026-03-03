import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { gte, lte, desc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const group = searchParams.get('group') ?? 'country'; // country | type | countryOverTime

    const conditions = [];
    if (from) conditions.push(gte(events.occurredAt, new Date(from)));
    if (to) conditions.push(lte(events.occurredAt, new Date(to)));

    const allEvents = await db
      .select({
        eventType: events.eventType,
        occurredAt: events.occurredAt,
        actors: events.actors,
      })
      .from(events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(events.occurredAt))
      .limit(5000);

    if (group === 'type') {
      const byType: Record<string, number> = {};
      for (const e of allEvents) {
        byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
      }
      return NextResponse.json({
        byType: Object.entries(byType).map(([name, count]) => ({ name, count })),
      });
    }

    if (group === 'countryOverTime') {
      const byDate: Record<string, Record<string, number>> = {};
      for (const e of allEvents) {
        const d = new Date(e.occurredAt).toISOString().slice(0, 10);
        if (!byDate[d]) byDate[d] = {};
        const actors = (e.actors as string[]) ?? [];
        for (const a of actors) {
          byDate[d][a] = (byDate[d][a] ?? 0) + 1;
        }
      }
      return NextResponse.json({ byDate });
    }

    const byCountry: Record<string, number> = {};
    for (const e of allEvents) {
      const actors = (e.actors as string[]) ?? [];
      for (const a of actors) {
        byCountry[a] = (byCountry[a] ?? 0) + 1;
      }
    }
    return NextResponse.json({
      byCountry: Object.entries(byCountry).map(([name, count]) => ({ name, count })),
    });
  } catch (e) {
    console.error('API stats GET failed', e);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
