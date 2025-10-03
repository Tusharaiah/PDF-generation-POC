import type { NextFunction, Request, Response } from 'express';
import logger from '../config/logger.js';
import { HTTP_STATUS } from '../types/http.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error');
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
}


