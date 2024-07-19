import express from 'express';
import path from 'path';
import fs from 'fs';

export function serveFrontend(app: express.Application, routePrefix: string) {
  const frontendPath = path.resolve(__dirname, '../../frontend');

  console.log(`[serveFrontend] Attempting to serve frontend from: ${frontendPath}`);
  console.log(`[serveFrontend] Route prefix: ${routePrefix}`);

  if (fs.existsSync(frontendPath)) {
    console.log(`[serveFrontend] Frontend directory exists. Setting up routes.`);

    // Serve static files
    app.use(`${routePrefix}`, express.static(frontendPath));

    app.get('/site.webmanifest', (_req, res) => {
      res.sendFile(path.join(frontendPath, 'site.webmanifest'));
    });
    // Serve index.html for all routes under the routePrefix
    app.get(`${routePrefix}/*`, (_req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.error(
      `[serveFrontend] Frontend build not found at ${frontendPath}. Dashboard will not be available.`,
    );
  }
}
