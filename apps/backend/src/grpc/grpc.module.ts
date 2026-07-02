import { Module } from '@nestjs/common';
import { SubmissionController } from './submission.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SubmissionController],
})
export class GrpcModule {}
