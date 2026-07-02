import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KeyPermission } from '@repo/constants';

export const RequirePermissions = (...permissions: KeyPermission[]) =>
  SetMetadata('permissions', permissions);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      KeyPermission[]
    >('permissions', [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissions) {
      return false;
    }

    // Check if the user has the required permissions
    const hasPermission = requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );

    return hasPermission;
  }
}
