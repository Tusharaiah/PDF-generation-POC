import { ContentStrategy } from './ContentStrategy.js';
import { Page } from 'puppeteer';
import fs from 'fs/promises';
import { sanitizeHtml } from '../../../utils/validators.js';
import { env } from '../../../config/env.js';
import path from 'path';

export class FileContentStrategy implements ContentStrategy<string> {
  async load(page: Page, filepath: string): Promise<void> {
    const html = await fs.readFile(filepath, 'utf-8');
    let safe = sanitizeHtml(html);
    // Inject <base> to make relative URLs (images, css) resolve relative to file location
    const baseHref = 'file://' + path.dirname(path.resolve(filepath)) + '/';
    if (safe.includes('<head')) {
      safe = safe.replace(/<head(.*?)>/i, (m) => `${m}<base href="${baseHref}">`);
    } else if (safe.includes('<html')) {
      safe = safe.replace(/<html(.*?)>/i, (m) => `${m}<head><base href="${baseHref}"></head>`);
    } else {
      safe = `<head><base href="${baseHref}"></head>` + safe;
    }
    await page.setContent(safe, { waitUntil: 'domcontentloaded', timeout: env.renderTimeoutMs });
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


