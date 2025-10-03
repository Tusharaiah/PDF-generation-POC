import pino, { type LoggerOptions } from 'pino';
import { env } from './env.js';

const isDev = process.env.NODE_ENV !== 'production';

const options: LoggerOptions = { level: env.logLevel };
if (isDev) {
  (options as any).transport = {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
  };
}

const logger = pino(options);

export default logger;


