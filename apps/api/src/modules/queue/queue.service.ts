import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly queueName = 'truesubmit_queue';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'APP_REDIS_CONN_STRING',
      'redis://127.0.0.1:6379'
    );

    console.log(`➥ Connecting to Redis queue at: ${redisUrl}`);
    this.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.redisClient.on('connect', () => {
      console.log(`➥ Connected to Redis successfully`);
    });

    this.redisClient.on('error', (err) => {
      console.error(`➥ Redis connection error:`, err);
    });
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      console.log(`➥ Closing Redis connection...`);
      await this.redisClient.quit();
    }
  }

  async pushSubmission(job: {
    submissionId: string;
    language: string;
    code: string;
    timeLimit: number;
    memoryLimit: number;
    cpuLimit: number;
  }): Promise<void> {
    const payload = JSON.stringify(job);
    await this.redisClient.lpush(this.queueName, payload);
    console.log(`➥ Pushed job to queue: ${job.submissionId}`);
  }
}
