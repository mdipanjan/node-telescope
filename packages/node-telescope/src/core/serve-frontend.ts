import express from 'express';
import path from 'path';
import fs from 'fs';

export function serveFrontend(app: express.Application, routePrefix: string) {
  const frontendPath = path.resolve(__dirname, '../../frontend');

  console.log(`Attempting to serve frontend from: ${frontendPath}`);

  if (fs.existsSync(frontendPath)) {
    console.log(`Frontend directory exists. Setting up routes.`);

    // Serve static files
    app.use(`${routePrefix}`, express.static(frontendPath));
    // Serve site.webmanifest
    app.get('/site.webmanifest', (_req, res) => {
      res.sendFile(path.join(frontendPath, 'site.webmanifest'));
    });
    // Serve index.html for all routes under /telescope
    app.get(`${routePrefix}/*`, (req, res) => {
      console.log(`Serving index.html for path: ${req.path}`);
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    console.error(`Frontend build not found at ${frontendPath}. Dashboard will not be available.`);
  }
}
