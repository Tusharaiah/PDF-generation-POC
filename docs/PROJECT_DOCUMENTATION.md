## HTML → PDF Backend – Project Documentation

### Overview
This service converts HTML (string, URL, or uploaded file) into PDFs using Node.js, Express, TypeScript, and Puppeteer. It follows an MVC structure, exposes clear REST APIs, saves uploaded-file conversions, serves files publicly, and includes health checks and metrics.

### Tech Stack
- Node.js (ESM, NodeNext)
- Express (routing, middleware)
- TypeScript (strict)
- Puppeteer (Chromium-based PDF rendering)
- Zod (validation)
- Pino (structured logging)

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
    health.routes.ts
    metrics.routes.ts
  services/
    pdf/
      BrowserManager.ts
      PagePool.ts
      PdfService.ts
      strategies/
        ContentStrategy.ts
        HtmlContentStrategy.ts
        UrlContentStrategy.ts
        FileContentStrategy.ts
    cache/
      (unused – caching removed by design)
  templates/
    sample.html
  types/
    http.ts
    pdf.ts
  utils/
    hash.ts
  metrics/
    Metrics.ts
outputs/ (runtime)
uploads/ (runtime)
```

### Getting Started
1) Install and run
```bash
npm install
npm run build
npm start
# Server on http://localhost:3000
```

2) Environment (see `.env.example`)
- `PORT` (default 3000)
- `QUEUE_CONCURRENCY` (default 4)
- `RENDER_TIMEOUT_MS` (default 30000)
- `FAST_MODE` (default true)
- Other logging/limiter toggles in `.env.example`

### API Reference
Base path: `/api`

- POST `/api/pdf/html`
  - Headers: `Content-Type: application/json`
  - Body:
    ```json
    {
      "html": "<html>...</html>",
      "options": {
        "format": "A4",      // optional: A4, Letter, etc.
        "printBackground": true,
        "landscape": false,
        "margin": {"top":"10mm", "bottom":"10mm"},
        "scale": 1,
        "preferCSSPageSize": false
      }
    }
    ```
  - Response: `application/pdf` (bytes)

- POST `/api/pdf/url`
  - Headers: `Content-Type: application/json`
  - Body:
    ```json
    {
      "url": "https://example.com",
      "options": {"format":"A4","printBackground":true}
    }
    ```
  - Response: `application/pdf` (bytes)

- POST `/api/pdf/file`
  - Content-Type: `multipart/form-data`
  - Fields:
    - `file`: uploaded HTML file
    - `options` (optional): JSON string, e.g. `{"format":"A4","printBackground":true}`
  - Behavior: renders, saves to `outputs/`, responds with URL
  - Response (JSON):
    ```json
    { "url": "/files/<name>.pdf", "filename": "<name>.pdf" }
    ```

- GET `/files/<name>.pdf`
  - Serves saved PDFs from `outputs/`.

- Health & Metrics
  - GET `/api/health/live` → 200 OK
  - GET `/api/health/ready` → 200 OK
  - GET `/api/metrics` → runtime counters and latency percentiles

### How PDF Generation Works (MVC wiring)
- Controller `pdf.controller.ts` validates inputs and dispatches to `PdfService`.
- `PdfService` orchestrates Puppeteer via:
  - `BrowserManager` (singleton Chromium instance)
  - `PagePool` (reuses `Page` instances at the concurrency level)
  - Content strategies (HTML/URL/File) to load content into the page
  - PDF rendering via `page.pdf` with caller options

### Performance Optimizations (sub‑second follow-ups)
Goal: keep follow-up conversions under 1 second without altering content fidelity.

- Chromium lifecycle
  - Singleton browser process (no re-launch per request)
  - Tuned launch args: `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`
  - Warm-up render on startup to reduce cold-start latency

- Concurrency and reuse
  - P-Queue with configurable `QUEUE_CONCURRENCY`
  - `PagePool` pre-creates pages equal to concurrency; pages are acquired/released per request instead of closed
  - Recycle pages by navigating to `about:blank` between requests

- Loading strategy (full fidelity)
  - `waitUntil: 'domcontentloaded'` to avoid long `networkidle0` stalls
  - Explicit waits in page for assets: all images complete and `document.fonts` ready
  - JavaScript enabled for all inputs to render dynamic content
  - `printBackground` defaults to true for correct CSS background rendering

- Stability and timeouts
  - Per-request timeout guard (`RENDER_TIMEOUT_MS`) around rendering
  - Robust page cleanup and listener removal when reusing pages

Results (typical dev laptop): first conversion may be several seconds (Chromium warm-up), subsequent conversions are typically sub‑second depending on asset weight and network.

### Duplicate Instance Protection
On startup, the server probes `/api/health/live`. If another instance is already running on `PORT`, the process exits with a clear error (helpful in dev).

### Error Handling & Security
- Central error handler returns `500` and logs details
- Rate limiter and Helmet enabled by default
- Minimal HTML sanitization applied on raw HTML inputs

### Docker & Compose
- `Dockerfile` (multi-stage): installs dependencies, builds TypeScript, runs `dist/server.js`
- `docker-compose.yml`: maps `3000:3000`, sets env vars, persists `uploads/`

### Troubleshooting
- Port already in use: stop other instance or change `PORT`
- Render timeouts:
  - Increase `RENDER_TIMEOUT_MS`
  - Ensure external assets are reachable and not extremely heavy
  - Keep the service warm (avoid restarts)
- PDFs missing images in file uploads:
  - `FileContentStrategy` injects a `<base>` tag to resolve relative URLs; ensure referenced files are accessible

### Example cURL
Generate from HTML string and save:
```bash
curl -X POST http://localhost:3000/api/pdf/html \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<!doctype html><html><body><h1>Hello PDF</h1></body></html>",
    "options": { "format": "A4", "printBackground": true }
  }' \
  --output out_html.pdf
```

Upload HTML file, get URL:
```bash
curl -X POST http://localhost:3000/api/pdf/file \
  -F "file=@src/templates/sample.html" \
  -F "options={\"format\":\"A4\"}" \
  | jq .
```

### Notes on Keeping < 1s End-to-End
- Keep service warm; avoid restarts
- Use `QUEUE_CONCURRENCY` appropriate to CPU cores
- Prefer local/static or low-latency CDNs for heavy assets
- Optionally enable persistent Chromium cache (userDataDir) and pre-warm critical assets on startup


