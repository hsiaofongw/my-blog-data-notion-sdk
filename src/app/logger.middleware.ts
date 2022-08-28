import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = res.locals['requestId'] as number;
    this.logger.log(`Request[${requestId}]: ${req.method} ${req.originalUrl}`);
    next();
  }
}
