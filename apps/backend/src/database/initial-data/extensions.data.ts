import {
  ExtensionKey,
  MediaStorageConfig,
  ProblemStorageConfig,
  AuthenticationConfig,
  CaptchaConfig,
  AnalyticsMarketingConfig,
  SecuritySettingsConfig,
  NotificationConfig,
} from '@repo/constants';

export const DEFAULT_EXTENSIONS = [
  {
    name: 'Cấu hình lưu trữ media',
    keyExtension: ExtensionKey.MEDIA_STORAGE,
    description: 'Cấu hình nơi lưu trữ hình ảnh, logo và tệp tin đa phương tiện của hệ thống.',
    isEnabled: true,
    defaultConfig: {
      provider: 'local', // 'local' | 's3' | 'r2' | 'tigris'
      s3Config: {
        endpoint: '',
        region: 'us-east-1',
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
        useSSL: true,
        publicUrl: '',
      },
      r2Config: {
        accountId: '',
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
        publicUrl: '',
      },
      tigrisConfig: {
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
      },
      imageProcessing: {
        enabled: false,
        convertToWebp: true,
        convertFormats: ['png', 'jpg', 'jpeg', 'bmp', 'tiff'],
        quality: 80,
        maxWidth: 1920,
        maxHeight: 1080,
        stripMetadata: true,
        progressive: true,
        preserveOriginal: false,
      },
      limits: {
        maxFileSizeMb: 5,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      },
    } as MediaStorageConfig,
  },
  {
    name: 'Cấu hình lưu trữ bài tập',
    keyExtension: ExtensionKey.PROBLEM_STORAGE,
    description: 'Cấu hình nơi lưu trữ các bộ dữ liệu testcase, code mẫu và đề bài của hệ thống.',
    isEnabled: true,
    defaultConfig: {
      provider: 'local', // 'local' | 's3' | 'r2' | 'tigris'
      s3Config: {
        endpoint: '',
        region: 'us-east-1',
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
        useSSL: true,
      },
      r2Config: {
        accountId: '',
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
      },
      tigrisConfig: {
        accessKeyId: '',
        secretAccessKey: '',
        bucketName: '',
      },
      limits: {
        maxFileSizeMb: 50, // Testcase file size limit
      },
    } as ProblemStorageConfig,
  },
  {
    name: 'Cấu hình Authentication (Better Auth)',
    keyExtension: ExtensionKey.AUTHENTICATION,
    description: 'Quản lý phương thức đăng nhập, các nhà cung cấp bên thứ ba (OAuth) và plugins của Better Auth.',
    isEnabled: true,
    defaultConfig: {
      betterAuth: { secret: '', url: '' },
      providers: {
        emailPassword: { enabled: true },
        github: { enabled: false, clientId: '', clientSecret: '' },
        google: { enabled: false, clientId: '', clientSecret: '' },
        discord: { enabled: false, clientId: '', clientSecret: '' },
        gitlab: { enabled: false, clientId: '', clientSecret: '' },
      },
      plugins: {
        twoFactor: { enabled: false },
        passkey: { enabled: false },
      },
    } as AuthenticationConfig,
  },
  {
    name: 'Cấu hình Captcha chống Bot',
    keyExtension: ExtensionKey.CAPTCHA,
    description: 'Bảo vệ biểu mẫu đăng ký, đăng nhập và nộp bài chống bot bằng Cloudflare Turnstile hoặc Google reCAPTCHA.',
    isEnabled: false,
    defaultConfig: {
      provider: 'none', // 'none' | 'turnstile' | 'recaptcha' | 'hcaptcha'
      siteKey: '',
      secretKey: '',
      requiredOn: [
        'auth.login',
        'auth.register',
        'auth.forgot_password',
        'submission.submit',
      ],
    } as CaptchaConfig,
  },
  {
    name: 'Cấu hình Analytics & Marketing',
    keyExtension: ExtensionKey.ANALYTICS_MARKETING,
    description: 'Tích hợp Google Analytics (GA4) và Google Ads Remarketing để theo dõi lượng truy cập và tối ưu quảng cáo.',
    isEnabled: false,
    defaultConfig: {
      googleAnalytics: { measurementId: '', isEnabled: false },
      googleAdsRemarketing: { conversionId: '', label: '', isEnabled: false },
    } as AnalyticsMarketingConfig,
  },
  {
    name: 'Cấu hình Bảo mật hệ thống',
    keyExtension: ExtensionKey.SYSTEM_SECURITY,
    description: 'Cấu hình các cơ chế tự động phòng chống spam, brute force tài khoản, giới hạn request và bảo vệ phiên đăng nhập người dùng.',
    isEnabled: true,
    defaultConfig: {
      session: {
        expiresInDays: 7,
        updateAgeSeconds: 86400,
      },
      passwordPolicy: {
        minLength: 8,
        requireSpecialChar: false,
        requireNumber: true,
      },
      ipRestriction: {
        enabled: false,
        whitelist: [],
      },
      rateLimit: {
        enabled: true,
        maxRequests: 120,
        windowMs: 60000,
      },
      ipSpamProtection: {
        enabled: true,
        apiSpamLimit: 5,
        banDurationMs: 3600000,
      },
      bruteForceProtection: {
        enabled: true,
        maxPasswordAttempts: 5,
        lockoutDurationMs: 900000,
      },
      sessionSecurity: {
        restrictMultipleSessions: false,
        ipChangeDetection: true,
        userAgentChangeDetection: true,
      },
    } as SecuritySettingsConfig,
  },
  {
    name: 'Cấu hình thông báo hệ thống',
    keyExtension: ExtensionKey.SYSTEM_NOTIFICATION,
    description: 'Cấu hình các cổng thông báo: SMTP Server (email), Telegram Bot, Discord Webhook, Slack Webhook và thiết lập quy tắc gửi tin cho từng sự kiện hệ thống.',
    isEnabled: false,
    defaultConfig: {
      smtpServers: [
        {
          id: 'default_smtp',
          name: 'VaniStudio Gmail SMTP',
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          user: 'smtp@vanistudio.com',
          pass: 'password_example',
          fromEmail: 'noreply@vanistudio.com',
          fromName: 'VaniStudio Support',
          isEnabled: false,
          isDefault: true,
          triggers: [
            'user.register',
            'auth.forgot_password',
            'contact.new_submission',
            'contact.new_submission_admin',
            'auth.two_factor_enabled',
            'auth.two_factor_disabled',
            'auth.otp_verification',
            'auth.register_verification',
            'auth.password_changed',
            'auth.login_detected',
          ],
        },
      ],
      clientTelegramBot: {
        botToken: '',
        chatId: '',
        isEnabled: false,
        triggers: [],
      },
      adminTelegramBots: [
        {
          id: 'admin_bot_general',
          name: 'Admin General Bot',
          botToken: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
          chatId: '-100123456789',
          isEnabled: false,
          triggers: [
            'user.register_admin',
            'security.ip_banned',
          ],
        },
      ],
      clientDiscordWebhook: {
        isEnabled: false,
        triggers: [],
      },
      adminDiscordWebhooks: [
        {
          id: 'admin_discord_security',
          name: 'Discord Security Logs',
          webhookUrl: 'https://discord.com/api/webhooks/example',
          isEnabled: false,
          triggers: [
            'user.register_admin',
            'security.ip_banned',
          ],
        },
      ],
      clientSlackWebhook: {
        isEnabled: false,
        triggers: [],
      },
      adminSlackWebhooks: [
        {
          id: 'admin_slack_crm',
          name: 'Slack CRM Notifications',
          webhookUrl: 'https://hooks.slack.com/services/example',
          isEnabled: false,
          triggers: [
            'user.register_admin',
            'security.ip_banned',
          ],
        },
      ],
    } as NotificationConfig,
  },
];
