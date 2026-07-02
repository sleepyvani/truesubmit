import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.getHttpAdapter().get('/', (req, res) => {
    res.send('Hello World');
  });

  const grpcPort = process.env.APP_INTERNAL_GRPC_PORT ?? '50051';
  const localProto = join(__dirname, 'grpc/submission.proto');
  const distProto = join(__dirname, '../grpc/submission.proto');
  const protoPath = existsSync(localProto) ? localProto : distProto;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'submission',
      protoPath,
      url: `0.0.0.0:${grpcPort}`,
    },
  });

  await app.startAllMicroservices();

  app.enableCors({
    origin: ['http://localhost:3000', 'https://truesubmit.yourdomain.com'],
    credentials: true,
  });

  const port = process.env.APP_SERVER_PORT_VALUE ?? 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`[HTTP] API Server is running on: http://localhost:${port}`);
  console.log(`[gRPC] Microservice is running on: 0.0.0.0:${grpcPort}`);
}
bootstrap();
