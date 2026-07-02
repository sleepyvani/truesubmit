import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TrpcModule } from './trpc/trpc.module';
import { GrpcModule } from './grpc/grpc.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TrpcModule,
    GrpcModule,
    QueueModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
