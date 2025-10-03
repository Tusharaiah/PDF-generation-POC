import { LRUCache } from 'lru-cache';
import { env } from '../../config/env.js';

export default class PdfCache {
  private cache: LRUCache<string, Buffer>;

  constructor() {
    this.cache = new LRUCache<string, Buffer>({
      max: env.cacheMaxEntries,
      ttl: env.cacheTtlMs,
      allowStale: false,
    });
  }

  get(key: string): Buffer | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: Buffer): void {
    this.cache.set(key, value);
  }
}


