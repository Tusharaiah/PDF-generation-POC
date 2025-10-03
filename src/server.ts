import app from './app.js';
import { env } from './config/env.js';
import logger from './config/logger.js';
import browserManager from './services/pdf/BrowserManager.js';
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';

async function probeExistingInstance(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path: '/api/health/live',
        method: 'GET',
        timeout: 600,
      },
      (res) => {
        resolve(res.statusCode === 200);
        res.resume();
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function main(): Promise<void> {
  const alreadyRunning = await probeExistingInstance(env.port);
  if (alreadyRunning) {
    logger.error({ port: env.port }, 'Another instance is already running');
    process.exit(1);
    return;
  }

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Ensure outputs directory exists and serve statics
  const outputsDir = path.resolve(process.cwd(), 'outputs');
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }
  app.use('/files', express.static(outputsDir));

  const server = app.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port}`);
    // Warm-up render to reduce first-request latency
    (async () => {
      try {
        const { default: PdfService } = await import('./services/pdf/PdfService.js');
        const svc = new PdfService();
        await svc.render({ kind: 'html', html: '<html><body>ok</body></html>' }, { format: 'A4' }).catch(() => {});
      } catch {}
    })();
  });

  server.on('close', () => {
    logger.info('HTTP server closed');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err && err.code === 'EADDRINUSE') {
      logger.error({ port: env.port }, 'Port is in use. Another instance may be running.');
    } else {
      logger.error({ err }, 'HTTP server error');
    }
    process.exit(1);
  });

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const sig of signals) {
    process.on(sig, async () => {
      logger.info({ sig }, 'Shutting down...');
      server.close(async () => {
        await browserManager.close();
        process.exit(0);
      });
    });
  }

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection');
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();


