/**
 * Appends 1–3 new mock events with current timestamp so the feed shows "new" items
 * when run periodically (e.g. every 15 min). Run from cron or a loop in the container.
 */
import { getDb } from '@/lib/db';
import { events, sources } from '@/lib/db/schema';

const RECENT_POOL: Array<{
  title: string;
  body: string;
  eventType: 'breaking_news' | 'official_statement' | 'diplomatic' | 'military' | 'humanitarian' | 'fact_check';
  sourceUrl: string;
  location: string | null;
  actors: string[];
  isUnconfirmed: boolean;
}> = [
  { title: 'Regional update: situation monitoring', body: 'Ongoing monitoring and assessment of the situation. Further statements expected.', eventType: 'breaking_news', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: [], isUnconfirmed: false },
  { title: 'Official briefing expected', body: 'Government officials to brief on latest developments.', eventType: 'official_statement', sourceUrl: 'https://apnews.com/world-news', location: null, actors: ['USA'], isUnconfirmed: false },
  { title: 'UN Security Council meeting on agenda', body: 'Session to discuss latest developments and possible measures.', eventType: 'diplomatic', sourceUrl: 'https://news.un.org', location: null, actors: ['UN'], isUnconfirmed: false },
  { title: 'Diplomatic contacts continue', body: 'Multiple capitals in contact to support de-escalation efforts.', eventType: 'diplomatic', sourceUrl: 'https://eeas.europa.eu', location: null, actors: ['EU'], isUnconfirmed: false },
  { title: 'Humanitarian access discussed', body: 'Aid agencies and partners discuss access and delivery.', eventType: 'humanitarian', sourceUrl: 'https://news.un.org', location: null, actors: ['UN'], isUnconfirmed: false },
  { title: 'G1: Última hora sobre a situação', body: 'Acompanhe as últimas atualizações no G1. Israel e Irã trocaram novos bombardeios.', eventType: 'breaking_news', sourceUrl: 'https://g1.globo.com/mundo/ao-vivo/eua-ataque-ira.ghtml', location: null, actors: ['Israel', 'Iran'], isUnconfirmed: false },
  { title: 'War.gov situational update', body: 'Latest official bulletin from War.gov News.', eventType: 'official_statement', sourceUrl: 'https://www.war.gov/News/', location: null, actors: ['USA'], isUnconfirmed: false },
];

function findSourceIdByUrl(
  sourceRows: Array<{ id: string; baseUrl: string | null }>,
  eventUrl: string | null
): string | null {
  if (!eventUrl) return sourceRows[0]?.id ?? null;
  const normalized = eventUrl.toLowerCase();
  const withBase = sourceRows
    .filter((s) => s.baseUrl && normalized.startsWith(s.baseUrl.toLowerCase()))
    .sort((a, b) => (b.baseUrl?.length ?? 0) - (a.baseUrl?.length ?? 0));
  return withBase[0]?.id ?? sourceRows[0]?.id ?? null;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  try {
    const db = getDb();
    const sourceRows = await db.select({ id: sources.id, baseUrl: sources.baseUrl }).from(sources);
    if (sourceRows.length === 0) {
      console.log('append-recent: no sources, skip.');
      process.exit(0);
      return;
    }
    const toAdd = pickRandom(RECENT_POOL, 1 + Math.floor(Math.random() * 2));
    const now = new Date();
    const values = toAdd.map((e) => ({
      title: e.title,
      body: e.body,
      eventType: e.eventType,
      occurredAt: now,
      sourceId: findSourceIdByUrl(sourceRows, e.sourceUrl),
      sourceUrl: e.sourceUrl,
      location: e.location,
      actors: e.actors,
      isUnconfirmed: e.isUnconfirmed,
      lat: null,
      lon: null,
    }));
    await db.insert(events).values(values);
    console.log(`append-recent: added ${values.length} event(s) at ${now.toISOString()}`);
  } catch (e) {
    console.error('append-recent failed', e);
    process.exit(1);
  }
  process.exit(0);
}

main();
