import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, NatsConnection, JSONCodec, JetStreamClient } from 'nats';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private natsConn: NatsConnection;
  private jsClient: JetStreamClient;
  private readonly codec = JSONCodec();
  private readonly streamName = 'TRUESUBMIT';
  private readonly subject = 'submissions.created';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const natsUrl = this.configService.get<string>(
      'APP_NATS_URL',
      'nats://127.0.0.1:4222',
    );
    console.log(`➥ Connecting to NATS server at: ${natsUrl}`);
    try {
      this.natsConn = await connect({ servers: natsUrl });
      this.jsClient = this.natsConn.jetstream();
      console.log(`➥ Connected to NATS successfully`);
      const jsm = await this.natsConn.jetstreamManager();
      try {
        await jsm.streams.info(this.streamName);
        console.log(`➥ NATS Stream "${this.streamName}" already exists.`);
      } catch (err) {
        console.log(
          `➥ NATS Stream "${this.streamName}" does not exist, creating...`,
        );
        await jsm.streams.add({
          name: this.streamName,
          subjects: [this.subject],
        });
        console.log(`➥ NATS Stream "${this.streamName}" created successfully.`);
      }
    } catch (err) {
      console.error(`➥ NATS connection/setup error:`, err);
    }
  }

  async onModuleDestroy() {
    if (this.natsConn) {
      console.log(`➥ Closing NATS connection...`);
      await this.natsConn.close();
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
    if (!this.jsClient) {
      throw new Error('NATS JetStream client is not initialized');
    }
    const payload = this.codec.encode(job);
    const pubAck = await this.jsClient.publish(this.subject, payload);
    console.log(
      `➥ Pushed job to NATS JetStream (Seq: ${pubAck.seq}) for submission: ${job.submissionId}`,
    );
  }
}
