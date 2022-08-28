import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';

@Injectable()
export class IdIssuerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IdIssuerMiddleware.name);

  private requestCount = 0;
  use(req: any, res: Response, next: NextFunction) {
    res.locals['requestId'] = this.requestCount;
    this.logger.log(`New request, request id: ${this.requestCount}`);
    this.requestCount++;
    next();
  }
}
