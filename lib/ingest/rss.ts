/**
 * Ingest events from RSS/Atom feeds. Polls configured feeds and inserts new
 * items as events (deduplicated by source_url).
 */
import Parser from 'rss-parser';
import { getDb } from '@/lib/db';
import { events, sources } from '@/lib/db/schema';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Dashwar/1.0 (Conflict news aggregator; +https://github.com/ieggli-org/dashwar)',
  },
});

type FeedConfig = { url: string; sourceBaseUrl: string };

/** World / Middle East feeds only; general domestic feeds (e.g. G1 main) excluded to reduce noise. */
const RSS_FEEDS: FeedConfig[] = [
  { url: 'https://g1.globo.com/dynamo/mundo/rss2.xml', sourceBaseUrl: 'https://g1.globo.com' },
  { url: 'https://feeds.reuters.com/reuters/worldNews', sourceBaseUrl: 'https://reuters.com' },
  { url: 'https://feeds.reuters.com/reuters/MiddleEastNews', sourceBaseUrl: 'https://reuters.com' },
  { url: 'https://apnews.com/apf-topnews/rss.xml', sourceBaseUrl: 'https://apnews.com' },
  { url: 'https://apnews.com/apf-worldnews/rss.xml', sourceBaseUrl: 'https://apnews.com' },
];

const EVENT_TYPE = 'breaking_news' as const;

/**
 * Only items that contain at least one of these terms are included.
 * Kept narrow to avoid unrelated news (e.g. "war", "Trump", "USA" match too much).
 */
const CONFLICT_PRIMARY_TERMS = [
  'israel',
  'israeli',
  'israelense',
  'iran',
  'irã',
  'iranian',
  'iraniano',
  'teerã',
  'tehran',
  'tel aviv',
  'gaza',
  'hamas',
  'hezbollah',
  'houthi',
  'idf',
  'israel-irã',
  'israel-iran',
  'israel e irã',
  'israel e iran',
  'israelenses',
  'forças israelenses',
  'israeli forces',
  'gaza strip',
  'faixa de gaza',
  'houthis',
  'yemen', // Houthi conflict
  'líbano',
  'lebanon', // Hezbollah
  'west bank',
  'cisjordânia',
  'jerusalém',
  'jerusalem',
];

function isConflictRelevant(title: string, _body: string | null): boolean {
  const titleLower = title.toLowerCase();
  return CONFLICT_PRIMARY_TERMS.some((term) => titleLower.includes(term));
}

function findSourceIdByUrl(
  sourceRows: Array<{ id: string; baseUrl: string | null }>,
  itemUrl: string | null
): string | null {
  if (!itemUrl) return sourceRows[0]?.id ?? null;
  const normalized = itemUrl.toLowerCase();
  const withBase = sourceRows
    .filter((s) => s.baseUrl && normalized.startsWith(s.baseUrl.toLowerCase()))
    .sort((a, b) => (b.baseUrl?.length ?? 0) - (a.baseUrl?.length ?? 0));
  return withBase[0]?.id ?? sourceRows[0]?.id ?? null;
}

function parseDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function ingestRss(): Promise<{ added: number; errors: string[] }> {
  const db = getDb();
  const sourceRows = await db.select({ id: sources.id, baseUrl: sources.baseUrl }).from(sources);
  if (sourceRows.length === 0) {
    return { added: 0, errors: ['No sources in DB'] };
  }

  const existingUrls = new Set(
    (await db.select({ sourceUrl: events.sourceUrl }).from(events))
      .map((r) => r.sourceUrl)
      .filter((u): u is string => !!u)
  );

  let added = 0;
  const errors: string[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const feedXml = await parser.parseURL(feed.url);
      const items = feedXml.items ?? [];
      const sourceId = findSourceIdByUrl(sourceRows, feed.sourceBaseUrl) ?? sourceRows[0]!.id;

      for (const item of items) {
        const link = item.link?.trim();
        if (!link || existingUrls.has(link)) continue;

        const title = (item.title ?? '').trim();
        if (!title) continue;

        const body = (item.contentSnippet ?? item.content ?? item.summary ?? '').trim().slice(0, 2000) || null;
        if (!isConflictRelevant(title, body)) continue;

        const occurredAt = parseDate(item.pubDate ?? item.isoDate ?? undefined);

        await db.insert(events).values({
          title,
          body,
          eventType: EVENT_TYPE,
          occurredAt,
          sourceId,
          sourceUrl: link,
          location: null,
          lat: null,
          lon: null,
          actors: [],
          isUnconfirmed: false,
        });
        existingUrls.add(link);
        added++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${feed.url}: ${msg}`);
    }
  }

  return { added, errors };
}
