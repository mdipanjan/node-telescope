import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Telescope } from '../telescope';
import { TelescopeOptions } from '../telescope-options';
import { logger } from '../../utils/logger';

export function setupExpressMiddleware(app: Express, options: TelescopeOptions): void {
  app.use(cors(options.corsOptions));
  app.use(options.routePrefix, express.static('public'));
}

export function setupRoutes(app: Express, telescope: Telescope): void {
  app.get(`/telescope-config`, getRouteConfig(telescope));
  app.get(`${telescope.options.routePrefix}/api/entries`, getEntries(telescope));
  app.get(`${telescope.options.routePrefix}/api/entries/:id`, getEntry(telescope));
}

function getRouteConfig(telescope: Telescope) {
  return (_req: Request, res: Response): void => {
    res.json({ routePrefix: telescope.options.routePrefix });
  };
}

function getEntries(telescope: Telescope) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const entries = await telescope.storage.getEntries(req.query);
      res.json(entries);
    } catch (error) {
      logger.error('Failed to retrieve entries:', error);
      res.status(500).json({ error: 'Failed to retrieve entries' });
    }
  };
}

function getEntry(telescope: Telescope) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const entry = await telescope.storage.getEntry(req.params.id);
      if (entry) {
        res.json(entry);
      } else {
        res.status(404).json({ error: 'Entry not found' });
      }
    } catch (error) {
      logger.error('Failed to retrieve entry:', error);
      res.status(500).json({ error: 'Failed to retrieve entry' });
    }
  };
}
