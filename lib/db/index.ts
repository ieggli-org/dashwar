import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Set it in .env.local or your environment.'
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
