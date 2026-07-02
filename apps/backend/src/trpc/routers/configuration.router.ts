import { router, publicProcedure } from '@/trpc/trpc.instance';
import { z } from 'zod';
import { ConfigurationService } from '../../modules/configuration/configuration.service';

export const createConfigurationRouter = (
  configService: ConfigurationService,
) =>
  router({
    status: publicProcedure.query(async () => {
      return configService.getSetupStatus();
    }),

    checkDb: publicProcedure.mutation(async () => {
      return configService.checkDbConnection();
    }),

    migrateDb: publicProcedure.mutation(async () => {
      return configService.migrateDb();
    }),

    checkNats: publicProcedure.mutation(async () => {
      return configService.checkNats();
    }),

    getDbTables: publicProcedure.query(async () => {
      return configService.getDbTables();
    }),

    setupAdmin: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          displayName: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        return configService.setupAdmin(input);
      }),

    saveSystemConfig: publicProcedure
      .input(
        z.object({
          systemName: z.string().min(1),
          allowedLanguages: z.array(z.string()),
          sandboxTimeLimit: z.number().min(1),
          sandboxMemoryLimit: z.number().min(1),
        }),
      )
      .mutation(async ({ input }) => {
        return configService.saveSystemConfig(input);
      }),

    completeSetup: publicProcedure.mutation(async () => {
      return configService.completeSetup();
    }),
  });
