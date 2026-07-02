import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { QueueModule } from '../queue/queue.module';
import { ConfigurationRepository } from './configuration.repository';
import { ConfigurationService } from './configuration.service';

@Module({
  imports: [DatabaseModule, QueueModule],
  providers: [ConfigurationRepository, ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
