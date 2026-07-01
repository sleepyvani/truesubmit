import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt Microservice gRPC trên cổng 50051
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'submission',
      protoPath: join(__dirname, 'grpc/submission.proto'),
      url: '0.0.0.0:50051',
    },
  });

  // Khởi chạy các microservices đã kết nối
  await app.startAllMicroservices();

  // Cho phép CORS cho frontend ( Next.js )
  app.enableCors({
    origin: ['http://localhost:3000', 'https://truesubmit.yourdomain.com'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[HTTP] API Server is running on: http://localhost:${port}`);
  console.log(`[gRPC] Microservice is running on: 0.0.0.0:50051`);
}
bootstrap();
