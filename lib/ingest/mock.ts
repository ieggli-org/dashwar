import { getDb } from '@/lib/db';
import { events, sources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const MOCK_SOURCES = [
  { name: 'Reuters', type: 'wire' as const, baseUrl: 'https://reuters.com', isVerified: true },
  { name: 'AP News', type: 'wire' as const, baseUrl: 'https://apnews.com', isVerified: true },
  { name: 'CNN', type: 'wire' as const, baseUrl: 'https://cnn.com', isVerified: true },
  { name: 'AFP', type: 'wire' as const, baseUrl: 'https://afp.com', isVerified: true },
  { name: 'Globo (G1)', type: 'wire' as const, baseUrl: 'https://g1.globo.com', isVerified: true },
  { name: 'US State Dept', type: 'official' as const, baseUrl: 'https://state.gov', isVerified: true },
  { name: 'IDF Spokesperson', type: 'official' as const, baseUrl: null, isVerified: true },
  { name: 'UAE Ministry of Foreign Affairs', type: 'official' as const, baseUrl: 'https://mofa.gov.ae', isVerified: true },
  { name: 'UN News', type: 'multilateral' as const, baseUrl: 'https://news.un.org', isVerified: true },
  { name: 'IAEA', type: 'multilateral' as const, baseUrl: 'https://iaea.org', isVerified: true },
  { name: 'EU External Action', type: 'official' as const, baseUrl: 'https://eeas.europa.eu', isVerified: true },
  { name: 'Lebanon MoFA', type: 'official' as const, baseUrl: null, isVerified: true },
  { name: 'Iraq PMO', type: 'official' as const, baseUrl: null, isVerified: true },
  { name: 'War.gov', type: 'official' as const, baseUrl: 'https://www.war.gov', isVerified: true },
  { name: 'ACLED', type: 'ngo' as const, baseUrl: 'https://acleddata.com', isVerified: true },
  { name: 'International Crisis Group', type: 'ngo' as const, baseUrl: 'https://crisisgroup.org', isVerified: true },
  { name: 'X (verified official accounts)', type: 'social' as const, baseUrl: 'https://x.com', isVerified: false },
];

const MOCK_EVENTS = [
  {
    title: 'Israel strikes assembly that will choose new Iranian supreme leader; Iran launches missiles at Tel Aviv',
    body: 'Israel and Iran exchanged new bombardments, with explosions reported across the Middle East on Tuesday. Death toll in Iran rose to 787. US President Donald Trump acknowledged lack of "cutting-edge armaments" to defend against Iranian attacks.',
    eventType: 'military' as const,
    occurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    sourceUrl: 'https://g1.globo.com/mundo/ao-vivo/eua-ataque-ira.ghtml',
    location: 'Iran, Israel',
    actors: ['Israel', 'Iran', 'USA'],
    isUnconfirmed: false,
  },
  {
    title: 'US and allies conduct strikes in region',
    body: 'Joint operation reported by multiple outlets. Official statements pending.',
    eventType: 'military' as const,
    occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://www.reuters.com/world/middle-east/',
    location: 'Regional',
    actors: ['USA', 'Israel'],
    isUnconfirmed: false,
  },
  {
    title: 'Iran issues statement on nuclear program',
    body: 'Official statement from Iranian government regarding IAEA cooperation.',
    eventType: 'official_statement' as const,
    occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://apnews.com/world-news',
    location: 'Iran',
    actors: ['Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'UN Security Council convenes on situation',
    body: 'Emergency session called. Draft resolution discussed.',
    eventType: 'diplomatic' as const,
    occurredAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    sourceUrl: 'https://news.un.org/en/story/2024/01/',
    location: null,
    actors: ['USA', 'Israel', 'Iran', 'UN'],
    isUnconfirmed: false,
  },
  {
    title: 'Reported strike on facility — unconfirmed',
    body: 'Social media reports of strike; no official confirmation yet.',
    eventType: 'breaking_news' as const,
    occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    sourceUrl: 'https://edition.cnn.com/middle-east',
    location: 'Syria',
    lat: '33.5',
    lon: '36.3',
    actors: ['Israel', 'Iran'],
    isUnconfirmed: true,
  },
  {
    title: 'Humanitarian aid convoy reaches area',
    body: 'UN and NGO convoys deliver supplies. Access negotiated.',
    eventType: 'humanitarian' as const,
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sourceUrl: 'https://news.un.org/en/story/2024/01/',
    location: 'Lebanon',
    actors: ['UN'],
    isUnconfirmed: false,
  },
  {
    title: 'Fact-check: Viral claim about casualty figures',
    body: 'Claim widely shared on social media has been fact-checked; numbers not verified.',
    eventType: 'fact_check' as const,
    occurredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    sourceUrl: 'https://www.reuters.com/fact-check/',
    location: null,
    actors: [],
    isUnconfirmed: false,
  },
  {
    title: 'UAE calls for de-escalation',
    body: 'Statement from UAE Ministry of Foreign Affairs urging restraint and dialogue.',
    eventType: 'diplomatic' as const,
    occurredAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    sourceUrl: 'https://mofa.gov.ae',
    location: null,
    actors: ['UAE', 'USA', 'Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'EU discusses sanctions package',
    body: 'European officials meet to coordinate response and possible measures.',
    eventType: 'diplomatic' as const,
    occurredAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    sourceUrl: 'https://eeas.europa.eu',
    location: null,
    actors: ['EU', 'USA', 'Israel', 'Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'Lebanon border tensions reported',
    body: 'Cross-border incidents reported; UNIFIL monitoring.',
    eventType: 'military' as const,
    occurredAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    sourceUrl: 'https://www.reuters.com/world/middle-east/',
    location: 'Lebanon',
    actors: ['Israel', 'Lebanon', 'UN'],
    isUnconfirmed: false,
  },
  {
    title: 'Iraq condemns strikes on its territory',
    body: 'Iraqi government issues statement on reported violations of sovereignty.',
    eventType: 'official_statement' as const,
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sourceUrl: 'https://apnews.com/world-news',
    location: 'Iraq',
    actors: ['Iraq', 'USA', 'Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'Airlines reroute flights away from conflict zone',
    body: 'Major carriers adjust routes over the Eastern Mediterranean and Gulf; insurance and fuel costs rise.',
    eventType: 'breaking_news' as const,
    occurredAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    sourceUrl: 'https://www.reuters.com/business/aerospace-defense/',
    location: null,
    actors: [],
    isUnconfirmed: false,
  },
  {
    title: 'Oil prices jump on escalation fears',
    body: 'Brent and WTI rise as markets price in supply and transit risks.',
    eventType: 'breaking_news' as const,
    occurredAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    sourceUrl: 'https://www.reuters.com/markets/commodities/',
    location: null,
    actors: [],
    isUnconfirmed: false,
  },
  {
    title: 'Defense and conflict updates from official channel',
    body: 'Latest official news and bulletins on conflict and defense. See War.gov News for full coverage.',
    eventType: 'official_statement' as const,
    occurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    sourceUrl: 'https://www.war.gov/News/',
    location: null,
    actors: ['USA'],
    isUnconfirmed: false,
  },
];

/** Real source URLs by canonical title (for fixing old example.com data). */
const TITLE_TO_SOURCE_URL: Record<string, string> = Object.fromEntries(
  MOCK_EVENTS.filter((e) => e.sourceUrl).map((e) => [e.title, e.sourceUrl!])
);

/** More events with real URLs to fill the feed (used for top-up). */
const MORE_EVENTS: Array<{
  title: string;
  body: string;
  eventType: (typeof MOCK_EVENTS)[number]['eventType'];
  sourceUrl: string;
  location: string | null;
  actors: string[];
  isUnconfirmed: boolean;
  hoursAgo: number;
}> = [
  { title: 'US Central Command issues update', body: 'CENTCOM statement on regional operations and force posture.', eventType: 'official_statement', sourceUrl: 'https://www.defense.gov/News/', location: null, actors: ['USA'], isUnconfirmed: false, hoursAgo: 1 },
  { title: 'Hezbollah and IDF exchange fire', body: 'Cross-border shelling reported; UNIFIL urges restraint.', eventType: 'military', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: 'Lebanon', actors: ['Israel', 'Lebanon'], isUnconfirmed: false, hoursAgo: 3 },
  { title: 'Turkey urges regional calm', body: 'Ankara calls for dialogue and de-escalation.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['Turkey'], isUnconfirmed: false, hoursAgo: 5 },
  { title: 'Saudi Arabia reiterates call for restraint', body: 'Official statement on stability in the Gulf.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['Saudi Arabia'], isUnconfirmed: false, hoursAgo: 7 },
  { title: 'Red Cross delivers medical supplies', body: 'ICRC convoy reaches affected area; access negotiated.', eventType: 'humanitarian', sourceUrl: 'https://www.icrc.org/en', location: 'Regional', actors: [], isUnconfirmed: false, hoursAgo: 10 },
  { title: 'Oil tanker traffic monitored in Strait of Hormuz', body: 'Maritime awareness increased; no disruptions reported.', eventType: 'breaking_news', sourceUrl: 'https://www.reuters.com/business/energy/', location: null, actors: [], isUnconfirmed: false, hoursAgo: 12 },
  { title: 'UK Foreign Office updates travel advice', body: 'Advisory for Israel, Iran, Lebanon and neighbouring countries revised.', eventType: 'official_statement', sourceUrl: 'https://www.gov.uk/foreign-travel-advice', location: null, actors: ['UK'], isUnconfirmed: false, hoursAgo: 14 },
  { title: 'France convenes diplomatic meeting', body: 'European and regional envoys discuss de-escalation.', eventType: 'diplomatic', sourceUrl: 'https://eeas.europa.eu', location: null, actors: ['France', 'EU'], isUnconfirmed: false, hoursAgo: 18 },
  { title: 'Germany suspends arms exports to region', body: 'Review of licences announced.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/europe/', location: null, actors: ['Germany'], isUnconfirmed: false, hoursAgo: 20 },
  { title: 'Yemen Houthi statement on Red Sea', body: 'Group issues communiqué on maritime operations.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: 'Yemen', actors: [], isUnconfirmed: false, hoursAgo: 22 },
  { title: 'Jordan requests emergency aid', body: 'Humanitarian corridor and support discussed with partners.', eventType: 'humanitarian', sourceUrl: 'https://news.un.org', location: 'Jordan', actors: ['Jordan', 'UN'], isUnconfirmed: false, hoursAgo: 24 },
  { title: 'Egypt calls for ceasefire', body: 'Cairo urges all parties to halt hostilities.', eventType: 'diplomatic', sourceUrl: 'https://apnews.com/world-news', location: null, actors: ['Egypt'], isUnconfirmed: false, hoursAgo: 26 },
  { title: 'Biden administration briefs Congress', body: 'Closed-door briefing on regional strategy and options.', eventType: 'official_statement', sourceUrl: 'https://apnews.com/politics', location: null, actors: ['USA'], isUnconfirmed: false, hoursAgo: 28 },
  { title: 'NATO discusses regional implications', body: 'Alliance reviews situation; no direct involvement announced.', eventType: 'diplomatic', sourceUrl: 'https://www.nato.int/', location: null, actors: ['NATO'], isUnconfirmed: false, hoursAgo: 30 },
  { title: 'Reported explosion near Baghdad — unconfirmed', body: 'Social media reports; no official confirmation.', eventType: 'breaking_news', sourceUrl: 'https://edition.cnn.com/middle-east', location: 'Iraq', actors: [], isUnconfirmed: true, hoursAgo: 32 },
  { title: 'China urges restraint', body: 'Foreign ministry statement on stability and dialogue.', eventType: 'diplomatic', sourceUrl: 'https://apnews.com/world-news', location: null, actors: ['China'], isUnconfirmed: false, hoursAgo: 34 },
  { title: 'Russia comments on UN draft', body: 'Moscow position on Security Council resolution.', eventType: 'diplomatic', sourceUrl: 'https://news.un.org', location: null, actors: ['Russia'], isUnconfirmed: false, hoursAgo: 36 },
  { title: 'India advises nationals in region', body: 'Travel and safety advisory updated.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/india/', location: null, actors: ['India'], isUnconfirmed: false, hoursAgo: 38 },
  { title: 'Airlines extend cancellations', body: 'Carriers extend suspension of some routes; passengers rebooked.', eventType: 'breaking_news', sourceUrl: 'https://www.reuters.com/business/aerospace-defense/', location: null, actors: [], isUnconfirmed: false, hoursAgo: 40 },
  { title: 'Shipping insurance rates rise', body: 'War risk premiums increase for Gulf and Eastern Mediterranean.', eventType: 'breaking_news', sourceUrl: 'https://www.reuters.com/business/finance/', location: null, actors: [], isUnconfirmed: false, hoursAgo: 42 },
  { title: 'WHO deploys health supplies', body: 'Emergency health kits sent to affected areas.', eventType: 'humanitarian', sourceUrl: 'https://www.who.int/news', location: null, actors: ['UN'], isUnconfirmed: false, hoursAgo: 44 },
  { title: 'OIC calls for emergency summit', body: 'Organisation of Islamic Cooperation to convene.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: [], isUnconfirmed: false, hoursAgo: 46 },
  { title: 'Canada updates travel advisory', body: 'Avoid non-essential travel to affected regions.', eventType: 'official_statement', sourceUrl: 'https://travel.gc.ca/travelling/advisories', location: null, actors: ['Canada'], isUnconfirmed: false, hoursAgo: 48 },
  { title: 'Australia urges citizens to leave', body: 'DFAT raises alert level for several countries.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/asia-pacific/', location: null, actors: ['Australia'], isUnconfirmed: false, hoursAgo: 50 },
  { title: 'Japan ready to support diplomacy', body: 'PM statement on regional stability.', eventType: 'diplomatic', sourceUrl: 'https://apnews.com/world-news', location: null, actors: ['Japan'], isUnconfirmed: false, hoursAgo: 52 },
  { title: 'Brazil calls for UN-led solution', body: 'Itamaraty statement on multilateral approach.', eventType: 'diplomatic', sourceUrl: 'https://www.gov.br/mre/', location: null, actors: ['Brazil'], isUnconfirmed: false, hoursAgo: 54 },
  { title: 'South Korea monitors energy supply', body: 'Government reviews oil and gas supply chain.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/markets/commodities/', location: null, actors: ['South Korea'], isUnconfirmed: false, hoursAgo: 56 },
  { title: 'Italy offers mediation', body: 'Rome ready to facilitate dialogue if requested.', eventType: 'diplomatic', sourceUrl: 'https://eeas.europa.eu', location: null, actors: ['Italy', 'EU'], isUnconfirmed: false, hoursAgo: 58 },
  { title: 'Spain condemns violence', body: 'Official statement on civilian protection.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/europe/', location: null, actors: ['Spain'], isUnconfirmed: false, hoursAgo: 60 },
  { title: 'Netherlands to send humanitarian aid', body: 'Additional funding and supplies announced.', eventType: 'humanitarian', sourceUrl: 'https://news.un.org', location: null, actors: ['Netherlands'], isUnconfirmed: false, hoursAgo: 62 },
  { title: 'Poland backs EU sanctions', body: 'Support for coordinated European response.', eventType: 'diplomatic', sourceUrl: 'https://eeas.europa.eu', location: null, actors: ['Poland', 'EU'], isUnconfirmed: false, hoursAgo: 64 },
  { title: 'Gulf states coordinate on security', body: 'GCC meeting on regional stability.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['UAE', 'Saudi Arabia'], isUnconfirmed: false, hoursAgo: 66 },
  { title: 'UN OCHA situation report', body: 'Latest humanitarian situation and access update.', eventType: 'humanitarian', sourceUrl: 'https://www.unocha.org/', location: null, actors: ['UN'], isUnconfirmed: false, hoursAgo: 68 },
  { title: 'IMF warns on economic spillovers', body: 'Fund highlights risks to growth and inflation.', eventType: 'official_statement', sourceUrl: 'https://www.imf.org/en/News', location: null, actors: [], isUnconfirmed: false, hoursAgo: 70 },
  { title: 'World Bank ready to support recovery', body: 'Financing and technical support for affected countries.', eventType: 'humanitarian', sourceUrl: 'https://www.worldbank.org/en/news', location: null, actors: [], isUnconfirmed: false, hoursAgo: 72 },
  { title: 'Fact-check: Misleading map shared online', body: 'Viral image of troop movements not verified; do not share.', eventType: 'fact_check', sourceUrl: 'https://www.reuters.com/fact-check/', location: null, actors: [], isUnconfirmed: false, hoursAgo: 74 },
  { title: 'Cyprus on alert for migration flow', body: 'Authorities monitor maritime routes.', eventType: 'official_statement', sourceUrl: 'https://www.reuters.com/world/europe/', location: 'Cyprus', actors: ['Cyprus'], isUnconfirmed: false, hoursAgo: 76 },
  { title: 'Greece reinforces border coordination', body: 'Frontex and national agencies coordinate.', eventType: 'official_statement', sourceUrl: 'https://eeas.europa.eu', location: 'Greece', actors: ['Greece', 'EU'], isUnconfirmed: false, hoursAgo: 78 },
  { title: 'Qatar offers mediation', body: 'Doha ready to facilitate talks between parties.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['Qatar'], isUnconfirmed: false, hoursAgo: 80 },
  { title: 'Kuwait urges dialogue', body: 'Official statement from Kuwaiti government.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['Kuwait'], isUnconfirmed: false, hoursAgo: 82 },
  { title: 'Oman calls for calm', body: 'Muscat stresses need for de-escalation.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['Oman'], isUnconfirmed: false, hoursAgo: 84 },
  { title: 'Bahrain supports GCC stance', body: 'Manama aligns with regional position.', eventType: 'diplomatic', sourceUrl: 'https://www.reuters.com/world/middle-east/', location: null, actors: ['Bahrain'], isUnconfirmed: false, hoursAgo: 86 },
  { title: 'War.gov bulletin update', body: 'Latest official defence and conflict bulletin from War.gov.', eventType: 'official_statement', sourceUrl: 'https://www.war.gov/News/', location: null, actors: ['USA'], isUnconfirmed: false, hoursAgo: 88 },
];

const TARGET_EVENT_COUNT = 55;

type SourceRow = { id: string; name: string; baseUrl: string | null };

/** Find source whose baseUrl is a prefix of the event URL, so displayed name matches the link. */
function findSourceIdByUrl(sourceRows: SourceRow[], eventUrl: string | null): string | null {
  if (!eventUrl) return sourceRows[0]?.id ?? null;
  const normalized = eventUrl.toLowerCase();
  const withBase = sourceRows
    .filter((s) => s.baseUrl && normalized.startsWith(s.baseUrl.toLowerCase()))
    .sort((a, b) => (b.baseUrl?.length ?? 0) - (a.baseUrl?.length ?? 0));
  return withBase[0]?.id ?? sourceRows[0]?.id ?? null;
}

async function fixSourceUrlsAndSourceId(db: ReturnType<typeof getDb>, sourceRows: SourceRow[]) {
  const allEvents = await db
    .select({
      id: events.id,
      title: events.title,
      sourceUrl: events.sourceUrl,
      sourceId: events.sourceId,
      baseUrl: sources.baseUrl,
    })
    .from(events)
    .leftJoin(sources, eq(events.sourceId, sources.id));
  let fixedUrl = 0;
  let fixedSourceId = 0;
  for (const row of allEvents) {
    let url = row.sourceUrl;
    const badUrl = !url || url.includes('example.com');
    if (badUrl) {
      url = TITLE_TO_SOURCE_URL[row.title] ?? row.baseUrl ?? null;
      if (url) {
        await db.update(events).set({ sourceUrl: url }).where(eq(events.id, row.id));
        fixedUrl++;
      }
    }
    const correctSourceId = url ? findSourceIdByUrl(sourceRows, url) : null;
    if (correctSourceId && correctSourceId !== row.sourceId) {
      await db.update(events).set({ sourceId: correctSourceId }).where(eq(events.id, row.id));
      fixedSourceId++;
    }
  }
  if (fixedUrl > 0 || fixedSourceId > 0) {
    console.log(`Fixed source_url for ${fixedUrl} events, source_id for ${fixedSourceId} events.`);
  }
}

export async function seedMockData() {
  const db = getDb();

  const existingSources = await db.select().from(sources);
  if (existingSources.length === 0) {
    await db.insert(sources).values(MOCK_SOURCES);
    console.log('Inserted mock sources.');
  } else {
    const hasWarGov = existingSources.some((s) => s.name === 'War.gov');
    if (!hasWarGov) {
      const warGovSource = MOCK_SOURCES.find((s) => s.name === 'War.gov');
      if (warGovSource) {
        await db.insert(sources).values(warGovSource);
        console.log('Inserted War.gov source.');
      }
    }
  }

  const sourceRows = await db.select().from(sources);
  if (sourceRows.length === 0) {
    console.log('No source found; skipping event seed.');
    return;
  }

  const existingEvents = await db.select().from(events).limit(1);
  const allEvents = await db.select().from(events);
  const count = allEvents.length;

  if (existingEvents.length > 0) {
    await fixSourceUrlsAndSourceId(db, sourceRows);
    if (count >= TARGET_EVENT_COUNT) {
      console.log('Events already at or above target; skipping event top-up.');
      return;
    }
  }

  if (existingEvents.length === 0) {
    await db.insert(events).values(
      MOCK_EVENTS.map((e) => ({
        ...e,
        sourceId: findSourceIdByUrl(sourceRows, e.sourceUrl ?? null),
        sourceUrl: e.sourceUrl ?? null,
        location: e.location ?? null,
        lat: (e as { lat?: string }).lat ?? null,
        lon: (e as { lon?: string }).lon ?? null,
      }))
    );
    console.log(`Inserted ${MOCK_EVENTS.length} mock events.`);
  }

  const currentCount = existingEvents.length === 0 ? MOCK_EVENTS.length : count;
  const need = TARGET_EVENT_COUNT - currentCount;

  if (need <= 0 && existingEvents.length > 0) return;

  const topUp = MORE_EVENTS.slice(0, Math.min(MORE_EVENTS.length, need)).map((e) => ({
    title: e.title,
    body: e.body,
    eventType: e.eventType,
    occurredAt: new Date(Date.now() - e.hoursAgo * 60 * 60 * 1000),
    sourceId: findSourceIdByUrl(sourceRows, e.sourceUrl),
    sourceUrl: e.sourceUrl,
    location: e.location,
    actors: e.actors,
    isUnconfirmed: e.isUnconfirmed,
    lat: null,
    lon: null,
  }));

  if (topUp.length === 0) return;

  await db.insert(events).values(topUp);
  console.log(`Topped up ${topUp.length} mock events (target ${TARGET_EVENT_COUNT}).`);
}
