'use client';

import { useEffect } from 'react';

const RELOAD_KEY = 'dashwar-chunk-reload';

function isChunkLoadError(message: string, error?: Error | null): boolean {
  const str = (message ?? '') + (error?.message ?? '') + (error?.name ?? '');
  return (
    str.includes('Loading chunk') ||
    str.includes('ChunkLoadError') ||
    str.includes('Failed to fetch dynamically imported module')
  );
}

function tryReload(): void {
  const reloaded = sessionStorage.getItem(RELOAD_KEY);
  if (reloaded) {
    sessionStorage.removeItem(RELOAD_KEY);
    return;
  }
  sessionStorage.setItem(RELOAD_KEY, '1');
  window.location.reload();
}

/**
 * On chunk load failure (e.g. after a new deploy, stale chunk reference),
 * reload the page once so the user gets the latest build.
 */
export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message ?? '', event.error)) tryReload();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        typeof reason === 'string'
          ? reason
          : reason?.message ?? reason?.name ?? '';
      const err = reason && typeof reason === 'object' ? (reason as Error) : null;
      if (isChunkLoadError(msg, err)) {
        event.preventDefault();
        tryReload();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
