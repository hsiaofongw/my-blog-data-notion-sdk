import { Module } from '@nestjs/common';
import { FeedController } from './feed/feed.controller';
import { FeedService } from './feed/feed.service';

@Module({
  imports: [],
  controllers: [FeedController],
  providers: [FeedService],
})
export class AppModule {}
