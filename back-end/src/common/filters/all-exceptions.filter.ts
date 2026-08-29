import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RequestWithContext } from '../interfaces/request-with-context.interface';
import { appLogger } from '../logger/winston-logger.service';

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId: string;
}

function errorCode(statusCode: number, message: string | string[]) {
  if (statusCode === HttpStatus.BAD_REQUEST && Array.isArray(message)) return 'VALIDATION_ERROR';
  if (statusCode === HttpStatus.UNAUTHORIZED) return 'UNAUTHORIZED';
  if (statusCode === HttpStatus.FORBIDDEN) return 'FORBIDDEN';
  if (statusCode === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
  if (statusCode === HttpStatus.CONFLICT) return 'CONFLICT';
  if (statusCode === HttpStatus.TOO_MANY_REQUESTS) return 'RATE_LIMITED';
  if (statusCode >= 500) return 'INTERNAL_ERROR';
  return 'BAD_REQUEST';
}

function pathWithoutQuery(request: RequestWithContext) {
  return String(request.originalUrl || request.url || '').split('?')[0];
}

function redactErrorLog(value: string) {
  return value
    .replace(/(password|content|authorization|token)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/data:[^\s]+/gi, 'data:[redacted]');
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<{ status: (code: number) => { json: (body: ApiErrorResponse) => void }; headers?: Record<string, string> }>();
    const request = http.getRequest<RequestWithContext>();
    const requestId = request.requestId || response.headers?.['x-request-id'] || 'unknown-request';
    const path = pathWithoutQuery(request);

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error.';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const responseMessage = (exceptionResponse as { message?: unknown }).message;
        if (typeof responseMessage === 'string' || Array.isArray(responseMessage)) {
          message = responseMessage as string | string[];
        }
      }

      // Write HTTP errors (4xx/5xx) to rotating log files via Winston
      const errorEntry = {
        event: 'HTTP_EXCEPTION',
        requestId,
        path,
        statusCode,
        code: errorCode(statusCode, message),
        message,
        timestamp: new Date().toISOString(),
      };

      if (statusCode >= 500) {
        // Server errors: log as error with stack trace to error-%DATE%.log
        appLogger.error('HTTP server error', { ...errorEntry, stack: (exception as Error).stack });
      } else if (statusCode >= 400) {
        // Client errors: log as warn (expected: validation, forbidden, not found)
        appLogger.warn('HTTP client error', errorEntry);
      }
    } else {
      // Unhandled / unexpected exceptions
      const name = exception instanceof Error ? exception.name : 'UnknownError';
      const stack = exception instanceof Error ? exception.stack || exception.message : String(exception);
      const redactedStack = redactErrorLog(stack);

      // Existing NestJS console logger (keeps console output working)
      this.logger.error(redactErrorLog(`Unhandled ${name} requestId=${requestId}\n${stack}`));

      // Persist to Winston error log file (error-%DATE%.log)
      appLogger.error('Unhandled exception', {
        event: 'UNHANDLED_EXCEPTION',
        requestId,
        path,
        errorName: name,
        stack: redactedStack,
        timestamp: new Date().toISOString(),
      });
    }

    const body: ApiErrorResponse = {
      statusCode,
      code: errorCode(statusCode, message),
      message,
      timestamp: new Date().toISOString(),
      path,
      requestId,
    };

    response.status(statusCode).json(body);
  }
}
