import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from './api-response.types';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof exceptionResponse === 'object' && exceptionResponse && 'message' in exceptionResponse
      ? (exceptionResponse as { message: string | string[] }).message
      : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    if (status >= 500) {
      this.logger.error(`Unhandled API error on ${request.method} ${request.url}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`API error ${status} on ${request.method} ${request.url}: ${JSON.stringify(message)}`);
    }

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: exception instanceof HttpException ? exception.name : 'InternalServerError',
        message: Array.isArray(message) ? message.join(', ') : message,
        details: exceptionResponse,
      },
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
