import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FeedController } from './feed/feed.controller';
import { FeedService } from './feed/feed.service';
import { IdIssuerMiddleware } from './id-issuer.middleware';
import { LoggerMiddleware } from './logger.middleware';
import { RedisCacheService } from './redis-cache/redis-cache.service';
import { HomeController } from './home/home.controller';
import { PostController } from './post/post.controller';

@Module({
  imports: [],
  controllers: [FeedController, HomeController, PostController],
  providers: [FeedService, RedisCacheService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdIssuerMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
