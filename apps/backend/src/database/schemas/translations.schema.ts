import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const uiTranslations = pgTable(
  'ui_translations',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    keyTranslation: varchar('key_translation', { length: 255 }).notNull(),
    languageCode: varchar('language_code', { length: 10 }).notNull(),
    val: text('val').notNull(),
    isCustom: boolean('is_custom').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('key_lang_idx').on(t.keyTranslation, t.languageCode)],
);
