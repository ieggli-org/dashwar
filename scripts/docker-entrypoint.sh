#!/bin/sh
set -e

# Optional: ensure curl for hero image download (Alpine)
apk add --no-cache curl 2>/dev/null || true

echo "Installing dependencies..."
npm install

echo "Running migrations..."
npx tsx lib/db/migrate.ts

echo "Seeding and ingesting (clearing previous RSS breaking_news)..."
CLEAR_RSS_BREAKING_NEWS=1 npx tsx lib/ingest/run.ts

# Background: periodic ingest and append-recent
( while true; do sleep 60; npx tsx lib/ingest/run.ts 2>/dev/null || true; done ) &
( while true; do sleep 600; npx tsx lib/ingest/append-recent.ts 2>/dev/null || true; done ) &

# Hero image: download once, then refresh every 6 hours
sh /app/scripts/update-hero-image.sh 2>/dev/null || true
( while true; do sleep 21600; sh /app/scripts/update-hero-image.sh 2>/dev/null || true; done ) &

echo "Building Next.js..."
rm -rf .next
npm run build

echo "Starting Next.js on 0.0.0.0:3000..."
exec env HOSTNAME=0.0.0.0 npm run start
