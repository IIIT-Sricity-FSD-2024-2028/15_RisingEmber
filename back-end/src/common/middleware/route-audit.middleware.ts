import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { auditLogger } from '../logger/winston-logger.service';

/**
 * RouteAuditMiddleware — Router-level middleware.
 * Applied ONLY to sensitive transaction routes: /bookings, /cases, /awards.
 * Logs a structured audit entry (actor, method, path, body summary) to the
 * audit log file before the request reaches the controller.
 */
@Injectable()
export class RouteAuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RouteAuditMiddleware.name);

  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    const method = req.method;
    const path = String(req.originalUrl || req.url || '').split('?')[0];
    const requestId = req.requestId || req.headers?.['x-request-id'] || '-';
    const actorId = String(req.headers?.['x-actor-id'] || '-');
    const actorRole = String(req.headers?.['x-role'] || '-');

    // Only log state-changing operations (POST, PATCH, DELETE, PUT)
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
      const auditEntry = {
        event: 'ROUTE_MUTATION',
        requestId,
        method,
        path,
        actorId,
        actorRole,
        timestamp: new Date().toISOString(),
      };

      auditLogger.info('Route mutation audit', auditEntry);
      this.logger.log(
        `[AUDIT] ${method} ${path} actorId=${actorId} role=${actorRole} requestId=${requestId}`,
      );
    }

    next();
  }
}
