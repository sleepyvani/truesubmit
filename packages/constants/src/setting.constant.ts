export enum SystemSettingKey {
  SANDBOX_LIMITS = 'sandbox_limits',
  ALLOWED_LANGUAGES = 'allowed_languages',
  SYSTEM_STATUS = 'system_status',
  WEBSITE_SETTINGS = 'website_settings',
}

export interface SystemSettingDetail<T = any> {
  value: T;
  metadata: {
    displayName: string;
    description: string;
    category: string;
  };
}

export const DEFAULT_SYSTEM_SETTINGS: Record<SystemSettingKey, SystemSettingDetail> = {
  [SystemSettingKey.SANDBOX_LIMITS]: {
    value: {
      cpuLimit: 2, // number of cores
      memoryLimitMb: 512, // MB
      timeLimitMs: 5000, // ms
      fileSizeLimitMb: 10, // MB
    },
    metadata: {
      displayName: 'Sandbox Resource Limits',
      description: 'Limits for containerized sandbox runtime environments.',
      category: 'sandbox',
    },
  },
  [SystemSettingKey.ALLOWED_LANGUAGES]: {
    value: ['c', 'cpp', 'java', 'python', 'go', 'rust', 'javascript', 'typescript'],
    metadata: {
      displayName: 'Allowed Programming Languages',
      description: 'List of languages enabled for submission and execution.',
      category: 'languages',
    },
  },
  [SystemSettingKey.SYSTEM_STATUS]: {
    value: {
      maintenanceMode: false,
      registrationOpen: true,
      submissionQueueEnabled: true,
    },
    metadata: {
      displayName: 'System Operational Status',
      description: 'Global maintenance flags and toggle switches for system operations.',
      category: 'system',
    },
  },
  [SystemSettingKey.WEBSITE_SETTINGS]: {
    value: {
      title: 'TrueSubmit',
      description: 'The Ultimate Automated Code Submission & Evaluation Platform',
      keywords: ['judging', 'competitive programming', 'sandbox', 'compiler'],
      logoLightUrl: '/turborepo-light.svg',
      logoDarkUrl: '/turborepo-dark.svg',
      thumbnailUrl: '/vercel.svg',
      faviconUrl: '/favicon.ico',
      ogTitle: 'TrueSubmit - Automated Code Evaluation',
      ogDescription: 'Evaluate code submissions securely and fast.',
    },
    metadata: {
      displayName: 'Website Metadata & SEO Settings',
      description: 'SEO metadata, branding logos, favicons and sharing images for the frontend application.',
      category: 'website',
    },
  },
};
