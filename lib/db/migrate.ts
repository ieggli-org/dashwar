import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set.');
  }
  const sql = postgres(url, { max: 1 });
  try {
    const path = join(process.cwd(), 'drizzle', '0000_init.sql');
    const content = readFileSync(path, 'utf-8');
    await sql.unsafe(content);
    console.log('Migration 0000_init applied.');
  } catch (e) {
    console.error('Migration failed', e);
    throw e;
  } finally {
    await sql.end();
  }
}
