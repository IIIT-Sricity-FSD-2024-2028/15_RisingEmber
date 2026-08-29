import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { appLogger } from '../logger/winston-logger.service';

const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'multipart/form-data',
];

const MAX_CONTENT_LENGTH_BYTES = 36 * 1024 * 1024; // 36 MiB

/**
 * DocumentUploadMiddleware — Router-level middleware.
 * Applied ONLY to /documents routes.
 * Validates that:
 * - Only POST requests with appropriate content-type are allowed.
 * - Content-Length does not exceed the allowed maximum before parsing.
 * - Logs every document upload attempt to the application log.
 */
@Injectable()
export class DocumentUploadMiddleware implements NestMiddleware {
  private readonly logger = new Logger(DocumentUploadMiddleware.name);

  use(req: Request & { requestId?: string }, res: Response, next: NextFunction) {
    const method = req.method.toUpperCase();
    const requestId = (req as any).requestId || req.headers?.['x-request-id'] || '-';
    const actorId = String(req.headers?.['x-actor-id'] || '-');
    const actorRole = String(req.headers?.['x-role'] || '-');

    // Only enforce on document creation (POST)
    if (method === 'POST') {
      const contentLength = parseInt(String(req.headers['content-length'] || '0'), 10);
      const contentType = String(req.headers['content-type'] || '').toLowerCase();

      // Log the upload attempt
      const uploadAttempt = {
        event: 'DOCUMENT_UPLOAD_ATTEMPT',
        requestId,
        actorId,
        actorRole,
        contentType,
        contentLengthBytes: contentLength,
        timestamp: new Date().toISOString(),
      };
      appLogger.info('Document upload attempt', uploadAttempt);
      this.logger.log(
        `[DOCUMENT-UPLOAD] actor=${actorId} role=${actorRole} contentType=${contentType} size=${contentLength}B requestId=${requestId}`,
      );

      // Reject oversized requests early (before body parsing)
      if (contentLength > MAX_CONTENT_LENGTH_BYTES) {
        appLogger.warn('Document upload rejected: payload too large', {
          ...uploadAttempt,
          maxAllowedBytes: MAX_CONTENT_LENGTH_BYTES,
        });
        res.status(413).json({
          statusCode: 413,
          code: 'PAYLOAD_TOO_LARGE',
          message: `Document payload exceeds the maximum allowed size of ${MAX_CONTENT_LENGTH_BYTES / 1024 / 1024} MiB.`,
          timestamp: new Date().toISOString(),
          requestId,
        });
        return;
      }

      // Check for unsupported content types on POST
      const isAllowedType = ALLOWED_CONTENT_TYPES.some((t) => contentType.startsWith(t));
      if (contentLength > 0 && !isAllowedType) {
        appLogger.warn('Document upload rejected: unsupported content-type', {
          ...uploadAttempt,
        });
        res.status(415).json({
          statusCode: 415,
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: `Content-Type "${contentType}" is not supported for document upload. Use application/json or multipart/form-data.`,
          timestamp: new Date().toISOString(),
          requestId,
        });
        return;
      }
    }

    next();
  }
}
