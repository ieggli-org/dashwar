import { getDb } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { runMigrations } from '@/lib/db/migrate';
import { seedMockData } from '@/lib/ingest/mock';
import { ingestRss } from '@/lib/ingest/rss';
import { and, eq, or, like } from 'drizzle-orm';

/** Base URLs of RSS feeds; we clear only breaking_news from these to avoid old unfiltered items. */
const RSS_SOURCE_BASE_URLS = [
  'https://g1.globo.com',
  'https://reuters.com',
  'https://apnews.com',
];

async function main() {
  try {
    await runMigrations();
    const db = getDb();
    if (process.env.CLEAR_RSS_BREAKING_NEWS === '1') {
      const conditions = RSS_SOURCE_BASE_URLS.map((base) => like(events.sourceUrl ?? '', `${base}%`));
      await db
        .delete(events)
        .where(and(eq(events.eventType, 'breaking_news'), or(...conditions)));
      console.log('Cleared previous RSS-sourced breaking_news events.');
    }
    await seedMockData();
    console.log('Ingest (mock seed) completed.');
    const rss = await ingestRss();
    console.log(`RSS ingest: ${rss.added} new event(s).`);
    if (rss.errors.length > 0) {
      rss.errors.forEach((e) => console.warn('RSS feed error:', e));
    }
  } catch (e) {
    console.error('Ingest failed', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
