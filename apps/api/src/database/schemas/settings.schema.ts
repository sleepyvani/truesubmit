import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  keySetting: varchar('key_setting', { length: 255 }).notNull().unique(), // e.g. 'sandbox_limits', 'allowed_languages', 'system_status'
  val: jsonb('val').notNull(), // Lưu trữ cấu hình dạng JSON
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
