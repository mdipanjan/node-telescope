import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../storage/storage-interface';
import { logger } from '../utils/logger';
import { telescopeMiddleware } from '../middleware/telescope-middleware';
import cors from 'cors';

export interface TelescopeOptions {
  storage: StorageInterface;
  watchedEntries: string[];
  routePrefix: string;
  corsOptions?: Record<string, unknown>;
  app?: Express;
  server?: HttpServer;
}

export class Telescope {
  public options: TelescopeOptions;
  public storage: StorageInterface;
  private io: SocketServer | null = null;
  constructor(options: TelescopeOptions) {
    this.options = {
      storage: options.storage!,
      watchedEntries: options.watchedEntries || ['requests', 'logs', 'errors'],
      routePrefix: options.routePrefix || '/telescope',
      corsOptions: options.corsOptions || {},
      app: options.app,
      server: options.server,
    };

    if (!this.options.storage) {
      throw new Error('Storage must be provided');
    }

    if (!this.options.app || !this.options.server) {
      throw new Error('Express app and HTTP server must be provided');
    }

    this.storage = this.options.storage;
    this.setupWithExpress(this.options.app, this.options.server);
  }

  public setupWithExpress(app: Express, server: HttpServer): void {
    app.use(cors(this.options.corsOptions));
    app.use(this.options.routePrefix, express.static('public'));

    if (!this.io) {
      this.io = new SocketServer(server, {
        path: `${this.options.routePrefix}/socket.io`,
        cors: this.options.corsOptions,
      });

      this.setupSocketIO();
    }
    app.get(`${this.options.routePrefix}/api/entries`, this.getEntries.bind(this));
    app.get(`${this.options.routePrefix}/api/entries/:id`, this.getEntry.bind(this));
  }

  private setupSocketIO(): void {
    if (!this.io) return;
    this.io.on('connection', (socket: Socket) => {
      logger.info('New client connected to Telescope');
      this.handleSocketConnection(socket);
    });
  }

  private async handleSocketConnection(socket: Socket): Promise<void> {
    try {
      const recentEntries = await this.storage.getRecentEntries(100);
      socket.emit('initialEntries', recentEntries);
    } catch (error) {
      logger.error('Failed to send initial entries:', error);
    }
    this.storage.on('newEntry', (entry: unknown) => {
      socket.emit('newEntry', entry);
    });
  }

  private async getEntries(req: Request, res: Response): Promise<void> {
    try {
      const entries = await this.storage.getEntries(req.query);
      res.json(entries);
    } catch (error) {
      logger.error('Failed to retrieve entries:', error);
      res.status(500).json({ error: 'Failed to retrieve entries' });
    }
  }

  private async getEntry(req: Request, res: Response): Promise<void> {
    try {
      const entry = await this.storage.getEntry(req.params.id);
      if (entry) {
        res.json(entry);
      } else {
        res.status(404).json({ error: 'Entry not found' });
      }
    } catch (error) {
      logger.error('Failed to retrieve entry:', error);
      res.status(500).json({ error: 'Failed to retrieve entry' });
    }
  }

  public middleware(): express.RequestHandler {
    return telescopeMiddleware(this);
  }

  public async connect(): Promise<void> {
    try {
      await this.storage.connect();
      logger.info(`Telescope storage connected`);
    } catch (error) {
      logger.error('Failed to connect Telescope storage:', error);
    }
  }
}
