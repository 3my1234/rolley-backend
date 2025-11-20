import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get('User-Agent') || '';
    const start = Date.now();
    const logger = this.logger; // Capture logger reference

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('Content-Length');
      const duration = Date.now() - start;

      logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${duration}ms`,
      );
    });

    next();
  }
}
