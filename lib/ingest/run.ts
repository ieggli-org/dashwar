import { runMigrations } from '@/lib/db/migrate';
import { seedMockData } from '@/lib/ingest/mock';

async function main() {
  try {
    await runMigrations();
    await seedMockData();
    console.log('Ingest (mock seed) completed.');
  } catch (e) {
    console.error('Ingest failed', e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
