export enum SystemSettingKey {
  SANDBOX_LIMITS = 'sandbox_limits',
  ALLOWED_LANGUAGES = 'allowed_languages',
  SYSTEM_STATUS = 'system_status',
  SUBMISSION_LIMITS = 'submission_limits',
  WORKER_QUEUE = 'worker_queue',
  WEBSITE_METADATA = 'website_metadata',
  LOCALIZATION = 'localization',
}

export interface SandboxLimitsConfig {
  cpuLimit: number;
  memoryLimitMb: number;
  timeLimitMs: number;
  fileSizeLimitMb: number;
}

export interface SystemStatusConfig {
  maintenanceMode: boolean;
  registrationOpen: boolean;
  submissionQueueEnabled: boolean;
}

export interface SubmissionLimitsConfig {
  maxCodeSizeKb: number;
  rateLimitSeconds: number;
  maxSubmissionsPerDay: number;
}

export interface WorkerQueueConfig {
  maxConcurrentJobs: number;
  jobRetryCount: number;
  workerHeartbeatIntervalMs: number;
  workerSecretToken: string;
}

export interface WebsiteMetadataConfig {
  title: string;
  description: string;
  keywords: string;
  logoUrl: string;
  thumbnailUrl: string;
  faviconUrl: string;
  ogTitle: string;
  ogDescription: string;
  contactEmail: string;
  socialLinks: {
    github: string;
    discord: string;
    twitter: string;
  };
}

export interface LanguageSetting {
  lang: string;      // e.g. 'vi', 'en'
  order: number;     // e.g. 1, 2
  isEnabled: boolean; // e.g. true, false
}

export interface LocalizationConfig {
  defaultLanguage: string;
  defaultTimezone: string;
  languages: LanguageSetting[];
}

export interface SystemSettingsSchema {
  [SystemSettingKey.SANDBOX_LIMITS]: SandboxLimitsConfig;
  [SystemSettingKey.ALLOWED_LANGUAGES]: string[];
  [SystemSettingKey.SYSTEM_STATUS]: SystemStatusConfig;
  [SystemSettingKey.SUBMISSION_LIMITS]: SubmissionLimitsConfig;
  [SystemSettingKey.WORKER_QUEUE]: WorkerQueueConfig;
  [SystemSettingKey.WEBSITE_METADATA]: WebsiteMetadataConfig;
  [SystemSettingKey.LOCALIZATION]: LocalizationConfig;
}

export const WEBSITE_METADATA: WebsiteMetadataConfig = {
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
};