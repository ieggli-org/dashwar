'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useLocale } from '@/contexts/LocaleContext';

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
  sectionDesc?: string;
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

type TranslatedEvent = { title: string; body: string | null };

export function Feed({ labels: labelsProp }: Props) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const { locale } = useLocale();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [translated, setTranslated] = useState<Record<string, TranslatedEvent>>({});
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
      : 30000;

  const fetchEvents = useCallback(
    async (resetOffset = false) => {
      const o = resetOffset ? 0 : offset;
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
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
        const res = await fetch(`${base}/api/events?${params}`, { signal: controller.signal });
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
        const list = data.events ?? [];
        if (list.length > 0 && locale !== 'en') {
          try {
            const base = getApiUrl() || '';
            const res = await fetch(`${base}/api/translate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetLocale: locale,
                items: list.map((e: EventRow) => ({ title: e.title, body: e.body ?? null })),
              }),
            });
            if (res.ok) {
              const data2 = await res.json();
              const items = data2.items as { title: string; body: string | null }[] | undefined;
              if (Array.isArray(items) && items.length === list.length) {
                const next: Record<string, TranslatedEvent> = {};
                list.forEach((ev: EventRow, i: number) => {
                  next[ev.id] = items[i] ?? { title: ev.title, body: ev.body ?? null };
                });
                setTranslated((prev) => ({ ...prev, ...next }));
              }
            }
          } catch (err) {
            console.error('Translate feed failed', err);
          }
        } else if (locale === 'en') {
          setTranslated({});
        }
      } catch (e) {
        console.error('Fetch events failed', e);
        const msg = e instanceof Error ? e.message : 'Failed to load events';
        setError(e instanceof Error && e.name === 'AbortError' ? 'Request timed out. Try again.' : msg);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [q, eventType, actor, sourceType, from, to, offset, locale]
  );

  useEffect(() => {
    fetchEvents(true);
  }, [fetchEvents, eventType, actor, sourceType, from, to, locale]);

  useEffect(() => {
    const t = setInterval(() => fetchEvents(true), pollIntervalMs);
    return () => clearInterval(t);
  }, [pollIntervalMs, eventType, actor, sourceType, from, to, locale]);

  // When locale changes, translate current events if not English
  useEffect(() => {
    if (locale === 'en') {
      setTranslated({});
      return;
    }
    if (events.length === 0) return;
    let cancelled = false;
    const list = events;
    const base = getApiUrl() || '';
    fetch(`${base}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLocale: locale,
        items: list.map((e) => ({ title: e.title, body: e.body ?? null })),
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.items || data.items.length !== list.length) return;
        const next: Record<string, TranslatedEvent> = {};
        list.forEach((ev, i) => {
          next[ev.id] = data.items[i] ?? { title: ev.title, body: ev.body ?? null };
        });
        setTranslated((prev) => ({ ...prev, ...next }));
      })
      .catch((err) => console.error('Translate on locale change failed', err));
    return () => { cancelled = true; };
  }, [locale, events]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchEvents(true);
  };

  return (
    <div className="feed-page">
      <h1 id="feed-section-title" className="section-title">{labels.title}</h1>
      <p className="section-desc">{labels.sectionDesc ?? 'Filter and search events by type, actor, and date.'}</p>
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
        {events.map((ev) => {
          const tx = locale !== 'en' ? translated[ev.id] : null;
          const displayTitle = tx ? tx.title : ev.title;
          const displayBody = tx ? tx.body : ev.body;
          return (
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
            <h3>{displayTitle}</h3>
            {displayBody && <p>{displayBody}</p>}
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
          );
        })}
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
