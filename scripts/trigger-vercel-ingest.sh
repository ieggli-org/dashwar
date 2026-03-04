#!/usr/bin/env bash
#
# Trigger RSS ingest on the production Vercel app (so the Supabase DB gets new events).
# Uses CRON_SECRET from the environment or from scripts/.env.ingest (CRON_SECRET=...).
#
# Usage:
#   CRON_SECRET=your-secret ./scripts/trigger-vercel-ingest.sh
#   # or add CRON_SECRET to scripts/.env.ingest and run:
#   ./scripts/trigger-vercel-ingest.sh
#
# Optional: set VERCEL_INGEST_URL to your app URL (default: https://dashwar-prod.vercel.app).
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.ingest"
URL="${VERCEL_INGEST_URL:-https://dashwar-prod.vercel.app}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "Error: CRON_SECRET is not set. Export it or add CRON_SECRET=... to $ENV_FILE" >&2
  exit 1
fi

echo "Triggering ingest at $URL/api/cron/ingest ..."
response=$(curl -sS -w "\n%{http_code}" -H "Authorization: Bearer $CRON_SECRET" "$URL/api/cron/ingest")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [[ "$http_code" == "200" ]]; then
  echo "$body" | head -c 500
  echo ""
  echo "Ingest completed (HTTP 200). Refresh the app to see new events."
else
  echo "Ingest failed (HTTP $http_code): $body" >&2
  exit 1
fi
