'use client';

import { Hero } from '@/components/Hero';
import { Feed } from '@/components/Feed';
import { useLocale } from '@/contexts/LocaleContext';

export default function HomePage() {
  const { t } = useLocale();
  return (
    <>
      <Hero />
      <section id="live-feed" aria-labelledby="feed-section-title">
        <Feed
          labels={{
            title: t('feed.title'),
            sectionDesc: t('feed.sectionDesc'),
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
      </section>
    </>
  );
}
