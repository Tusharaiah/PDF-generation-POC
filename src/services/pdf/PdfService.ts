import PQueue from 'p-queue';
import browserManager from './BrowserManager.js';
import { HtmlContentStrategy } from './strategies/HtmlContentStrategy.js';
import { UrlContentStrategy } from './strategies/UrlContentStrategy.js';
import { FileContentStrategy } from './strategies/FileContentStrategy.js';
import PagePool from './PagePool.js';
// Removed caching to always generate fresh PDFs per request
import { env } from '../../config/env.js';
import type { PdfRenderOptions } from '../../types/pdf.js';
import type { PDFOptions, PDFMargin } from 'puppeteer';
import { hashPayload } from '../../utils/hash.js';
import metrics from '../../metrics/Metrics.js';

type Input =
  | { kind: 'html'; html: string }
  | { kind: 'url'; url: string }
  | { kind: 'file-html'; path: string };

export default class PdfService {
  private queue: PQueue;
  private pagePool: PagePool;

  constructor() {
    this.queue = new PQueue({ concurrency: env.queueConcurrency });
    this.pagePool = new PagePool();
  }

  async render(input: Input, options: PdfRenderOptions = {}): Promise<Buffer> {
    // No caching: always render fresh

    const job = async (): Promise<Buffer> => {
      const browser = await browserManager.getBrowser();
      const page = env.fastMode ? await this.pagePool.acquire() : await browser.newPage();
      try {
        if (env.fastMode) {
          await page.setCacheEnabled(true);
          await page.emulateMediaType('screen');
          // No request interception: render HTML as-is with all resources
        }

        if (input.kind === 'html') {
          await new HtmlContentStrategy().load(page, input.html);
        } else if (input.kind === 'url') {
          await new UrlContentStrategy().load(page, input.url);
        } else {
          await new FileContentStrategy().load(page, input.path);
        }

        const pdfOptions: PDFOptions = {
          printBackground: options.printBackground ?? true,
          landscape: options.landscape ?? false,
        };
        if (options.format !== undefined) {
          pdfOptions.format = options.format;
        }
        if (options.preferCSSPageSize !== undefined) {
          pdfOptions.preferCSSPageSize = options.preferCSSPageSize;
        }
        if (options.margin) {
          pdfOptions.margin = options.margin as unknown as PDFMargin;
        }
        if (options.scale !== undefined) {
          pdfOptions.scale = options.scale;
        }
        // Speed tweaks: disable JS for HTML/file to avoid extra work
        // Render as-is: allow JavaScript for all inputs
        await page.setJavaScriptEnabled(true);
        const pdfUint8 = await page.pdf(pdfOptions);

        const buffer = Buffer.from(pdfUint8);
        return buffer;
      } finally {
        try {
          if (env.fastMode) {
            await page.goto('about:blank', { waitUntil: 'domcontentloaded', timeout: 1000 }).catch(() => {});
            this.pagePool.release(page);
          } else {
            await page.close();
          }
        } catch {}
      }
    };

    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Render timed out')), ms);
        p.then((v) => {
          clearTimeout(timer);
          resolve(v);
        }).catch((e) => {
          clearTimeout(timer);
          reject(e);
        });
      });

    const task: () => Promise<Buffer> = async () => {
      const start = Date.now();
      let timedOut = false;
      try {
        const result = await withTimeout(job(), env.renderTimeoutMs).catch((err) => {
          if ((err as Error).message.includes('timed out')) timedOut = true;
          throw err;
        });
        metrics.record(Date.now() - start, true, timedOut);
        return result;
      } catch (e) {
        metrics.record(Date.now() - start, false, timedOut);
        throw e;
      }
    };
    return await this.queue.add(task, { throwOnTimeout: true });
  }
}


