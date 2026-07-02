export enum SystemSettingKey {
  SANDBOX_LIMITS = 'sandbox_limits',
  ALLOWED_LANGUAGES = 'allowed_languages',
  SYSTEM_STATUS = 'system_status',
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
};

export const WEBSITE_METADATA = {
  title: 'TrueSubmit',
  description: 'The Ultimate Automated Code Submission & Evaluation Platform',
  keywords: 'judging, competitive programming, sandbox, compiler',
  logoLightUrl: '/turborepo-light.svg',
  logoDarkUrl: '/turborepo-dark.svg',
  thumbnailUrl: '/vercel.svg',
  faviconUrl: '/favicon.ico',
  ogTitle: 'TrueSubmit - Automated Code Evaluation',
  ogDescription: 'Evaluate code submissions securely and fast.',
};
