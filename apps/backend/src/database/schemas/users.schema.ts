import { sql } from 'drizzle-orm';
import { pgTable, uuid, varchar, text, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 100 }).notNull(),
  keyRole: varchar('key_role', { length: 100 }).notNull().unique(),
  permissions: text('permissions').array().notNull().default(sql`'{}'::text[]`), // Lưu mảng permission keys trực tiếp dạng string[]
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  roleId: uuid('role_id').references(() => roles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  organization: varchar('organization', { length: 255 }),
  studentCode: varchar('student_code', { length: 100 }),
  className: varchar('class_name', { length: 100 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('vi').notNull(),
  timezone: varchar('timezone', { length: 100 }).default('Asia/Ho_Chi_Minh').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const groupMembers = pgTable('group_members', {
  groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(), // 'member', 'owner', 'moderator'
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.groupId, t.userId] }),
]);

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
