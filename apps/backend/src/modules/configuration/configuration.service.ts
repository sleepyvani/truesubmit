import { Injectable } from '@nestjs/common';
import { ConfigurationRepository } from './configuration.repository';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ConfigurationService {
  constructor(
    private readonly configRepository: ConfigurationRepository,
    private readonly queueService: QueueService,
  ) {}

  async getSetupStatus() {
    try {
      const statusSetting = await this.configRepository.getSystemStatus();
      if (!statusSetting || !statusSetting.val) {
        return { isInitialized: false };
      }
      const val = statusSetting.val as { initialized?: boolean };
      const hasUsers = await this.configRepository.hasAnyUser();
      return { isInitialized: !!val.initialized && hasUsers };
    } catch {
      return { isInitialized: false };
    }
  }

  async checkAndSeedDb() {
    try {
      let superAdminRole =
        await this.configRepository.getRoleByKey('super_admin');
      if (!superAdminRole) {
        superAdminRole = await this.configRepository.createRole({
          name: 'Super Admin',
          keyRole: 'super_admin',
          permissions: ['all'],
          description: 'Quyền quản trị cao nhất hệ thống',
        });
      }

      const regularUserRole =
        await this.configRepository.getRoleByKey('regular_user');
      if (!regularUserRole) {
        await this.configRepository.createRole({
          name: 'Regular User',
          keyRole: 'regular_user',
          permissions: ['contest:join', 'submission:create', 'submission:view'],
          description: 'Người dùng/Thí sinh tham gia thi',
        });
      }

      const sandboxSetting =
        await this.configRepository.getSystemSettingByKey('sandbox_limits');
      if (!sandboxSetting) {
        await this.configRepository.createSystemSetting('sandbox_limits', {
          timeLimitMs: 2000,
          memoryLimitMb: 256,
        });
      }

      const languagesSetting =
        await this.configRepository.getSystemSettingByKey('allowed_languages');
      if (!languagesSetting) {
        await this.configRepository.createSystemSetting('allowed_languages', [
          'c',
          'cpp',
          'java',
          'python',
          'go',
        ]);
      }

      const statusSetting =
        await this.configRepository.getSystemSettingByKey('system_status');
      if (!statusSetting) {
        await this.configRepository.createSystemSetting('system_status', {
          initialized: false,
        });
      }

      return {
        success: true,
        message:
          'Kết nối database thành công và đã đồng bộ dữ liệu vai trò mặc định.',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi kiểm tra cơ sở dữ liệu';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async checkDbConnection() {
    try {
      return await this.configRepository.checkDbConnection();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi kiểm tra kết nối database';
      return {
        success: false,
        tablesExist: false,
        message: errorMessage,
      };
    }
  }

  async migrateDb() {
    try {
      const migrateResult = await this.configRepository.migrateDb();
      if (!migrateResult.success) {
        return migrateResult;
      }
      const seedResult = await this.checkAndSeedDb();
      if (!seedResult.success) {
        return {
          success: false,
          message: `Chạy migration thành công nhưng lỗi seeding: ${seedResult.message}`,
        };
      }
      return {
        success: true,
        message: 'Khởi tạo cấu trúc bảng và seeding dữ liệu thành công.',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi chạy migration';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async checkNats() {
    try {
      const result = await this.queueService.checkConnection();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi kiểm tra kết nối NATS';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async getDbTables() {
    return this.configRepository.getDbTables();
  }

  async setupAdmin(input: {
    email: string;
    displayName: string;
    password: string;
  }) {
    try {
      let role = await this.configRepository.getRoleByKey('super_admin');
      if (!role) {
        role = await this.configRepository.createRole({
          name: 'Super Admin',
          keyRole: 'super_admin',
          permissions: ['all'],
          description: 'Quyền quản trị cao nhất hệ thống',
        });
      }

      if (!role) {
        throw new Error(
          'Không tìm thấy hoặc không thể khởi tạo vai trò Super Admin',
        );
      }
      const roleId = role.id;

      const crypto = await import('crypto');
      const hashedPassword = crypto
        .createHash('sha256')
        .update(input.password)
        .digest('hex');

      const existingUser = await this.configRepository.getUserByEmail(
        input.email,
      );

      let userId: string;
      if (!existingUser) {
        const newUser = await this.configRepository.createUser({
          email: input.email,
          password: hashedPassword,
          isActive: true,
          roleId: roleId,
        });
        if (!newUser) {
          throw new Error('Không thể khởi tạo tài khoản quản trị mới');
        }
        userId = newUser.id;
      } else {
        userId = existingUser.id;
      }

      const existingProfile =
        await this.configRepository.getUserProfile(userId);
      if (!existingProfile) {
        await this.configRepository.createUserProfile({
          userId: userId,
          displayName: input.displayName,
          preferredLanguage: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
        });
      } else {
        await this.configRepository.updateUserProfile(
          userId,
          input.displayName,
        );
      }

      return {
        success: true,
        message: 'Tạo tài khoản quản trị thành công',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể tạo tài khoản quản trị';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async saveSystemConfig(input: {
    systemName: string;
    allowedLanguages: string[];
    sandboxTimeLimit: number;
    sandboxMemoryLimit: number;
  }) {
    try {
      const existingLimits =
        await this.configRepository.getSystemSettingByKey('sandbox_limits');
      const limitsVal = {
        timeLimitMs: input.sandboxTimeLimit,
        memoryLimitMb: input.sandboxMemoryLimit,
      };

      if (!existingLimits) {
        await this.configRepository.createSystemSetting(
          'sandbox_limits',
          limitsVal,
        );
      } else {
        await this.configRepository.updateSystemSetting(
          'sandbox_limits',
          limitsVal,
        );
      }

      const existingLanguages =
        await this.configRepository.getSystemSettingByKey('allowed_languages');
      if (!existingLanguages) {
        await this.configRepository.createSystemSetting(
          'allowed_languages',
          input.allowedLanguages,
        );
      } else {
        await this.configRepository.updateSystemSetting(
          'allowed_languages',
          input.allowedLanguages,
        );
      }

      const existingSystemName =
        await this.configRepository.getSystemSettingByKey('system_name');
      const nameVal = { name: input.systemName };
      if (!existingSystemName) {
        await this.configRepository.createSystemSetting('system_name', nameVal);
      } else {
        await this.configRepository.updateSystemSetting('system_name', nameVal);
      }

      return {
        success: true,
        message: 'Lưu cấu hình hệ thống thành công',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể lưu cấu hình hệ thống';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async completeSetup() {
    try {
      const existingStatus =
        await this.configRepository.getSystemSettingByKey('system_status');
      const statusVal = {
        initialized: true,
        initializedAt: new Date().toISOString(),
      };

      if (!existingStatus) {
        await this.configRepository.createSystemSetting(
          'system_status',
          statusVal,
        );
      } else {
        await this.configRepository.updateSystemSetting(
          'system_status',
          statusVal,
        );
      }

      return {
        success: true,
        message: 'Kích hoạt hệ thống thành công',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Không thể kích hoạt hệ thống';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}
