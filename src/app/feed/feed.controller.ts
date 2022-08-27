import { Controller, Get, Header } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private feedService: FeedService) { }

  @Get('atom')
  @Header('Content-Type', 'application/atom+xml; charset=utf-8')
  async findAll(): Promise<string> {
    return await this.feedService.getFeed();
  }
}
