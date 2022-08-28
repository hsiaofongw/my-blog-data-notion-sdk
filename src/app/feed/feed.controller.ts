import { Controller, Get, Header, UseInterceptors } from '@nestjs/common';
import { StaleWhileRevalidateInterceptor } from '../stale-while-revalidate.interceptor';
import { FeedService } from './feed.service';

@Controller('feed')
@UseInterceptors(StaleWhileRevalidateInterceptor)
export class FeedController {
  constructor(private feedService: FeedService) { }

  @Get('atom')
  @Header('Content-Type', 'application/atom+xml; charset=utf-8')
  async findAll(): Promise<string> {
    return await this.feedService.getAtomFeed();
  }
}
