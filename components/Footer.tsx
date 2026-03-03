'use client';

import { useLocale } from '@/contexts/LocaleContext';

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="footer">
      <p className="disclaimer">{t('footer.disclaimer')}</p>
      <p className="sensitivity">{t('footer.sensitivity')}</p>
    </footer>
  );
}
