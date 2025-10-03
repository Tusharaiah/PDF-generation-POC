import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../types/http.js';

export function notFound(_req: Request, res: Response) {
  res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not Found' });
}


