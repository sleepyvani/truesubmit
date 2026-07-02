import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { uuidv7 } from 'uuidv7';

export const cmsPages = pgTable('cms_pages', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const menus = pgTable('menus', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 100 }).notNull(),
  position: varchar('position', { length: 50 }).notNull(), // 'header', 'footer', 'sidebar'
  items: jsonb('items').notNull(), // Mảng các menu item [{ label, link, newTab }]
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const gallery = pgTable('gallery', {
  id: uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  uploadedBy: uuid('uploaded_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
