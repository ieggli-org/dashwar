import { getDb } from '@/lib/db';
import { events, sources } from '@/lib/db/schema';

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
  { name: 'ACLED', type: 'ngo' as const, baseUrl: 'https://acleddata.com', isVerified: true },
  { name: 'International Crisis Group', type: 'ngo' as const, baseUrl: 'https://crisisgroup.org', isVerified: true },
  { name: 'X (verified official accounts)', type: 'social' as const, baseUrl: 'https://x.com', isVerified: false },
];

const MOCK_EVENTS = [
  {
    title: 'US and allies conduct strikes in region',
    body: 'Joint operation reported by multiple outlets. Official statements pending.',
    eventType: 'military' as const,
    occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/1',
    location: 'Regional',
    actors: ['USA', 'Israel'],
    isUnconfirmed: false,
  },
  {
    title: 'Iran issues statement on nuclear program',
    body: 'Official statement from Iranian government regarding IAEA cooperation.',
    eventType: 'official_statement' as const,
    occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/2',
    location: 'Iran',
    actors: ['Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'UN Security Council convenes on situation',
    body: 'Emergency session called. Draft resolution discussed.',
    eventType: 'diplomatic' as const,
    occurredAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/3',
    location: null,
    actors: ['USA', 'Israel', 'Iran', 'UN'],
    isUnconfirmed: false,
  },
  {
    title: 'Reported strike on facility — unconfirmed',
    body: 'Social media reports of strike; no official confirmation yet.',
    eventType: 'breaking_news' as const,
    occurredAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/4',
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
    sourceUrl: 'https://example.com/5',
    location: 'Lebanon',
    actors: ['UN'],
    isUnconfirmed: false,
  },
  {
    title: 'Fact-check: Viral claim about casualty figures',
    body: 'Claim widely shared on social media has been fact-checked; numbers not verified.',
    eventType: 'fact_check' as const,
    occurredAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/6',
    location: null,
    actors: [],
    isUnconfirmed: false,
  },
  {
    title: 'UAE calls for de-escalation',
    body: 'Statement from UAE Ministry of Foreign Affairs urging restraint and dialogue.',
    eventType: 'diplomatic' as const,
    occurredAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/7',
    location: null,
    actors: ['UAE', 'USA', 'Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'EU discusses sanctions package',
    body: 'European officials meet to coordinate response and possible measures.',
    eventType: 'diplomatic' as const,
    occurredAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/8',
    location: null,
    actors: ['EU', 'USA', 'Israel', 'Iran'],
    isUnconfirmed: false,
  },
  {
    title: 'Lebanon border tensions reported',
    body: 'Cross-border incidents reported; UNIFIL monitoring.',
    eventType: 'military' as const,
    occurredAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/9',
    location: 'Lebanon',
    actors: ['Israel', 'Lebanon', 'UN'],
    isUnconfirmed: false,
  },
  {
    title: 'Iraq condemns strikes on its territory',
    body: 'Iraqi government issues statement on reported violations of sovereignty.',
    eventType: 'official_statement' as const,
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    sourceUrl: 'https://example.com/10',
    location: 'Iraq',
    actors: ['Iraq', 'USA', 'Iran'],
    isUnconfirmed: false,
  },
];

export async function seedMockData() {
  const db = getDb();

  const existingSources = await db.select().from(sources);
  if (existingSources.length > 0) {
    console.log('Sources already exist; skipping source seed.');
  } else {
    await db.insert(sources).values(MOCK_SOURCES);
    console.log('Inserted mock sources.');
  }

  const existingEvents = await db.select().from(events).limit(1);
  if (existingEvents.length > 0) {
    console.log('Events already exist; skipping event seed.');
    return;
  }

  const sourceRows = await db.select().from(sources);
  if (sourceRows.length === 0) {
    console.log('No source found; skipping event seed.');
    return;
  }

  await db.insert(events).values(
    MOCK_EVENTS.map((e, i) => ({
      ...e,
      sourceId: sourceRows[i % sourceRows.length]!.id,
      sourceUrl: e.sourceUrl ?? null,
      location: e.location ?? null,
      lat: (e as { lat?: string }).lat ?? null,
      lon: (e as { lon?: string }).lon ?? null,
    }))
  );
  console.log('Inserted mock events.');
}
