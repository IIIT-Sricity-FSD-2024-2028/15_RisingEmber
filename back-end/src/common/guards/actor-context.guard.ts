import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { StoreService } from '../../store/store.service';
import { RequestActor } from '../interfaces/request-actor.interface';
import { Role } from '../../store/entities';

@Injectable()
export class ActorContextGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly storeService: StoreService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      actor?: RequestActor;
    }>();

    const authorization = String(request.headers.authorization || '').trim();
    if (authorization) {
      const match = /^Bearer\s+([A-Za-z0-9_-]+)$/i.exec(authorization);
      if (!match) {
        throw new ForbiddenException('Invalid authorization header.');
      }

      const sessionToken = match[1];
      const user = this.storeService.findUserBySessionToken(sessionToken);
      if (!user) {
        throw new ForbiddenException('Invalid or expired session.');
      }

      request.actor = {
        id: user.id,
        role: user.role,
        user,
        sessionToken,
      };
      return true;
    }

    const allowEvaluationHeaders = process.env.NODE_ENV === 'test'
      || process.env.ALLOW_EVALUATION_ACTOR_HEADERS === 'true';
    if (!allowEvaluationHeaders) {
      throw new ForbiddenException('A valid bearer session is required.');
    }

    const roleHeader = this.normalizeRoleHeader(String(request.headers['x-role'] || ''));
    const actorId = String(request.headers['x-actor-id'] || '').trim();

    if (!roleHeader) {
      throw new ForbiddenException('Invalid or missing x-role header.');
    }

    if (!actorId) {
      throw new BadRequestException('Missing x-actor-id header.');
    }

    const user = this.storeService.findUserById(actorId);
    if (!user) {
      throw new ForbiddenException('Unknown actor context.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This actor account is not active.');
    }

    if (user.role !== roleHeader) {
      throw new ForbiddenException('x-role does not match actor.');
    }

    request.actor = {
      id: user.id,
      role: user.role,
      user,
    };

    return true;
  }

  private normalizeRoleHeader(value: string): Role | null {
    const normalized = String(value || '').trim().toLowerCase();

    const roleMap: Record<string, Role> = {
      customer: Role.CUSTOMER,
      'service provider': Role.PROVIDER,
      provider: Role.PROVIDER,
      arbitrator: Role.ARBITRATOR,
      admin: Role.ADMIN,
    };

    return roleMap[normalized] || null;
  }
}
