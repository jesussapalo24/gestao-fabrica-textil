import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  date,
  jsonb,
} from 'drizzle-orm/pg-core'
export const workers = pgTable('workers', {
  id: serial().primaryKey(),
  number: text().notNull().unique(),
  name: text().notNull(),
  role: text().notNull(),
  area: text().notNull(),
  shift: text().notNull(),
  admittedAt: date('admitted_at').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
export const records = pgTable('records', {
  id: serial().primaryKey(),
  kind: text().notNull(),
  day: date().notNull(),
  shift: text().notNull(),
  workerId: integer('worker_id').references(() => workers.id),
  uniqueKey: text('unique_key').notNull().unique(),
  payload: jsonb().$type<Record<string, unknown>>().notNull(),
  grossCents: integer('gross_cents').notNull().default(0),
  discountCents: integer('discount_cents').notNull().default(0),
  advanceCents: integer('advance_cents').notNull().default(0),
  status: text().notNull().default('Registado'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
export const audit = pgTable('audit', {
  id: serial().primaryKey(),
  actor: text().notNull(),
  action: text().notNull(),
  detail: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
export const loginAttempts = pgTable('login_attempts', {
  bucket: text().primaryKey(),
  attempts: integer().notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
})
