import { pgTable, uuid, varchar, text, boolean, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { uuidv7 } from 'uuidv7';

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  difficulty: varchar('difficulty', { length: 50 }).default('medium').notNull(), // 'easy', 'medium', 'hard'
  defaultPoints: integer('default_points').default(100).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  timeLimit: integer('time_limit').default(1000).notNull(), // in milliseconds
  memoryLimit: integer('memory_limit').default(256).notNull(), // in MB
  cpuLimit: integer('cpu_limit').default(1).notNull(), // in cores
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const testcases = pgTable('testcases', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  input: text('input').notNull(),
  expectedOutput: text('expected_output').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  points: integer('points').default(10).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const codeTemplates = pgTable('code_templates', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  language: varchar('language', { length: 50 }).notNull(), // 'cpp', 'java', 'python', 'golang', etc.
  templateCode: text('template_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const problemTags = pgTable('problem_tags', {
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (t) => [
  primaryKey({ columns: [t.problemId, t.tagId] }),
]);

export const problemEditorials = pgTable('problem_editorials', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull().unique(),
  solutionMarkdown: text('solution_markdown').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
