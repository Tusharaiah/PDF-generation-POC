import dotenv from 'dotenv';

dotenv.config();

export interface AppEnvConfig {
  port: number;
  queueConcurrency: number;
  cacheMaxEntries: number;
  cacheTtlMs: number;
  puppeteerHeadless: boolean;
  renderTimeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  logLevel: string;
  fastMode: boolean;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env: AppEnvConfig = {
  port: parseNumber(process.env.PORT, 3000),
  queueConcurrency: parseNumber(process.env.QUEUE_CONCURRENCY, 4),
  cacheMaxEntries: parseNumber(process.env.CACHE_MAX_ENTRIES, 50),
  cacheTtlMs: parseNumber(process.env.CACHE_TTL_MS, 300000),
  puppeteerHeadless: (process.env.PUPPETEER_HEADLESS ?? 'true').toLowerCase() !== 'false',
  renderTimeoutMs: parseNumber(process.env.RENDER_TIMEOUT_MS, 30000),
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 60),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  fastMode: (process.env.FAST_MODE ?? 'true').toLowerCase() !== 'false',
};


