CREATE TABLE IF NOT EXISTS "sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "type" varchar(32) NOT NULL,
  "base_url" text,
  "is_verified" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "event_type" varchar(32) NOT NULL,
  "occurred_at" timestamp NOT NULL,
  "ingested_at" timestamp DEFAULT now() NOT NULL,
  "source_id" uuid REFERENCES "sources"("id"),
  "source_url" text,
  "location" text,
  "lat" text,
  "lon" text,
  "actors" jsonb DEFAULT '[]'::jsonb,
  "escalation_level" integer,
  "is_unconfirmed" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "events_occurred_at_idx" ON "events" ("occurred_at");
CREATE INDEX IF NOT EXISTS "events_event_type_idx" ON "events" ("event_type");
CREATE INDEX IF NOT EXISTS "events_source_id_idx" ON "events" ("source_id");
