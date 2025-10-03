import { Router } from 'express';
import pdfRoutes from './pdf.routes.js';
import healthRoutes from './health.routes.js';
import metricsRoutes from './metrics.routes.js';

const router = Router();

router.use('/pdf', pdfRoutes);
router.use('/health', healthRoutes);
router.use('/metrics', metricsRoutes);

export default router;


