import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Lỗi hệ thống nội bộ';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && (res as any).message ? (res as any).message : res;
    } else if ((exception as any)?.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      message = 'Dữ liệu trùng lặp (duplication conflict)';
    } else if ((exception as any)?.code === 'P2003' || (exception as any)?.code === 'P2025') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Dữ liệu không hợp lệ hoặc tài nguyên tham chiếu không tồn tại';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
