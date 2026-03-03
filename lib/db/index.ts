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
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:/, 'https:'));
    const host = parsed.hostname || '';
    if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
      throw new Error(
        `DATABASE_URL must use the Supabase pooler, not the direct host (${host}). ${POOLER_HELP}`
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes('DATABASE_URL must use')) throw e;
    // URL parse failed (e.g. postgresql:// without host); let postgres() handle it
  }
  return url;
}

export function getDb() {
  const url = getDatabaseUrl();
  const client = postgres(url, { max: 10, connect_timeout: 10 });
  return drizzle(client, { schema });
}

export * from './schema';
