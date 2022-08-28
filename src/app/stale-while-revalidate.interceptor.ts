import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { from, Observable, Subject } from "rxjs";
import { concatAll, map, tap } from "rxjs/operators";
import {
  RedisCacheService,
} from "./redis-cache/redis-cache.service";

@Injectable()
export class StaleWhileRevalidateInterceptor implements NestInterceptor {
  constructor(private cacheService: RedisCacheService) {}

  private channelMap: Record<string, Subject<string>> = {};

  private getLogger(requestId: number): Logger {
    return new Logger(
      StaleWhileRevalidateInterceptor.name + `@Request[id: ${requestId}]`
    );
  }

  private getRequestKey(request: Request) {
    return `${request.method} ${request.path}`;
  }

  private tryScheduleBackgroundCacheRewnewTask(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const [req, res, _] = context.getArgs() as [
      Request,
      Response,
      NextFunction
    ];
    const logger = this.getLogger(res.locals["requestId"]);
    const cacheKey = this.getRequestKey(req);
    if (this.channelMap[cacheKey]) {
      logger.log("Already a scheduled background update task there.");
      return new Observable(observer => {
        this.channelMap[cacheKey].subscribe(data => {
          observer.next(data);
          observer.complete();
        });
      });
    } else {
      logger.log("Refreshing cache...");
      this.channelMap[cacheKey] = new Subject<string>();
      return next.handle().pipe(
        tap((data) => {
          const now = new Date();
          this.cacheService
            .setObject(this.getRequestKey(req), {
              generatedAt: now.valueOf(),
              content: data,
            })
            .then(() => {
              logger.log("Cached is renewd.");
              this.channelMap[cacheKey].next(data);
              delete this.channelMap[cacheKey];
            });
        })
      );
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const [req, res, _] = context.getArgs() as [
      Request,
      Response,
      NextFunction
    ];
    const logger = this.getLogger(res.locals["requestId"]);
    const requestKey = this.getRequestKey(req);
    logger.log("Request key is: " + requestKey);

    return from(this.cacheService.getObject(requestKey)).pipe(
      map((cacheEntry) => {
        if (cacheEntry) {
          logger.log("Cached.");
          const now = new Date();
          const diffInMs = Math.abs(now.valueOf() - cacheEntry.generatedAt);
          if (diffInMs > 60 * 1000) {
            logger.log("Cached but staled.");
            return from([cacheEntry.content]).pipe(
              tap(() => {
                this.tryScheduleBackgroundCacheRewnewTask(
                  context,
                  next
                ).subscribe();
              })
            );
          } else {
            logger.log("Cached and fresh");
            return from([cacheEntry.content]);
          }
        } else {
          // uncached
          logger.log("Uncached");
          return this.tryScheduleBackgroundCacheRewnewTask(context, next);
        }
      }),
      concatAll()
    );
  }
}
