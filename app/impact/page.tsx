'use client';

import dynamic from 'next/dynamic';

const ImpactPageContent = dynamic(
  () => import('@/components/ImpactPageContent'),
  { ssr: false, loading: () => <p className="impact-loading">Loading…</p> }
);

export default function ImpactPage() {
  return <ImpactPageContent />;
}
