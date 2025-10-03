import type { ContentStrategy } from './ContentStrategy.js';
import type { Page } from 'puppeteer';
import { env } from '../../../config/env.js';
import { sanitizeHtml } from '../../../utils/validators.js';

export class HtmlContentStrategy implements ContentStrategy<string> {
  async load(page: Page, html: string): Promise<void> {
    const safe = sanitizeHtml(html);
    await page.setContent(safe, { waitUntil: 'domcontentloaded', timeout: env.renderTimeoutMs });
    // Wait for images and fonts without relying on DOM typings
    await page.waitForFunction(
      'Array.from(document.images).every(img => img.complete)',
      { timeout: env.renderTimeoutMs }
    );
    await page.waitForFunction(
      'document.fonts ? document.fonts.status === "loaded" : true',
      { timeout: env.renderTimeoutMs }
    );
  }
}


