import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sources } from '@/lib/db/schema';

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(sources).orderBy(sources.name);
    return NextResponse.json({ sources: rows });
  } catch (e) {
    console.error('API sources GET failed', e);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 }
    );
  }
}
