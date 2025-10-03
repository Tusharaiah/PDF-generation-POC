## HTML to PDF Backend (Node.js + Express + TypeScript)

A production-ready, optimized backend service to generate PDFs from HTML or URLs. Built with Express, Puppeteer, and a clean MVC architecture. Includes a singleton Chromium browser, a concurrency queue, LRU caching, validation, and robust error handling.

### Features
- Singleton Puppeteer browser for performance
- Concurrency control with a queue
- LRU caching of recent render results
- Input validation (Zod) and basic HTML sanitization
- MVC structure with controllers, services, and routes
- Centralized logging and error handling
- Configurable via environment variables

### Requirements
- Node.js 18+

### Quick Start

```bash
npm install
npm run dev
# or build and run
npm run build && npm start
```

Server starts on http://localhost:3000 by default.

### API Endpoints

1) Generate PDF from raw HTML

```bash
curl -X POST http://localhost:3000/api/pdf/html \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<html><body><h1>Hello PDF</h1></body></html>",
    "options": { "format": "A4", "printBackground": true }
  }' \
  --output out_html.pdf
```

2) Generate PDF from URL

```bash
curl -X POST http://localhost:3000/api/pdf/url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": { "format": "A4", "printBackground": true }
  }' \
  --output out_url.pdf
```

3) Generate PDF from uploaded HTML file

```bash
curl -X POST http://localhost:3000/api/pdf/file \
  -F "file=@src/templates/sample.html" \
  -F "options={\"format\":\"A4\",\"printBackground\":true}" \
  --output out_file.pdf
```

Notes:
- The `options` field is optional for any endpoint. See `src/types/pdf.ts` for all supported fields.
- Responses are `application/pdf`; use `--output` to save to a file.

### Configuration
Copy `.env.example` to `.env` and adjust as needed.

```bash
cp .env.example .env
```

Key variables:
- `PORT`: Server port (default `3000`)
- `QUEUE_CONCURRENCY`: Max concurrent render jobs (default `4`)
- `CACHE_MAX_ENTRIES`: LRU cache size (default `50`)
- `CACHE_TTL_MS`: Cache TTL in ms (default `300000`)
- `PUPPETEER_HEADLESS`: `true|false` (default `true`)
- `RENDER_TIMEOUT_MS`: Per-job timeout in ms (default `30000`)

### Project Structure

```
src/
  app.ts
  server.ts
  config/
    env.ts
    logger.ts
  controllers/
    pdf.controller.ts
  middlewares/
    errorHandler.ts
    notFound.ts
    rateLimiter.ts
  routes/
    index.ts
    pdf.routes.ts
  services/
    pdf/
      BrowserManager.ts
      PdfService.ts
      strategies/
        ContentStrategy.ts
        HtmlContentStrategy.ts
        UrlContentStrategy.ts
        FileContentStrategy.ts
    cache/
      PdfCache.ts
  templates/
    sample.html
  types/
    pdf.ts
  utils/
    hash.ts
    validators.ts
```

### Optimization Notes
- A single browser instance is reused; pages are created per job
- Queue controls concurrency to prevent resource exhaustion
- LRU cache avoids re-rendering identical inputs within TTL
- Basic sanitization lowers risk from untrusted HTML

### Development
- `npm run dev` for autoreload (ts-node-dev)
- `npm run build` compiles to `dist/`
- `npm start` runs compiled server

### License
MIT


