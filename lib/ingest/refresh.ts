import { getDb } from '@/lib/db';
import { events, sources } from '@/lib/db/schema';
import { seedMockData } from './mock';

async function main() {
  try {
    const db = getDb();
    await db.delete(events);
    await db.delete(sources);
    console.log('Cleared events and sources.');
    await seedMockData();
    console.log('Refresh complete. Latest sources and events seeded.');
  } catch (e) {
    console.error('Refresh failed', e);
    process.exit(1);
  }
}

main();
