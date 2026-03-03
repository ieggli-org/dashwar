import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  varchar,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

export const eventTypes = [
  'breaking_news',
  'official_statement',
  'diplomatic',
  'military',
  'humanitarian',
  'fact_check',
] as const;

export type EventType = (typeof eventTypes)[number];

export const sourceTypes = ['wire', 'official', 'ngo', 'multilateral', 'social'] as const;

export type SourceType = (typeof sourceTypes)[number];

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: varchar('type', { length: 32 }).notNull(),
  baseUrl: text('base_url'),
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body'),
  eventType: varchar('event_type', { length: 32 }).notNull(),
  occurredAt: timestamp('occurred_at').notNull(),
  ingestedAt: timestamp('ingested_at').defaultNow().notNull(),
  sourceId: uuid('source_id').references(() => sources.id),
  sourceUrl: text('source_url'),
  location: text('location'),
  lat: text('lat'),
  lon: text('lon'),
  actors: jsonb('actors').$type<string[]>().default([]),
  escalationLevel: integer('escalation_level'),
  isUnconfirmed: boolean('is_unconfirmed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Source = typeof sources.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type NewSource = typeof sources.$inferInsert;
