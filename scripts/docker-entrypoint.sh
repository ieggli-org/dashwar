#!/bin/sh
set -e

echo "Installing dependencies..."
npm install

echo "Running migrations..."
npx tsx lib/db/migrate.ts

echo "Seeding and ingesting (clearing previous RSS breaking_news)..."
CLEAR_RSS_BREAKING_NEWS=1 npx tsx lib/ingest/run.ts

# Background: periodic ingest and append-recent
( while true; do sleep 60; npx tsx lib/ingest/run.ts 2>/dev/null || true; done ) &
( while true; do sleep 600; npx tsx lib/ingest/append-recent.ts 2>/dev/null || true; done ) &

echo "Building Next.js..."
rm -rf .next
npm run build

echo "Starting Next.js on 0.0.0.0:3000..."
exec env HOSTNAME=0.0.0.0 npm run start
