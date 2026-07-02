import { z } from 'zod';
import { router, publicProcedure } from '../trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '../../database/schemas';

export const createContestRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    listContests: publicProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(50).default(10),
        }),
      )
      .query(async ({ input }) => {
        return {
          contests: [
            {
              id: '019058b8-4c9f-723b-a25e-e47e17cb97cc',
              title: 'Kỳ thi Giữa Kỳ I - CS101',
              startTime: new Date(),
              endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2h sau
              status: 'UPCOMING',
            },
          ],
          total: 1,
        };
      }),

    getContestDetails: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return {
          id: input.id,
          title: 'Kỳ thi Giữa Kỳ I - CS101',
          description: 'Mô tả kỳ thi thi lý thuyết & thực hành CS101.',
          startTime: new Date(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          problems: [
            {
              id: '019058b8-4c9f-723b-a25e-e47e17cb97cb',
              code: 'A',
              title: 'A + B Problem',
            },
          ],
        };
      }),

    registerContest: publicProcedure
      .input(
        z.object({
          contestId: z.string(),
          password: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: 'Registered to contest successfully',
        };
      }),
  });
