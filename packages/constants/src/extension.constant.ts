export enum ExtensionKey {
  MEDIA_STORAGE = 'media_storage',
  PROBLEM_STORAGE = 'problem_storage',
  AUTHENTICATION = 'authentication',
  CAPTCHA = 'captcha',
  ANALYTICS_MARKETING = 'analytics_marketing',
  SYSTEM_SECURITY = 'system_security',
  SYSTEM_NOTIFICATION = 'system_notification',
}

export interface MediaStorageConfig {
  provider: 'local' | 's3' | 'r2' | 'tigris';
  s3Config: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    useSSL: boolean;
    publicUrl: string;
  };
  r2Config: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
  tigrisConfig: {
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  };
  imageProcessing: {
    enabled: boolean;
    convertToWebp: boolean;
    convertFormats: string[];
    quality: number;
    maxWidth: number;
    maxHeight: number;
    stripMetadata: boolean;
    progressive: boolean;
    preserveOriginal: boolean;
  };
  limits: {
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
  };
}

export interface ProblemStorageConfig {
  provider: 'local' | 's3' | 'r2' | 'tigris';
  s3Config: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    useSSL: boolean;
  };
  r2Config: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  };
  tigrisConfig: {
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  };
  limits: {
    maxFileSizeMb: number;
  };
}

export interface AuthenticationConfig {
  betterAuth: {
    secret: string;
    url: string;
  };
  providers: {
    emailPassword: {
      enabled: boolean;
    };
    github: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
    };
    google: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
    };
    discord: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
    };
    gitlab: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
    };
  };
  plugins: {
    twoFactor: {
      enabled: boolean;
    };
    passkey: {
      enabled: boolean;
    };
  };
}

export interface CaptchaConfig {
  provider: 'none' | 'turnstile' | 'recaptcha' | 'hcaptcha';
  siteKey: string;
  secretKey: string;
  requiredOn: string[];
}

export interface AnalyticsMarketingConfig {
  googleAnalytics: {
    measurementId: string;
    isEnabled: boolean;
  };
  googleAdsRemarketing: {
    conversionId: string;
    label: string;
    isEnabled: boolean;
  };
}

export interface SecuritySettingsConfig {
  session: {
    expiresInDays: number;
    updateAgeSeconds: number;
  };
  passwordPolicy: {
    minLength: number;
    requireSpecialChar: boolean;
    requireNumber: boolean;
  };
  ipRestriction: {
    enabled: boolean;
    whitelist: string[];
  };
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  ipSpamProtection: {
    enabled: boolean;
    apiSpamLimit: number;
    banDurationMs: number;
  };
  bruteForceProtection: {
    enabled: boolean;
    maxPasswordAttempts: number;
    lockoutDurationMs: number;
  };
  sessionSecurity: {
    restrictMultipleSessions: boolean;
    ipChangeDetection: boolean;
    userAgentChangeDetection: boolean;
  };
}


export interface SmtpServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  isDefault: boolean;
  triggers: string[];
}

export interface TelegramBotConfig {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  triggers: string[];
}

export interface DiscordWebhookConfig {
  id: string;
  name: string;
  webhookUrl: string;
  isEnabled: boolean;
  triggers: string[];
}

export interface SlackWebhookConfig {
  id: string;
  name: string;
  webhookUrl: string;
  isEnabled: boolean;
  triggers: string[];
}

export interface NotificationConfig {
  smtpServers: SmtpServerConfig[];
  clientTelegramBot: {
    botToken: string;
    chatId: string;
    isEnabled: boolean;
    triggers: string[];
  };
  adminTelegramBots: TelegramBotConfig[];
  clientDiscordWebhook: {
    isEnabled: boolean;
    triggers: string[];
  };
  adminDiscordWebhooks: DiscordWebhookConfig[];
  clientSlackWebhook: {
    isEnabled: boolean;
    triggers: string[];
  };
  adminSlackWebhooks: SlackWebhookConfig[];
}
