import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../storage/storage-interface';
import { logger } from '../utils/logger';
import { telescopeMiddleware } from '../middleware/telescope-middleware';

export interface TelescopeOptions {
  storage: StorageInterface;
  watchedEntries: string[];
  port: number;
  routePrefix: string;
}

export class Telescope {
  public options: TelescopeOptions;
  public storage: StorageInterface;
  private app: Express;
  private server: HttpServer;
  private io: SocketServer;
  constructor(options: TelescopeOptions) {
    this.options = {
      storage: options.storage!,
      watchedEntries: options.watchedEntries || ['requests', 'logs', 'errors'],
      port: options.port || 3000,
      routePrefix: options.routePrefix || '/telescope',
    };

    if (!this.options.storage) {
      throw new Error('Storage must be provided');
    }

    this.storage = this.options.storage;
    this.app = express();
    this.server = new HttpServer(this.app);
    this.io = new SocketServer(this.server);
  }

  private setupExpress(): void {
    this.app.use(this.options.routePrefix, express.static('public'));
    this.app.get(`${this.options.routePrefix}/api/entries`, this.getEntries.bind(this));
    this.app.get(`${this.options.routePrefix}/api/entries/:id`, this.getEntry.bind(this));
  }

  private setupSocketIO(): void {
    this.io.on('connection', this.handleSocketConnection.bind(this));
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

  public middleware(): express.RequestHandler {
    return telescopeMiddleware(this);
  }

  public async listen(port: number = this.options.port): Promise<void> {
    try {
      await this.storage.connect();
      this.server.listen(port, () => {
        logger.info(`Telescope is running on http://localhost:${port}${this.options.routePrefix}`);
      });
    } catch (error) {
      logger.error('Failed to start Telescope:', error);
    }
  }
}
