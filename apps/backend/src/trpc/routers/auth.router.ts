import { z } from 'zod';
import { router, publicProcedure } from '../trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '../../database/schemas';

export const createAuthRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        // Logic mock cho login
        return {
          success: true,
          accessToken: 'mock_access_token_jwt',
          refreshToken: 'mock_refresh_token_jwt',
        };
      }),

    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(6),
          displayName: z.string(),
          studentCode: z.string().optional(),
          className: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        // Logic mock cho register
        return {
          success: true,
          message: 'User registered successfully',
        };
      }),
  });
