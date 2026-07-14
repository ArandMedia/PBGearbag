import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
    const message = typeof detail === 'string' ? detail : (detail as { message?: string | string[] }).message ?? 'Request failed';
    const requestId = response.locals.requestId as string | undefined;

    if (status >= 500) {
      this.logger.error(JSON.stringify({ requestId, method: request.method, path: request.url, status }), exception instanceof Error ? exception.stack : undefined);
      // No-ops if SENTRY_DSN isn't set (Sentry.init was never called in
      // main.ts) — safe to call unconditionally rather than threading an
      // "is Sentry enabled" flag through here.
      Sentry.captureException(exception, { extra: { requestId, path: request.url } });
    }

    response.status(status).json({
      error: { status, message },
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
