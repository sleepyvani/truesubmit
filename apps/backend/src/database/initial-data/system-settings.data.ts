import { SystemSettingKey, SystemSettingsSchema } from '@repo/constants';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsSchema = {
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
    workerSecretToken: 'default_worker_secret_token_change_me', // Token for workers to authenticate with the backend
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
    contactEmail: 'support@truesubmit.com',
    socialLinks: {
      github: 'https://github.com/sleepyvani/truesubmit',
      discord: 'https://discord.gg/truesubmit',
      twitter: '',
    },
  },
  [SystemSettingKey.LOCALIZATION]: {
    defaultLanguage: 'vi',
    defaultTimezone: 'Asia/Ho_Chi_Minh',
    languages: [
      { lang: 'vi', order: 1, isEnabled: true },
      { lang: 'en', order: 2, isEnabled: true },
    ],
  },
};
