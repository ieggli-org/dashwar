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
