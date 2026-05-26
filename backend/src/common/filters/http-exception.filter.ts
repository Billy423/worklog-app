// Global exception filter. Normalises every error into a JSON envelope
// { status, error, path, timestamp } and logs 5xx with stack.

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= 500) {
      this.logger.error({ err: exception, path: req.url }, 'Unhandled error');
    }

    res.status(status).json({
      status,
      error: typeof message === 'string' ? message : (message as { message?: string }).message ?? message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
