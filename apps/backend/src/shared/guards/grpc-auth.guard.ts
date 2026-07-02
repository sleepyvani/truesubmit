import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

@Injectable()
export class GrpcAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const type = context.getType();
    if (type !== 'rpc') {
      return false;
    }

    const rpcContext = context.switchToRpc();
    const metadata = rpcContext.getContext();

    // Đọc token từ gRPC Metadata (chấp nhận header 'authorization' hoặc 'x-internal-token')
    const token =
      metadata.get('authorization')?.[0]?.toString() ||
      metadata.get('x-internal-token')?.[0]?.toString();

    const expectedToken = this.configService.get<string>(
      'APP_INTERNAL_AUTH_TOKEN',
    );

    if (!expectedToken || token !== expectedToken) {
      console.warn(
        `➥ [gRPC-Auth] Access denied: Invalid or missing internal token.`,
      );
      return false;
    }

    return true;
  }
}
