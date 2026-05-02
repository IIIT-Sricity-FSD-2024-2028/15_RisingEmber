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

    const roleHeader = String(request.headers['x-role'] || '').trim().toLowerCase() as Role;
    const actorId = String(request.headers['x-actor-id'] || '').trim();

    if (!roleHeader) {
      throw new ForbiddenException('Missing x-role header.');
    }

    if (!actorId) {
      throw new BadRequestException('Missing x-actor-id header.');
    }

    const user = this.storeService.findUserById(actorId);
    if (!user) {
      throw new ForbiddenException('Unknown actor context.');
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
}
