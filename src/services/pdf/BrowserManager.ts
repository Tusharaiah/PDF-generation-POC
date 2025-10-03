import puppeteer, { Browser } from 'puppeteer';
import { env } from '../../config/env.js';
import logger from '../../config/logger.js';

class BrowserManager {
  private browser: Browser | null = null;
  private initializing: Promise<Browser> | null = null;

  async getBrowser(): Promise<Browser> {
    if (this.browser) return this.browser;
    if (this.initializing) return this.initializing;

    this.initializing = puppeteer
      .launch({
        headless: env.puppeteerHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      })
      .then(async (b) => {
        this.browser = b;
        logger.info('Puppeteer browser launched');
        if (env.fastMode) {
          // Pre-warm a page to reduce first-render latency
          const p = await b.newPage();
          await p.close();
        }
        return b;
      })
      .finally(() => {
        this.initializing = null;
      });

    return this.initializing;
  }

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        logger.info('Puppeteer browser closed');
      } catch (err) {
        logger.error({ err }, 'Error closing browser');
      } finally {
        this.browser = null;
      }
    }
  }
}

const browserManager = new BrowserManager();
export default browserManager;


