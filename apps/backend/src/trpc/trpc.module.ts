import { Module, NestModule, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { TrpcRouter } from './trpc.router';
import { createContext } from './context';
import { DatabaseModule } from '../database/database.module';
import { ConfigurationModule } from '../modules/configuration/configuration.module';

@Module({
  imports: [DatabaseModule, ConfigurationModule],
  providers: [TrpcRouter],
  exports: [TrpcRouter],
})
export class TrpcModule implements NestModule, OnModuleInit {
  constructor(
    private readonly trpcRouter: TrpcRouter,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  onModuleInit() {
    const httpAdapter = this.adapterHost.httpAdapter;
    const fastifyInstance = httpAdapter.getInstance();

    fastifyInstance.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      useMiddie: false,
      trpcOptions: {
        router: this.trpcRouter.appRouter,
        createContext,
      },
    });
  }

  configure() {}
}
