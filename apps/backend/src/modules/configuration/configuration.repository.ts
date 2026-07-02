import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { POSTGRES_DB } from '@/database/database.provider';
import * as schemas from '@/database/schemas';
import { eq, sql } from 'drizzle-orm';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class ConfigurationRepository {
  constructor(
    @Inject(POSTGRES_DB) private readonly db: NodePgDatabase<typeof schemas>,
  ) {}

  async getSystemStatus() {
    return this.db
      .select()
      .from(schemas.systemSettings)
      .where(eq(schemas.systemSettings.keySetting, 'system_status'))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async getRoleByKey(key: string) {
    return this.db
      .select()
      .from(schemas.roles)
      .where(eq(schemas.roles.keyRole, key))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async createRole(data: typeof schemas.roles.$inferInsert) {
    return this.db
      .insert(schemas.roles)
      .values(data)
      .returning()
      .then((res) => res[0] || null);
  }

  async getUserByEmail(email: string) {
    return this.db
      .select()
      .from(schemas.users)
      .where(eq(schemas.users.email, email))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async hasAnyUser() {
    return this.db
      .select()
      .from(schemas.users)
      .limit(1)
      .then((res) => res.length > 0);
  }

  async createUser(data: typeof schemas.users.$inferInsert) {
    return this.db
      .insert(schemas.users)
      .values(data)
      .returning()
      .then((res) => res[0] || null);
  }

  async getUserProfile(userId: string) {
    return this.db
      .select()
      .from(schemas.userProfiles)
      .where(eq(schemas.userProfiles.userId, userId))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async createUserProfile(data: typeof schemas.userProfiles.$inferInsert) {
    return this.db
      .insert(schemas.userProfiles)
      .values(data)
      .returning()
      .then((res) => res[0] || null);
  }

  async updateUserProfile(userId: string, displayName: string) {
    return this.db
      .update(schemas.userProfiles)
      .set({ displayName })
      .where(eq(schemas.userProfiles.userId, userId))
      .returning()
      .then((res) => res[0] || null);
  }

  async getSystemSettingByKey(key: string) {
    return this.db
      .select()
      .from(schemas.systemSettings)
      .where(eq(schemas.systemSettings.keySetting, key))
      .limit(1)
      .then((res) => res[0] || null);
  }

  async createSystemSetting(keySetting: string, val: any) {
    return this.db
      .insert(schemas.systemSettings)
      .values({ keySetting, val })
      .returning()
      .then((res) => res[0] || null);
  }

  async updateSystemSetting(keySetting: string, val: any) {
    return this.db
      .update(schemas.systemSettings)
      .set({ val, updatedAt: new Date() })
      .where(eq(schemas.systemSettings.keySetting, keySetting))
      .returning()
      .then((res) => res[0] || null);
  }

  async checkDbConnection() {
    try {
      await this.db.execute(sql`SELECT 1`);
      const checkTableQuery = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_settings'
        );
      `);
      const tablesExist = checkTableQuery.rows?.[0]?.exists === true;
      return {
        success: true,
        tablesExist,
      };
    } catch (error: any) {
      return {
        success: false,
        tablesExist: false,
        message: error?.message || String(error),
      };
    }
  }

  async migrateDb() {
    try {
      let migrationsPath = join(process.cwd(), 'apps/backend/src/database/migrations');
      if (!existsSync(migrationsPath)) {
        migrationsPath = join(process.cwd(), 'src/database/migrations');
      }
      if (!existsSync(migrationsPath)) {
        migrationsPath = join(__dirname, '../../database/migrations');
      }

      const { migrate } = require('drizzle-orm/node-postgres/migrator');
      await migrate(this.db, { migrationsFolder: migrationsPath });

      return {
        success: true,
        message: 'Di chuyển cấu trúc cơ sở dữ liệu (Migration) thành công.',
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi chạy migration: ${error?.message || error}`,
      };
    }
  }

  async getDbTables() {
    try {
      const res = await this.db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      return {
        success: true,
        tables: (res.rows || []).map((row: any) => row.table_name) as string[],
      };
    } catch (error: any) {
      return {
        success: false,
        tables: [],
        message: error?.message || String(error),
      };
    }
  }
}
