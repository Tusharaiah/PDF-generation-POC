import { Router } from 'express';
import { HTTP_STATUS } from '../types/http.js';

const router = Router();

router.get('/live', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ok' });
});

router.get('/ready', (_req, res) => {
  res.status(HTTP_STATUS.OK).json({ status: 'ready' });
});

export default router;


