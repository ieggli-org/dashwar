'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

function getApiUrl(): string {
  if (typeof window !== 'undefined') return ''; // same origin in browser
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

const CHART_COLORS = ['#1d9bf0', '#ffad1f', '#f4212e', '#00ba7c', '#7856ff', '#8b98a5'];

export default function ImpactCharts() {
  const [byCountry, setByCountry] = useState<{ name: string; count: number }[]>([]);
  const [byType, setByType] = useState<{ name: string; count: number }[]>([]);
  const [byDate, setByDate] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = getApiUrl() || '';
    Promise.all([
      fetch(`${base}/api/stats?group=country`),
      fetch(`${base}/api/stats?group=type`),
      fetch(`${base}/api/stats?group=countryOverTime`),
    ])
      .then(([a, b, c]) => Promise.all([a.json(), b.json(), c.json()]))
      .then(([countryData, typeData, timeData]) => {
        setByCountry(countryData.byCountry ?? []);
        setByType(typeData.byType ?? []);
        setByDate(timeData.byDate ?? {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lineData = (() => {
    const dates = Object.keys(byDate).sort();
    const countries = new Set<string>();
    dates.forEach((d) => Object.keys(byDate[d] ?? {}).forEach((c) => countries.add(c)));
    return dates.map((date) => {
      const row: Record<string, string | number> = { date };
      countries.forEach((c) => {
        row[c] = (byDate[date] ?? {})[c] ?? 0;
      });
      return row;
    });
  })();

  if (loading) return <p className="charts-loading">Loading charts…</p>;

  return (
    <div className="impact-charts">
      <section className="chart-section">
        <h3>Event count by country/actor</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCountry} margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="var(--text-muted)"
            />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
            <Bar dataKey="count" fill="var(--accent)" name="Events" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
      <section className="chart-section">
        <h3>Event type distribution</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={byType}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={({ name, percent }) =>
                `${name.replace(/_/g, ' ')} ${(percent * 100).toFixed(0)}%`
              }
            >
              {(byType as { name: string; count: number }[]).map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>
      {lineData.length > 0 && (
        <section className="chart-section">
          <h3>Events by country over time</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                }}
              />
              {Object.keys(lineData[0] ?? {}).filter((k) => k !== 'date').map((key, i) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  dot={false}
                  name={key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  );
}
