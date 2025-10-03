import type { ContentStrategy } from './ContentStrategy.js';
import type { Page } from 'puppeteer';
import { env } from '../../../config/env.js';

export class UrlContentStrategy implements ContentStrategy<string> {
  async load(page: Page, url: string): Promise<void> {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: env.renderTimeoutMs });
  }
}


