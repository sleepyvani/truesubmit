import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { uuidv7 } from 'uuidv7';

export const workerNodes = pgTable('worker_nodes', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('inactive').notNull(), // 'active', 'inactive'
  lastPing: timestamp('last_ping').defaultNow().notNull(),
  stats: jsonb('stats'), // Lưu các chỉ số CPU/RAM/Docker Container đang chạy hiện thời
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 255 }).notNull(), // e.g. 'USER_LOGIN', 'PROBLEM_CREATE', 'ROLE_CHANGE'
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
