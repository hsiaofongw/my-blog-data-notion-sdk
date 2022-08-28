import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FeedController } from './feed/feed.controller';
import { FeedService } from './feed/feed.service';
import { IdIssuerMiddleware } from './id-issuer.middleware';
import { LoggerMiddleware } from './logger.middleware';
import { RedisCacheService } from './redis-cache/redis-cache.service';
import { HomeController } from './home/home.controller';
import { PostController } from './post/post.controller';
import { DigitImageController } from './digit-image/digit-image.controller';
import { DigitImageGenerateService } from './digit-image-generate/digit-image-generate.service';
import { DigitImageCounterController } from './digit-image-counter/digit-image-counter.controller';

@Module({
  imports: [],
  controllers: [FeedController, HomeController, PostController, DigitImageController, DigitImageCounterController],
  providers: [FeedService, RedisCacheService, DigitImageGenerateService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IdIssuerMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
