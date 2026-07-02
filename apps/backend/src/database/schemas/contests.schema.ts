import { pgTable, uuid, varchar, text, boolean, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { problems } from './problems.schema';
import { uuidv7 } from 'uuidv7';

export const contests = pgTable('contests', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  password: varchar('password', { length: 100 }), // Mật khẩu phòng thi (nếu có)
  isPublic: boolean('is_public').default(true).notNull(), // Public hay Private (chỉ nhóm thi được phép)
  creatorId: uuid('creator_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contestProblems = pgTable('contest_problems', {
  contestId: uuid('contest_id').references(() => contests.id, { onDelete: 'cascade' }).notNull(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  label: varchar('label', { length: 10 }).notNull(), // Ký hiệu đề thi (A, B, C, D...)
  pointsWeight: integer('points_weight').default(100).notNull(), // Trọng số điểm trong kỳ thi
  orderIndex: integer('order_index').default(0).notNull(),
}, (t) => [
  primaryKey({ columns: [t.contestId, t.problemId] }),
]);

export const contestParticipants = pgTable('contest_participants', {
  contestId: uuid('contest_id').references(() => contests.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  registrationIp: varchar('registration_ip', { length: 50 }), // Ghi nhận IP lúc thi để chống gian lận
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.contestId, t.userId] }),
]);

export const contestAnnouncements = pgTable('contest_announcements', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  contestId: uuid('contest_id').references(() => contests.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
