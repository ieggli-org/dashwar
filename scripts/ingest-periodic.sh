#!/usr/bin/env bash
#
# Periodic RSS ingest for Dashwar. Uses DATABASE_URL from the environment
# or from scripts/.env.ingest (create from .env.ingest.example).
#
# Run once:  ./scripts/ingest-periodic.sh   or  npm run ingest:periodic
# Schedule: e.g. cron every 30 min:
#   */30 * * * * cd /path/to/dashwar && ./scripts/ingest-periodic.sh >> /tmp/dashwar-ingest.log 2>&1
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.ingest"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set. Export it or create $ENV_FILE (see .env.ingest.example)." >&2
  exit 1
fi

cd "$ROOT_DIR"
echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] Running ingest..."
npx tsx lib/ingest/run.ts
echo "[$(date '+%Y-%m-%dT%H:%M:%S%z')] Done."
