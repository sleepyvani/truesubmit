import { z } from 'zod';
import { router, publicProcedure } from '../trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '@/database/schemas';

export const createSubmissionRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    submit: publicProcedure
      .input(
        z.object({
          problemId: z.string().uuid(),
          contestId: z.string().uuid().optional(),
          language: z.string(),
          sourceCode: z.string(),
        }),
      )
      .mutation(async ({ input }) => {
        // Mock phản hồi nộp bài cực nhanh dưới 15ms
        return {
          success: true,
          submissionId: '019058b8-4c9f-723b-a25e-e47e17cb97ce',
          status: 'PENDING',
        };
      }),

    getSubmissionDetails: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        return {
          id: input.id,
          status: 'ACCEPTED',
          points: 100,
          language: 'cpp',
          submittedAt: new Date(),
          results: [
            {
              testcaseId: 'tc1',
              status: 'AC',
              timeSpent: 45,
              memorySpent: 2048,
            },
          ],
        };
      }),
  });
