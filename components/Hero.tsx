'use client';

import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

function FeedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 11a9 9 0 0 1 9 9" />
      <path d="M4 4a16 16 0 0 1 16 16" />
      <circle cx="4" cy="4" r="1" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

export function Hero() {
  const { t } = useLocale();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-inner">
        <h1 id="hero-title">{t('hero.title')}</h1>
        <p className="tagline">{t('hero.tagline')}</p>
        <p className="hero-attribution">
          <a href="https://picsum.photos" target="_blank" rel="noopener noreferrer">Image: Lorem Picsum</a>
        </p>
        <div className="hero-cards">
          <Link href="/" className="hero-card">
            <span className="hero-card-icon" aria-hidden>
              <FeedIcon />
            </span>
            <h2>{t('hero.feedCardTitle')}</h2>
            <p>{t('hero.feedCardDesc')}</p>
          </Link>
          <Link href="/map" className="hero-card">
            <span className="hero-card-icon" aria-hidden>
              <MapIcon />
            </span>
            <h2>{t('hero.mapCardTitle')}</h2>
            <p>{t('hero.mapCardDesc')}</p>
          </Link>
          <Link href="/impact" className="hero-card">
            <span className="hero-card-icon" aria-hidden>
              <ChartIcon />
            </span>
            <h2>{t('hero.impactCardTitle')}</h2>
            <p>{t('hero.impactCardDesc')}</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
