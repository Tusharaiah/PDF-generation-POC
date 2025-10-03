import type { Page } from 'puppeteer';

export interface ContentStrategy<T> {
  load(page: Page, input: T): Promise<void>;
}


