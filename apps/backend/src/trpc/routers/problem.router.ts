import { z } from 'zod';
import { router, publicProcedure } from '../trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '../../database/schemas';

export const createProblemRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    listProblems: publicProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
          search: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        return {
          problems: [
            {
              id: '019058b8-4c9f-723b-a25e-e47e17cb97cb',
              title: 'A + B Problem',
              difficulty: 'easy',
              points: 10,
              solvedCount: 350,
            },
          ],
          total: 1,
          page: input.page,
          limit: input.limit,
        };
      }),

    getProblemDetails: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return {
          id: input.id,
          title: 'A + B Problem',
          description: 'Cho hai số nguyên A và B. Hãy tính tổng của chúng.',
          difficulty: 'easy',
          points: 10,
          timeLimit: 1000, // ms
          memoryLimit: 256, // MB
          codeTemplates: [
            {
              language: 'cpp',
              template:
                '#include <iostream>\nusing namespace std;\nint main() {\n  // Code here\n  return 0;\n}',
            },
          ],
        };
      }),
  });
