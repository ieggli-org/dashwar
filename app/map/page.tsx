'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

const GEO_URL =
  typeof process.env.NEXT_PUBLIC_GEO_URL !== 'undefined'
    ? process.env.NEXT_PUBLIC_GEO_URL
    : 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type EventRow = {
  id: string;
  title: string;
  location: string | null;
  lat: string | null;
  lon: string | null;
  eventType: string;
  occurredAt: string;
  isUnconfirmed: boolean | null;
  sourceName: string | null;
  sourceUrl: string | null;
  actors: string[] | null;
};

const COUNTRY_COORDS: Record<string, [number, number]> = {
  USA: [-95.7129, 37.0902],
  Israel: [34.7818, 31.0461],
  Iran: [53.688, 32.4279],
  Syria: [38.9968, 34.8021],
  Lebanon: [35.8623, 33.8547],
  Iraq: [43.6793, 33.2232],
  Yemen: [48.5164, 15.5527],
  Gaza: [34.4668, 31.5017],
  Jordan: [36.2384, 30.5852],
  Egypt: [30.8025, 26.8206],
  Regional: [44, 32],
};

function getApiUrl(): string {
  if (typeof window !== 'undefined') return ''; // same origin in browser
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

function getCoords(ev: EventRow): [number, number] | null {
  if (ev.lat && ev.lon) {
    const lat = parseFloat(ev.lat);
    const lon = parseFloat(ev.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) return [lon, lat];
  }
  if (ev.location && COUNTRY_COORDS[ev.location]) {
    return COUNTRY_COORDS[ev.location];
  }
  return null;
}

export default function MapPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventRow | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = getApiUrl() || '';
      const res = await fetch(`${base}/api/events?limit=200`);
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch (e) {
      console.error('Map fetch failed', e);
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const withCoords = events
    .map((ev) => ({ ev, coords: getCoords(ev) }))
    .filter((x): x is { ev: EventRow; coords: [number, number] } => x.coords !== null);

  return (
    <div className="map-page">
      <h1>Map — Events by location</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading…</p>}
      <div className="map-container">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 120 }}
          width={800}
          height={400}
        >
          <ZoomableGroup center={[44, 32]} zoom={1}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1a2332"
                    stroke="#2d3a4d"
                  />
                ))
              }
            </Geographies>
            {withCoords.map(({ ev, coords }) => (
              <Marker
                key={ev.id}
                coordinates={coords}
                onClick={() => setSelected(selected?.id === ev.id ? null : ev)}
              >
                <circle
                  r={ev.isUnconfirmed ? 6 : 8}
                  fill={ev.isUnconfirmed ? '#ffad1f' : '#1d9bf0'}
                  stroke="#fff"
                  strokeWidth={1}
                />
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
      </div>
      {selected && (
        <div className="map-popup">
          <h3>{selected.title}</h3>
          <p>
            {selected.eventType.replace(/_/g, ' ')} • {selected.location}
          </p>
          {selected.sourceName && (
            <p>
              Source: {selected.sourceName}
              {selected.sourceUrl && (
                <>
                  {' '}
                  <a
                    href={selected.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Link
                  </a>
                </>
              )}
            </p>
          )}
          {selected.isUnconfirmed && (
            <span className="label-unconfirmed">Unconfirmed</span>
          )}
        </div>
      )}
    </div>
  );
}
