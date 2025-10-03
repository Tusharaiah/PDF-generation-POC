import { Router } from 'express';
import metrics from '../metrics/Metrics.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(metrics.snapshot());
});

export default router;


