import { relations } from 'drizzle-orm';
import {
  users,
  userProfiles,
  roles,
  groups,
  groupMembers,
  refreshTokens,
} from './users.schema';
import {
  problems,
  testcases,
  codeTemplates,
  tags,
  problemTags,
  problemEditorials,
} from './problems.schema';
import {
  contests,
  contestProblems,
  contestParticipants,
  contestAnnouncements,
} from './contests.schema';
import {
  submissions,
  submissionResults,
  submissionDrafts,
  plagiarismReports,
} from './submissions.schema';
import {
  cmsPages,
  menus,
  gallery,
} from './cms.schema';
import {
  notifications,
  userNotifications,
} from './notifications.schema';
import {
  extensions,
  extensionConfigs,
} from './extensions.schema';
import {
  activityLogs,
} from './monitoring.schema';

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  groupMemberships: many(groupMembers),
  refreshTokens: many(refreshTokens),
  submissions: many(submissions),
  contestParticipants: many(contestParticipants),
  userNotifications: many(userNotifications),
  activityLogs: many(activityLogs),
  galleryUploads: many(gallery),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  creator: one(users, {
    fields: [problems.creatorId],
    references: [users.id],
  }),
  testcases: many(testcases),
  codeTemplates: many(codeTemplates),
  tags: many(problemTags),
  editorial: one(problemEditorials, {
    fields: [problems.id],
    references: [problemEditorials.problemId],
  }),
  submissions: many(submissions),
  contestProblems: many(contestProblems),
  submissionDrafts: many(submissionDrafts),
}));

export const testcasesRelations = relations(testcases, ({ one, many }) => ({
  problem: one(problems, {
    fields: [testcases.problemId],
    references: [problems.id],
  }),
  submissionResults: many(submissionResults),
}));

export const codeTemplatesRelations = relations(codeTemplates, ({ one }) => ({
  problem: one(problems, {
    fields: [codeTemplates.problemId],
    references: [problems.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  problems: many(problemTags),
}));

export const problemTagsRelations = relations(problemTags, ({ one }) => ({
  problem: one(problems, {
    fields: [problemTags.problemId],
    references: [problems.id],
  }),
  tag: one(tags, {
    fields: [problemTags.tagId],
    references: [tags.id],
  }),
}));

export const problemEditorialsRelations = relations(problemEditorials, ({ one }) => ({
  problem: one(problems, {
    fields: [problemEditorials.problemId],
    references: [problems.id],
  }),
}));

export const contestsRelations = relations(contests, ({ one, many }) => ({
  creator: one(users, {
    fields: [contests.creatorId],
    references: [users.id],
  }),
  problems: many(contestProblems),
  participants: many(contestParticipants),
  announcements: many(contestAnnouncements),
  plagiarismReports: many(plagiarismReports),
  submissions: many(submissions),
}));

export const contestProblemsRelations = relations(contestProblems, ({ one }) => ({
  contest: one(contests, {
    fields: [contestProblems.contestId],
    references: [contests.id],
  }),
  problem: one(problems, {
    fields: [contestProblems.problemId],
    references: [problems.id],
  }),
}));

export const contestParticipantsRelations = relations(contestParticipants, ({ one }) => ({
  contest: one(contests, {
    fields: [contestParticipants.contestId],
    references: [contests.id],
  }),
  user: one(users, {
    fields: [contestParticipants.userId],
    references: [users.id],
  }),
}));

export const contestAnnouncementsRelations = relations(contestAnnouncements, ({ one }) => ({
  contest: one(contests, {
    fields: [contestAnnouncements.contestId],
    references: [contests.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  problem: one(problems, {
    fields: [submissions.problemId],
    references: [problems.id],
  }),
  contest: one(contests, {
    fields: [submissions.contestId],
    references: [contests.id],
  }),
  results: many(submissionResults),
  plagiarismReportsAsA: many(plagiarismReports, { relationName: 'plagiarism_a' }),
  plagiarismReportsAsB: many(plagiarismReports, { relationName: 'plagiarism_b' }),
}));

export const submissionResultsRelations = relations(submissionResults, ({ one }) => ({
  submission: one(submissions, {
    fields: [submissionResults.submissionId],
    references: [submissions.id],
  }),
  testcase: one(testcases, {
    fields: [submissionResults.testcaseId],
    references: [testcases.id],
  }),
}));

export const submissionDraftsRelations = relations(submissionDrafts, ({ one }) => ({
  user: one(users, {
    fields: [submissionDrafts.userId],
    references: [users.id],
  }),
  problem: one(problems, {
    fields: [submissionDrafts.problemId],
    references: [problems.id],
  }),
}));

export const plagiarismReportsRelations = relations(plagiarismReports, ({ one }) => ({
  contest: one(contests, {
    fields: [plagiarismReports.contestId],
    references: [contests.id],
  }),
  submissionA: one(submissions, {
    fields: [plagiarismReports.submissionAId],
    references: [submissions.id],
    relationName: 'plagiarism_a',
  }),
  submissionB: one(submissions, {
    fields: [plagiarismReports.submissionBId],
    references: [submissions.id],
    relationName: 'plagiarism_b',
  }),
}));

export const galleryRelations = relations(gallery, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [gallery.uploadedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ many }) => ({
  userNotifications: many(userNotifications),
}));

export const userNotificationsRelations = relations(userNotifications, ({ one }) => ({
  notification: one(notifications, {
    fields: [userNotifications.notificationId],
    references: [notifications.id],
  }),
  user: one(users, {
    fields: [userNotifications.userId],
    references: [users.id],
  }),
}));

export const extensionsRelations = relations(extensions, ({ one }) => ({
  config: one(extensionConfigs, {
    fields: [extensions.id],
    references: [extensionConfigs.extensionId],
  }),
}));

export const extensionConfigsRelations = relations(extensionConfigs, ({ one }) => ({
  extension: one(extensions, {
    fields: [extensionConfigs.extensionId],
    references: [extensions.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));
