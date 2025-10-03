import express from 'express';
import helmet from 'helmet';
import routes from './routes/index.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import logger from './config/logger.js';

const app = express();

app.use(helmet());
// Simple request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info({ method: req.method, url: req.originalUrl, status: res.statusCode, durationMs }, 'HTTP');
  });
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve generated files
app.use('/files', express.static('outputs'));

app.use('/api', apiRateLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;


