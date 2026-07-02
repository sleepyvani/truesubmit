import { z } from 'zod';
import { router, publicProcedure } from '../trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '../../database/schemas';

export const createUserRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    getProfile: publicProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ input }) => {
        return {
          id: input.userId,
          email: 'student@truesubmit.edu.vn',
          displayName: 'Nguyễn Văn A',
          studentCode: 'B22DCCN123',
          className: 'D22CNPM01',
          role: 'regular_user',
        };
      }),

    updateProfile: publicProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          displayName: z.string().min(1).optional(),
          bio: z.string().optional(),
          avatarUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          updatedFields: input,
        };
      }),
  });
