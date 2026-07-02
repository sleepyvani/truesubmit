import { router, publicProcedure } from '@/trpc/trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '@/database/schemas';
import { eq } from 'drizzle-orm';

export const createConfigurationRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    status: publicProcedure.query(async () => {
      try {
        const settings = await db
          .select()
          .from(schemas.systemSettings)
          .where(eq(schemas.systemSettings.keySetting, 'system_status'))
          .limit(1);
        const firstSetting = settings[0];
        const isSystemConfigured =
          firstSetting !== undefined &&
          (firstSetting.val as Record<string, any>)?.initialized === true;
        const userList = await db.select().from(schemas.users).limit(1);
        const hasUsers = userList.length > 0;
        return {
          isInitialized: isSystemConfigured && hasUsers,
        };
      } catch (error) {
        return {
          isInitialized: false,
        };
      }
    }),
  });