import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export type CacheEntry = { generatedAt: number, content: any };

@Injectable()
export class RedisCacheService {
  private redis = new Redis(
    parseInt(String(process.env.REDIS_PORT)),
    process.env.REDIS_HOSTNAME
  );

  setObject(key: string, value: CacheEntry): Promise<'OK'> {
    return this.redis.set(key, JSON.stringify(value));
  }

  async getObject(key: string): Promise<CacheEntry> {
    const value = await this.redis.get(key);
    if (value) {
      return JSON.parse(value);
    }
    return null;
  }
}
