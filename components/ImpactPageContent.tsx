'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';

const ImpactCharts = dynamic(
  () => import('@/components/ImpactCharts'),
  { ssr: false }
);

function getApiUrl(): string {
  if (typeof window !== 'undefined') return ''; // same origin in browser
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

type ImpactSection = 'market' | 'transport' | 'investments' | 'tourism_flights' | 'country_impact';

export default function ImpactPageContent() {
  const { t, locale } = useLocale();
  const [analysis, setAnalysis] = useState<Record<ImpactSection, string>>({
    market: '',
    transport: '',
    investments: '',
    tourism_flights: '',
    country_impact: '',
  });
  const [loading, setLoading] = useState<Record<ImpactSection, boolean>>({
    market: true,
    transport: true,
    investments: true,
    tourism_flights: true,
    country_impact: true,
  });
  const [error, setError] = useState<Record<ImpactSection, boolean>>({
    market: false,
    transport: false,
    investments: false,
    tourism_flights: false,
    country_impact: false,
  });

  useEffect(() => {
    const base = getApiUrl() || '';
    const categories: ImpactSection[] = ['market', 'transport', 'investments', 'tourism_flights', 'country_impact'];
    categories.forEach((category) => {
      fetch(`${base}/api/impact/analysis?category=${category}&locale=${locale}`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed');
          return res.json();
        })
        .then((data) => {
          setAnalysis((prev) => ({ ...prev, [category]: data.analysis ?? '' }));
          setError((prev) => ({ ...prev, [category]: false }));
        })
        .catch(() => {
          setError((prev) => ({ ...prev, [category]: true }));
        })
        .finally(() => {
          setLoading((prev) => ({ ...prev, [category]: false }));
        });
    });
  }, [locale]);

  const sections: { key: ImpactSection; labelKey: string }[] = [
    { key: 'market', labelKey: 'impact.market' },
    { key: 'transport', labelKey: 'impact.transport' },
    { key: 'investments', labelKey: 'impact.investments' },
    { key: 'tourism_flights', labelKey: 'impact.tourismFlights' },
    { key: 'country_impact', labelKey: 'impact.countryImpact' },
  ];

  return (
    <div className="impact-page">
      <h1>{t('impact.title')}</h1>
      <p className="impact-subtitle">{t('impact.subtitle')}</p>

      <section className="impact-charts-section">
        <h2>{t('impact.eventsSummary')}</h2>
        <ImpactCharts />
      </section>

      {sections.map(({ key, labelKey }) => (
        <section key={key} className="impact-analysis-section">
          <h2>{t(labelKey)}</h2>
          {loading[key] && <p className="analysis-loading">{t('impact.analysisLoading')}</p>}
          {error[key] && <p className="analysis-error">{t('impact.analysisError')}</p>}
          {!loading[key] && !error[key] && analysis[key] && (
            <div
              className="analysis-text"
              dangerouslySetInnerHTML={{
                __html: analysis[key]
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\n/g, '<br />'),
              }}
            />
          )}
        </section>
      ))}
    </div>
  );
}
