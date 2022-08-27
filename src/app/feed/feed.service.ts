import { Injectable, Logger } from '@nestjs/common';
import { Client } from "@notionhq/client";
import { Feed } from 'feed';
import { parseISO } from 'date-fns';

@Injectable()
export class FeedService {
  private tickIdx = 0;
  private feeds: string = '';
  private readonly logger = new Logger(FeedService.name);

  constructor() { }

  private slowDown(ms: number): Promise<null> {
    return new Promise((resolve) => {
      this.logger.log(`Sleeping for ${ms} miliseconds...`);
      setTimeout(() => resolve(null), ms);
    });
  }

  private makeFeeds<T>(
    posts: Array<T>,
    getPostTitle: (_: T) => string,
    getPostId: (_: T) => string,
    getPostLink: (_: T) => string,
    getPostDescription: (_: T) => string,
    getPostDate: (_: T) => Date,
  ) {
  
    const fakeName = '探索子';  // fake means not real
    const title = `${fakeName}博客`;
    const name = title;
    const description = '';
    const homepage = 'https://exploro.one';
    const id = homepage;
    const link  = homepage;
    const favicon = "https://www.gravatar.com/avatar/dfa26ed25a72c40d602d33d854dd6f07?s=200";
    const copyright = '';
    const updated = new Date();
    const generator = '';
    const email = 'i@beyondstars.xyz';
  
    const feedLinks = {
      json: homepage + '/feed/json',
      atom: homepage + '/feed/atom',
    };
  
    const author = { name, email, link };
  
    let feed = new Feed({
        title, description, id, link, 
        favicon, copyright, updated, generator,
        feedLinks, author
    });
  
    posts.forEach(post => {
      const title = getPostTitle(post);
      const id = getPostId(post);
      const link = getPostLink(post);
      const description = getPostDescription(post);
      const date = getPostDate(post);
  
      feed.addItem({
        title, id, link, description, date
      });
    });
  
    feed.addCategory("Notes");
  
    return feed;
  }

  async getFeedsFromNotion() {
    const notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    const dbId = process.env.NOTION_DB_ID as string;

    const response = await notion.databases.query({
      database_id: dbId,
    });
    
    this.logger.log('Fetching...');
    let posts: Array<{ name: string, updated: Date, link: string }> = [];
    for (const page of response.results) {
      this.logger.log('Page:', page);
      const link = (page as any).url;
      this.logger.log(`Link: ${link}`);
      const properties = (page as any).properties as any;
      const NameObject: any = await notion.pages.properties.retrieve({ page_id: page.id, property_id: properties.Name.id });
      const name = NameObject.results[0].title.text.content;
      this.logger.log(`Name: ${name}`);
      await this.slowDown(400);
      const UpdatedObject: any = await notion.pages.properties.retrieve({ page_id: page.id, property_id: properties.Updated.id });
      const updated = parseISO(UpdatedObject.last_edited_time);
      this.logger.log(`Updated: ${updated}`);
      await this.slowDown(400);
      const PublishToRssObject: any = await notion.pages.properties.retrieve({ page_id: page.id, property_id: properties.PublishToRss.id });
      const publishToRss = PublishToRssObject.select.name === 'Yes';

      if (publishToRss) {
        posts.push({ name, updated, link });
      }
    }

    return this.makeFeeds(
      posts, 
      (p) => p.name, 
      (p) => p.name+p.updated.toISOString(),
      (p) => p.link,
      (_) => '',
      (p) => p.updated,
    );
  }

  async getFeed() {
    const now = new Date();
    const tickIdx = Math.floor(now.valueOf() / (12 * 60 * 60 * 1000));

    this.logger.log('Enter getFeed()');
    this.logger.log('Last tickIdx: ' + String(this.tickIdx));
    this.logger.log('Current tickIdx: ' + String(tickIdx));

    if (tickIdx === this.tickIdx) {
      this.logger.log('Cache hit.');
      return this.feeds;
    }

    this.logger.log('Cache missed.');

    const feed = await this.getFeedsFromNotion();
    this.feeds = feed.atom1();
    this.tickIdx = tickIdx;
    return this.feeds;
  }
}
