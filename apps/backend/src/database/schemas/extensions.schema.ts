import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const extensions = pgTable('extensions', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 255 }).notNull(),
  keyExtension: varchar('key_extension', { length: 100 }).notNull().unique(), // 'ldap', 's3', 'discord', 'moss', etc.
  description: text('description'),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const extensionConfigs = pgTable('extension_configs', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  extensionId: uuid('extension_id')
    .references(() => extensions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  configValues: jsonb('config_values').notNull(), // Lưu thông tin bảo mật và endpoint tùy biến
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
