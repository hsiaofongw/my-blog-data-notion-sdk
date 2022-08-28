import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { from, Observable  } from 'rxjs';
import { tap, timeout } from 'rxjs/operators';

@Injectable()
export class StaleWhileRevalidateInterceptor implements NestInterceptor {
  
  private cache: { [key: string]: { generatedAt: Date, content: any } } = {};
  private cacheBackgroundUpdateSchedule?: NodeJS.Timeout;

  private getLogger(requestId: number): Logger {
    return new Logger(StaleWhileRevalidateInterceptor.name + `@Request[id: ${requestId}]`);
  }

  private getRequestKey(request: Request) {
    return `${request.method} ${request.path}`;
  }

  private tryScheduleBackgroundCacheRewnewTask(context: ExecutionContext, next: CallHandler, onComplete?: () => void) {
    const handle = next.handle;
    const [req, res, _] = context.getArgs() as [Request, Response, NextFunction];
    const logger = this.getLogger(res.locals['requestId']);

    if (!this.cacheBackgroundUpdateSchedule) {
      this.cacheBackgroundUpdateSchedule = setTimeout(() => {
        logger.log('Refreshing cache...');
        handle().pipe(
          timeout({ first: 5 * 60 * 1000 }), 
          tap((data) => {
            const now = new Date();
            this.cache[this.getRequestKey(req)] = { generatedAt: now, content: data };
            logger.log('Cached is renewd.');
            if (onComplete) {
              onComplete();
            }
            this.cacheBackgroundUpdateSchedule = undefined;
          })
        ).subscribe();
      }, 0);
      logger.log('A background cache update task is just scheduled.');
    } else {
      logger.log('A background cache update task is already there.');
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const [req, res, _] = context.getArgs() as [Request, Response, NextFunction];
    const logger = new Logger(StaleWhileRevalidateInterceptor.name + `@Request[id: ${res.locals['requestId']}]`);
    logger.log(`Origin url: ${req.originalUrl}`);
    logger.log(`Path: ${req.path}`);

    const requestKey = `${req.method} ${req.path}`;
    const cacheEntry = this.cache[requestKey];
    const now = new Date();
    if (cacheEntry) {
      // cached
      logger.log('Cached.');
      const diffInMs = Math.abs(now.valueOf()-cacheEntry.generatedAt.valueOf());
      if (diffInMs > 60 * 1000) {
        // cached but staled
        logger.log('Cached but staled.')
        return from([cacheEntry.content]).pipe(tap(() => {
          this.tryScheduleBackgroundCacheRewnewTask(context, next);
        }));
      } else {
        // cached and fresh
        logger.log('Cached and it\'s fresh');
        return from([cacheEntry.content]);
      }
    } else {
      // uncached
      logger.log('Uncached');
      return new Observable((subscriber) => {
        this.tryScheduleBackgroundCacheRewnewTask(context, next, () => {
          subscriber.next(this.cache[requestKey].content);
          subscriber.complete();
        })
      });
    }
  }
}
