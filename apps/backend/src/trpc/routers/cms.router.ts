import { z } from 'zod';
import { router, publicProcedure } from '../trpc.instance';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schemas from '../../database/schemas';

export const createCmsRouter = (db: NodePgDatabase<typeof schemas>) =>
  router({
    getPage: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return {
          id: '019058b8-4c9f-723b-a25e-e47e17cb97cd',
          title: 'Điều khoản sử dụng',
          slug: input.slug,
          content: 'Nội dung điều khoản sử dụng hệ thống TrueSubmit...',
          updatedAt: new Date(),
        };
      }),

    getMenu: publicProcedure
      .input(z.object({ location: z.enum(['header', 'footer', 'sidebar']) }))
      .query(async ({ input }) => {
        return {
          location: input.location,
          items: [
            { label: 'Trang chủ', link: '/' },
            { label: 'Kỳ thi', link: '/contests' },
            { label: 'Đề bài', link: '/problems' },
          ],
        };
      }),
  });
