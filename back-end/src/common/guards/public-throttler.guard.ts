import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PublicThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<{ method?: string }>();
    const method = String(request.method || '').toUpperCase();
    return !isPublic || ['GET', 'HEAD', 'OPTIONS'].includes(method);
  }
}
