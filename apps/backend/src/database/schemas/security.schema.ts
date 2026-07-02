import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const accessDenies = pgTable('access_denies', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  type: varchar('type', { length: 50 }).notNull(), // 'ip', 'email', 'user'
  targetValue: varchar('target_value', { length: 255 }).notNull(), // Địa chỉ IP, domain email hoặc user UUID cụ thể
  reason: text('reason'),
  expiresAt: timestamp('expires_at'), // Hết hạn chặn (nếu null là chặn vĩnh viễn)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
