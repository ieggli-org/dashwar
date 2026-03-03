import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const POOLER_HELP =
  'Use the Supabase pooler URI from Settings → Database → Connection string (Transaction mode): host must be aws-0-<region>.pooler.supabase.com and port 6543.';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Set it in .env.local or your environment.'
    );
  }
  // Detect direct Supabase host (fails on Vercel). Check raw string so we catch it even if URL parsing fails.
  if (url.includes('db.') && url.includes('.supabase.co') && !url.includes('pooler.supabase.com')) {
    throw new Error(
      `DATABASE_URL must use the Supabase pooler, not the direct host (db.xxx.supabase.co). ${POOLER_HELP}`
    );
  }
  return url;
}

export function getDb() {
  const url = getDatabaseUrl();
  const client = postgres(url, { max: 10, connect_timeout: 10 });
  return drizzle(client, { schema });
}

export * from './schema';
