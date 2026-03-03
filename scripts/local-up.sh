#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "Starting Postgres and Redis..."
docker compose up -d postgres redis

echo "Waiting for Postgres to be ready..."
until docker compose exec -T postgres pg_isready -U dashwar -d dashwar 2>/dev/null; do
  sleep 1
done

echo "Running migrations..."
npm run db:migrate:run

echo "Seeding mock data..."
npm run ingest

echo "Starting Next.js dev server at http://localhost:3000"
npm run dev
