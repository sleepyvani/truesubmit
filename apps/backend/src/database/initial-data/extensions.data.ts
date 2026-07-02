import { ExtensionKey } from '@repo/constants';

export const DEFAULT_EXTENSIONS = [
  {
    name: 'AWS S3 Storage',
    keyExtension: ExtensionKey.S3,
    description: 'Lưu trữ các tệp tin bài nộp và testcase lên AWS S3 hoặc MinIO.',
    isEnabled: false,
    defaultConfig: {
      endpoint: '', // Optional for custom S3 compatibility (MinIO, Cloudflare R2)
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
      bucketName: '',
      useSSL: true,
    },
  },
  {
    name: 'Discord Webhook Notification',
    keyExtension: ExtensionKey.DISCORD,
    description: 'Gửi thông báo kết quả chấm bài hoặc cập nhật hệ thống lên kênh Discord.',
    isEnabled: false,
    defaultConfig: {
      webhookUrl: '',
    },
  },
  {
    name: 'MOSS Plagiarism Checker',
    keyExtension: ExtensionKey.MOSS,
    description: 'Tích hợp công cụ MOSS để phát hiện gian lận/sao chép code.',
    isEnabled: false,
    defaultConfig: {
      mossUserId: '', // MOSS user identifier code
    },
  },
];


