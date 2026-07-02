import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import * as trpcExpress from '@trpc/server/adapters/express';
import { TrpcRouter } from './trpc.router';
import { createContext } from './context';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TrpcRouter],
  exports: [TrpcRouter],
})
export class TrpcModule implements NestModule {
  constructor(private readonly trpcRouter: TrpcRouter) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        trpcExpress.createExpressMiddleware({
          router: this.trpcRouter.appRouter,
          createContext,
        })
      )
      .forRoutes('/trpc');
  }
}
