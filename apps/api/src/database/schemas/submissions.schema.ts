import { pgTable, uuid, varchar, text, integer, timestamp, doublePrecision } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { problems, testcases } from './problems.schema';
import { contests } from './contests.schema';
import { uuidv7 } from 'uuidv7';

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  contestId: uuid('contest_id').references(() => contests.id, { onDelete: 'set null' }), // Có thể nộp ngoài kỳ thi
  sourceCode: text('source_code').notNull(),
  language: varchar('language', { length: 50 }).notNull(), // 'cpp', 'java', 'python', 'golang', etc.
  status: varchar('status', { length: 50 }).default('PENDING').notNull(), // PENDING, COMPILING, RUNNING, ACCEPTED, etc.
  points: integer('points').default(0).notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

export const submissionResults = pgTable('submission_results', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  submissionId: uuid('submission_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull(),
  testcaseId: uuid('testcase_id').references(() => testcases.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, etc.
  timeMs: integer('time_ms').default(0).notNull(), // Thời gian chạy thực tế (ms)
  memoryKb: integer('memory_kb').default(0).notNull(), // RAM tiêu thụ thực tế (KB)
  executionMessage: text('execution_message'), // Compiler warning hoặc Runtime error stdout/stderr
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const submissionDrafts = pgTable('submission_drafts', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  draftCode: text('draft_code').notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const plagiarismReports = pgTable('plagiarism_reports', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  contestId: uuid('contest_id').references(() => contests.id, { onDelete: 'cascade' }).notNull(),
  submissionAId: uuid('submission_a_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull(),
  submissionBId: uuid('submission_b_id').references(() => submissions.id, { onDelete: 'cascade' }).notNull(),
  similarity: doublePrecision('similarity').notNull(), // Độ tương đồng (0.0 đến 1.0)
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
