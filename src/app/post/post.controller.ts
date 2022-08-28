import { Controller, Get, Header, UseInterceptors } from '@nestjs/common';
import { FeedService } from '../feed/feed.service';
import { StaleWhileRevalidateInterceptor } from '../stale-while-revalidate.interceptor';

@Controller('posts')
@UseInterceptors(StaleWhileRevalidateInterceptor)
export class PostController {
  constructor(private feedService: FeedService) { }

  @Get('index.xml')
  @Header('Content-Type', 'application/atom+xml; charset=utf-8')
  async getPostIndicesXML() {
    return await this.feedService.getAtomFeed();
  }
}
