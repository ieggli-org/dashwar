'use client';

import { Feed } from '@/components/Feed';
import { useLocale } from '@/contexts/LocaleContext';

export default function HomePage() {
  const { t } = useLocale();
  return (
    <Feed
      labels={{
        title: t('feed.title'),
        search: t('feed.search'),
        allTypes: t('feed.allTypes'),
        allActors: t('feed.allActors'),
        allSources: t('feed.allSources'),
        apply: t('feed.apply'),
        loadMore: t('feed.loadMore'),
        loading: t('feed.loading'),
        source: t('feed.source'),
        original: t('feed.original'),
        actors: t('feed.actors'),
        unconfirmed: t('feed.unconfirmed'),
      }}
    />
  );
}
