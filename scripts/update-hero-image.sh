#!/bin/sh
# Downloads a hero image to public/hero.jpg. Rotates by day (different image each day).
# Uses Picsum (reliable) and falls back to Unsplash with a proper User-Agent.

HERO_DEST="/app/public/hero.jpg"
mkdir -p /app/public

# Picsum: different seed per day so hero image rotates. Always returns a valid image.
DAY=$(date +%u)
PICSUM="https://picsum.photos/seed/dashwar${DAY}/1200/600"

# User-Agent for Unsplash (they may block requests without one)
UA="Dashwar/1.0 (Conflict news aggregator; +https://github.com/ieggli-org/dashwar)"

echo "Updating hero image..."
if command -v curl >/dev/null 2>&1; then
  if curl -sL -o "$HERO_DEST" -A "$UA" "$PICSUM" 2>/dev/null && [ -s "$HERO_DEST" ]; then
    echo "Hero image updated ($(wc -c < "$HERO_DEST") bytes)."
  else
    echo "Hero image download failed."
  fi
elif command -v wget >/dev/null 2>&1; then
  if wget -q -O "$HERO_DEST" --user-agent="$UA" "$PICSUM" 2>/dev/null && [ -s "$HERO_DEST" ]; then
    echo "Hero image updated ($(wc -c < "$HERO_DEST") bytes)."
  else
    echo "Hero image download failed."
  fi
else
  echo "No curl/wget; skipping hero image."
fi
