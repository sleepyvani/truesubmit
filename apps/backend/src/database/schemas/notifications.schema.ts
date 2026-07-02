import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { uuidv7 } from 'uuidv7';

export const notifications = pgTable('notifications', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('system').notNull(), // 'system', 'contest', 'submission'
  metadata: jsonb('metadata'), // Lưu trữ thêm các thông tin phụ trợ (ví dụ contestId, submissionId)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userNotifications = pgTable(
  'user_notifications',
  {
    notificationId: uuid('notification_id')
      .references(() => notifications.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),
  },
  (t) => [primaryKey({ columns: [t.notificationId, t.userId] })],
);
