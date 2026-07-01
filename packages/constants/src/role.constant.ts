export enum KeyRole {
  SYSTEM_ADMIN = 'system_admin',
  CONTEST_CREATOR = 'contest_creator',
  REGULAR_USER = 'regular_user',
  GUEST = 'guest',
}

export enum KeyPermission {
  SYSTEM_CONFIGURE = 'system:configure',
  WORKER_MANAGE = 'worker:manage',
  PROBLEM_CREATE = 'problem:create',
  PROBLEM_UPDATE = 'problem:update',
  PROBLEM_DELETE = 'problem:delete',
  CONTEST_CREATE = 'contest:create',
  CONTEST_UPDATE = 'contest:update',
  CONTEST_DELETE = 'contest:delete',
  SUBMISSION_CREATE = 'submission:create',
  SUBMISSION_VIEW_ALL = 'submission:view_all',
  PLAGIARISM_RUN = 'plagiarism:run',
  CMS_MANAGE = 'cms:manage',
}
