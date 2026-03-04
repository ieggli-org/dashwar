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
  // Detect direct Supabase host (fails on Vercel).
  if (url.includes('db.') && url.includes('.supabase.co') && !url.includes('pooler.supabase.com')) {
    throw new Error(
      `DATABASE_URL must use the Supabase pooler, not the direct host (db.xxx.supabase.co). ${POOLER_HELP}`
    );
  }
  // Supabase pooler requires username "postgres.PROJECT_REF", not just "postgres". Otherwise: "Tenant or user not found".
  if (url.includes('pooler.supabase.com')) {
    const userMatch = url.match(/^postgres(ql)?:\/\/([^:]+):/);
    const user = userMatch ? userMatch[2] : '';
    if (user === 'postgres') {
      throw new Error(
        'DATABASE_URL username must be postgres.PROJECT_REF (e.g. postgres.icbnsataiervthiljrtd), not "postgres". Copy the full URI from Supabase Settings → Database → Connection string → Transaction mode.'
      );
    }
  }
  return url;
}

export function getDb() {
  const url = getDatabaseUrl();
  const client = postgres(url, { max: 10, connect_timeout: 10 });
  return drizzle(client, { schema });
}

export * from './schema';
