import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/trpc/trpc.router';
import { APP_BACKEND_URL } from './env';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${APP_BACKEND_URL}/trpc`,
      transformer: superjson,
    }),
  ],
});
