import type { Browser, Page } from 'puppeteer';
import browserManager from './BrowserManager.js';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

export default class PagePool {
  private pool: Page[] = [];
  private inUse: Set<Page> = new Set();
  private initializing: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.initializing) return this.initializing;
    if (this.pool.length > 0) return;
    this.initializing = (async () => {
      const browser: Browser = await browserManager.getBrowser();
      const targetSize = Math.max(1, env.queueConcurrency);
      for (let i = 0; i < targetSize; i++) {
        const page = await browser.newPage();
        this.pool.push(page);
      }
      logger.info({ pages: this.pool.length }, 'Page pool initialized');
    })().finally(() => {
      this.initializing = null;
    });
    return this.initializing;
  }

  async acquire(): Promise<Page> {
    await this.ensureInitialized();
    // Simple spin-wait with small delay; concurrency is bounded by queue
    while (true) {
      const page = this.pool.pop();
      if (page) {
        this.inUse.add(page);
        return page;
      }
      await new Promise((r) => setTimeout(r, 2));
    }
  }

  release(page: Page): void {
    if (this.inUse.has(page)) {
      this.inUse.delete(page);
      this.pool.push(page);
    }
  }
}


