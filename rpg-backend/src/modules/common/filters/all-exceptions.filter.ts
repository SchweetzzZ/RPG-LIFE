import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger, } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, any>;
        error = resObj.error || exception.name;

        // Formata erros lançados pelo nestjs-zod / ZodValidationPipe
        if (Array.isArray(resObj.errors)) {
          message = resObj.errors.map((err: any) => {
            const path = Array.isArray(err.path) ? err.path.join('.') : err.path;
            return path ? `${path}: ${err.message}` : err.message;
          });
        } else if (Array.isArray(resObj.issues)) {
          message = resObj.issues.map((issue: any) => {
            const path = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;
            return path ? `${path}: ${issue.message}` : issue.message;
          });
        } else if (resObj.message) {
          message = resObj.message;
        }
      }
    } else if (typeof exception === 'object' && exception !== null) {
      const err = exception as Record<string, any>;

      // Trata erro de chave duplicada do MongoDB (E11000)
      if (err.code === 11000) {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        const duplicateFields = Object.keys(err.keyPattern || {}).join(', ');
        message = duplicateFields
          ? `Já existe um registro com o valor informado para: ${duplicateFields}`
          : 'Registro duplicado encontrado';
      } else {
        this.logger.error(`Unhandled Exception on ${request.method} ${request.url}:`, err.stack || err);
      }
    } else {
      this.logger.error(`Unknown Exception on ${request.method} ${request.url}:`, exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
