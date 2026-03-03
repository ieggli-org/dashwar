'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0f1419', color: '#e7e9ea', fontFamily: 'system-ui', padding: '2rem', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button type="button" onClick={() => reset()} style={{ padding: '0.5rem 1rem', cursor: 'pointer', marginTop: '1rem' }}>
          Try again
        </button>
      </body>
    </html>
  );
}
