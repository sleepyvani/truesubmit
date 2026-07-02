export enum SystemSettingKey {
  SANDBOX_LIMITS = 'sandbox_limits',
  ALLOWED_LANGUAGES = 'allowed_languages',
  SYSTEM_STATUS = 'system_status',
  SUBMISSION_LIMITS = 'submission_limits',
  WORKER_QUEUE = 'worker_queue',
}

export const DEFAULT_SYSTEM_SETTINGS: Record<SystemSettingKey, any> = {
  [SystemSettingKey.SANDBOX_LIMITS]: {
    cpuLimit: 2, // number of cores
    memoryLimitMb: 512, // MB
    timeLimitMs: 5000, // ms
    fileSizeLimitMb: 10, // MB
  },
  [SystemSettingKey.ALLOWED_LANGUAGES]: [
    'c',
    'cpp',
    'java',
    'python',
    'go',
    'rust',
    'javascript',
    'typescript',
  ],
  [SystemSettingKey.SYSTEM_STATUS]: {
    maintenanceMode: false,
    registrationOpen: true,
    submissionQueueEnabled: true,
  },
  [SystemSettingKey.SUBMISSION_LIMITS]: {
    maxCodeSizeKb: 64,
    rateLimitSeconds: 10,
    maxSubmissionsPerDay: 100,
  },
  [SystemSettingKey.WORKER_QUEUE]: {
    maxConcurrentJobs: 4,
    jobRetryCount: 3,
    workerHeartbeatIntervalMs: 5000,
  },
};

export const WEBSITE_METADATA = {
  title: 'TrueSubmit',
  description: 'The Ultimate Automated Code Submission & Evaluation Platform',
  keywords: 'judging, competitive programming, sandbox, compiler',
  logoUrl: '/turborepo-light.svg',
  thumbnailUrl: '/vercel.svg',
  faviconUrl: '/favicon.ico',
  ogTitle: 'TrueSubmit - Automated Code Evaluation',
  ogDescription: 'Evaluate code submissions securely and fast.',
};
