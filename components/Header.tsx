'use client';

import Link from 'next/link';
import { useLocale, type Locale } from '@/contexts/LocaleContext';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pt', label: 'PT' },
];

export function Header() {
  const { locale, setLocale, t } = useLocale();
  return (
    <header className="header">
      <Link href="/" className="logo">
        <span className="logo-icon" aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="m4.93 19.07 2.83-2.83" />
            <path d="m16.24 7.76 2.83-2.83" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </span>
        Dashwar
      </Link>
      <nav>
        <Link href="/">{t('nav.home')}</Link>
        <Link href="/map">{t('nav.map')}</Link>
        <Link href="/impact">{t('nav.impact')}</Link>
      </nav>
      <div className="lang-switcher">
        {LOCALES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            className={locale === code ? 'active' : ''}
            onClick={() => setLocale(code)}
            aria-label={`Language: ${label}`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
