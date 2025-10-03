import type { PaperFormat } from 'puppeteer';
export interface PdfMarginOptions {
  top?: string | undefined;
  right?: string | undefined;
  bottom?: string | undefined;
  left?: string | undefined;
}

export interface PdfRenderOptions {
  format?: PaperFormat | undefined;
  printBackground?: boolean | undefined;
  landscape?: boolean | undefined;
  margin?: PdfMarginOptions | undefined;
  scale?: number | undefined; // 0.1 - 2
  preferCSSPageSize?: boolean | undefined;
}

export type PdfInputKind = 'html' | 'url' | 'file-html';


