'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Locale = 'en' | 'pt' | 'es';

const LOCALE_KEY = 'dashwar-locale';

const defaultEn: Record<string, unknown> = {
  nav: { home: 'Home', map: 'Map', impact: 'Impact & outlook' },
  feed: {
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
  },
  impact: {
    title: 'Impact & outlook',
    subtitle: 'Probable effects on markets, transport, investments, tourism and flights, and country-level impact — with objective analysis.',
    market: 'Markets',
    transport: 'Transport & logistics',
    investments: 'Investments',
    tourismFlights: 'Tourism & flights',
    countryImpact: 'Country impact timeline',
    analysisLoading: 'Generating analysis…',
    analysisError: 'Analysis temporarily unavailable.',
    eventsSummary: 'Events summary',
  },
  footer: {
    disclaimer:
      'Disclaimer: This system aggregates information from external sources and does not guarantee accuracy. Sources are attributed; unconfirmed reports are labeled. For fact-checking, refer to established fact-checking organizations.',
    sensitivity: 'Sensitive content (e.g. graphic imagery) is excluded by default.',
  },
};

const messagesCache: Record<Locale, Record<string, unknown>> = {
  en: { ...defaultEn },
  pt: {},
  es: {},
};

async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  if (messagesCache[locale] && Object.keys(messagesCache[locale]).length > 0) {
    return messagesCache[locale];
  }
  try {
    const res = await fetch(`/messages/${locale}.json`);
    if (!res.ok) throw new Error('Failed to load messages');
    const data = await res.json();
    messagesCache[locale] = data;
    return data;
  } catch (e) {
    console.error('Load messages failed', e);
    if (locale !== 'en') return loadMessages('en');
    return {};
  }
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur != null && typeof cur === 'object' && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  messages: Record<string, unknown> | null;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [messages, setMessages] = useState<Record<string, unknown> | null>(defaultEn);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LOCALE_KEY) : null;
    const l = (stored === 'pt' || stored === 'es' ? stored : 'en') as Locale;
    setLocaleState(l);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadMessages(locale).then((m) => {
      if (!cancelled) setMessages(m && Object.keys(m).length > 0 ? m : defaultEn);
    });
    return () => { cancelled = true; };
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem(LOCALE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string): string => {
      if (!messages) return key;
      const v = getNested(messages as Record<string, unknown>, key);
      return typeof v === 'string' ? v : key;
    },
    [messages]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, messages }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
