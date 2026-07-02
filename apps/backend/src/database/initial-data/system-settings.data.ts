import { SystemSettingKey } from '@repo/constants';

export const DEFAULT_SYSTEM_SETTINGS = {
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
    maxCodeSizeKb: 64, // max source code size
    rateLimitSeconds: 10, // min time between submissions per user
    maxSubmissionsPerDay: 100, // max submissions per user per day
  },
  [SystemSettingKey.WORKER_QUEUE]: {
    maxConcurrentJobs: 4, // max concurrent jobs per worker node
    jobRetryCount: 3, // retry attempts for failed container runs
    workerHeartbeatIntervalMs: 5000, // interval to check active worker status
  },
  [SystemSettingKey.WEBSITE_METADATA]: {
    title: 'TrueSubmit',
    description: 'The Ultimate Automated Code Submission & Evaluation Platform',
    keywords: 'judging, competitive programming, sandbox, compiler',
    logoUrl: '/turborepo-light.svg',
    thumbnailUrl: '/vercel.svg',
    faviconUrl: '/favicon.ico',
    ogTitle: 'TrueSubmit - Automated Code Evaluation',
    ogDescription: 'Evaluate code submissions securely and fast.',
  },
};

