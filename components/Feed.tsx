'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';

const EVENT_TYPES = [
  'breaking_news',
  'official_statement',
  'diplomatic',
  'military',
  'humanitarian',
  'fact_check',
] as const;

type EventRow = {
  id: string;
  title: string;
  body: string | null;
  eventType: string;
  occurredAt: string;
  ingestedAt: string;
  sourceId: string | null;
  sourceUrl: string | null;
  location: string | null;
  lat: string | null;
  lon: string | null;
  actors: string[] | null;
  escalationLevel: number | null;
  isUnconfirmed: boolean | null;
  sourceName: string | null;
  sourceType: string | null;
};

function getApiUrl(): string {
  if (typeof window !== 'undefined') return ''; // same origin in browser
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

export type FeedLabels = {
  title: string;
  search: string;
  allTypes: string;
  allActors: string;
  allSources: string;
  apply: string;
  loadMore: string;
  loading: string;
  source: string;
  original: string;
  actors: string;
  unconfirmed: string;
};

const DEFAULT_LABELS: FeedLabels = {
  title: 'Live feed',
  search: 'Search…',
  allTypes: 'All types',
  allActors: 'All actors',
  allSources: 'All sources',
  apply: 'Apply',
  loadMore: 'Load more',
  loading: 'Loading…',
  source: 'Source',
  original: 'Original',
  actors: 'Actors',
  unconfirmed: 'Unconfirmed',
};

const ACTORS = [
  'USA',
  'Israel',
  'Iran',
  'UN',
  'UAE',
  'EU',
  'Lebanon',
  'Iraq',
  'UK',
  'France',
  'Germany',
] as const;

type Props = {
  labels?: Partial<FeedLabels>;
};

export function Feed({ labels: labelsProp }: Props) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [eventType, setEventType] = useState('');
  const [actor, setActor] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pollIntervalMs =
    typeof process.env.NEXT_PUBLIC_POLL_INTERVAL_MS !== 'undefined'
      ? Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS)
      : 120000;

  const fetchEvents = useCallback(
    async (resetOffset = false) => {
      const o = resetOffset ? 0 : offset;
      setLoading(true);
      setError(null);
      try {
        const base = getApiUrl() || '';
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (eventType) params.set('eventType', eventType);
        if (actor) params.set('actor', actor);
        if (sourceType) params.set('sourceType', sourceType);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        params.set('limit', '30');
        params.set('offset', String(o));
        const res = await fetch(`${base}/api/events?${params}`);
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        if (resetOffset) {
          setEvents(data.events ?? []);
          setOffset(data.events?.length ?? 0);
        } else {
          setEvents((prev) => (o === 0 ? data.events ?? [] : [...prev, ...(data.events ?? [])]));
          setOffset(o + (data.events?.length ?? 0));
        }
        setHasMore((data.events?.length ?? 0) === 30);
      } catch (e) {
        console.error('Fetch events failed', e);
        setError(e instanceof Error ? e.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    },
    [q, eventType, actor, sourceType, from, to, offset]
  );

  useEffect(() => {
    fetchEvents(true);
  }, [eventType, actor, sourceType, from, to]);

  useEffect(() => {
    const t = setInterval(() => fetchEvents(true), pollIntervalMs);
    return () => clearInterval(t);
  }, [pollIntervalMs, eventType, actor, sourceType, from, to]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchEvents(true);
  };

  return (
    <div className="feed-page">
      <h1>{labels.title}</h1>
      <form onSubmit={handleSearch} className="filters">
        <input
          type="search"
          placeholder={labels.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={labels.search}
        />
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          aria-label="Event type"
        >
          <option value="">{labels.allTypes}</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          aria-label="Actor"
        >
          <option value="">{labels.allActors}</option>
          {ACTORS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          aria-label="Source type"
        >
          <option value="">{labels.allSources}</option>
          <option value="wire">Wire</option>
          <option value="official">Official</option>
          <option value="ngo">NGO</option>
          <option value="multilateral">Multilateral</option>
          <option value="social">Social</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To date"
        />
        <button type="submit">{labels.apply}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading && events.length === 0 && <p>{labels.loading}</p>}
      <ul className="timeline">
        {events.map((ev) => (
          <li key={ev.id} className="timeline-item">
            <div className="timeline-meta">
              <time dateTime={ev.occurredAt}>
                {format(new Date(ev.occurredAt), 'yyyy-MM-dd HH:mm')}
              </time>
              <span className="event-type">{ev.eventType.replace(/_/g, ' ')}</span>
              {ev.isUnconfirmed && (
                <span className="label-unconfirmed">{labels.unconfirmed}</span>
              )}
              {ev.location && (
                <span className="location">{ev.location}</span>
              )}
            </div>
            <h3>{ev.title}</h3>
            {ev.body && <p>{ev.body}</p>}
            <div className="source-attribution">
              {labels.source}:{' '}
              {ev.sourceName ?? 'Unknown'}
              {ev.sourceUrl && (
                <>
                  {' — '}
                  <a
                    href={ev.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {labels.original}
                  </a>
                </>
              )}
            </div>
            {ev.actors && ev.actors.length > 0 && (
              <p className="actors">
                {labels.actors}: {ev.actors.join(', ')}
              </p>
            )}
          </li>
        ))}
      </ul>
      {events.length > 0 && hasMore && (
        <button
          type="button"
          onClick={() => fetchEvents(false)}
          disabled={loading}
          className="load-more"
        >
          {labels.loadMore}
        </button>
      )}
    </div>
  );
}
