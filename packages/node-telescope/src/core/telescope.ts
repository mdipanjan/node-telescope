import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../storage/storage-interface';
import { logger } from '../utils/logger';
import { telescopeMiddleware } from '../middleware/telescope-middleware';
import cors from 'cors';
import { EntryType, ExceptionEntry } from '../types';
import mongoose from 'mongoose';

export interface TelescopeOptions {
  storage: StorageInterface;
  watchedEntries: string[];
  routePrefix: string;
  corsOptions?: Record<string, unknown>;
  app?: Express;
  server?: HttpServer;
  enableQueryLogging?: boolean;
}

export class Telescope {
  public options: TelescopeOptions;
  public storage: StorageInterface;
  private io: SocketServer | null = null;
  constructor(options: TelescopeOptions) {
    this.options = {
      storage: options.storage!,
      watchedEntries: options.watchedEntries || [
        EntryType.REQUESTS,
        EntryType.EXCEPTIONS,
        EntryType.QUERIES,
      ],
      enableQueryLogging: options.enableQueryLogging ?? false,
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
    this.setupWithExpress();
    this.initialize();
  }

  public setupWithExpress(): void {
    const { app, server, routePrefix, corsOptions } = this.options;
    if (app && server) {
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

  private initialize(): void {
    if (this.options.enableQueryLogging) {
      this.setupQueryLogging();
    }

    // Setup other features based on watchedEntries
    if (this.options.watchedEntries.includes(EntryType.EXCEPTIONS)) {
      this.setupExceptionLogging();
    }

    // ... initialize other features.. Will update later
  }

  public logException(error: Error | unknown): void {
    if (this.options.watchedEntries.includes(EntryType.EXCEPTIONS)) {
      const entry: Omit<ExceptionEntry, 'id'> = {
        type: EntryType.EXCEPTIONS,
        timestamp: new Date(),
        exception: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          class: error instanceof Error ? error.constructor.name : 'UnknownError',
        },
      };

      console.log('Logging exception:', JSON.stringify(entry, null, 2));

      this.storage
        .storeEntry(entry)
        .then(() => console.log('Exception entry stored successfully'))
        .catch(storageError => {
          console.error('Failed to store exception entry:', storageError);
        });
    }
  }

  private setupQueryLogging(): void {
    if (this.options.watchedEntries.includes(EntryType.QUERIES)) {
      const telescopeInstance = this;
      mongoose.plugin(function (schema) {
        ['find', 'findOne', 'findOneAndUpdate', 'updateOne', 'deleteOne'].forEach(method => {
          // @ts-ignore: Adding custom property to the query
          schema.pre(method, function (this: mongoose.Query<any, any>) {
            const startTime = Date.now();
            // @ts-ignore: Adding custom property to the query
            this.queryStartTime = startTime;
          });
          // @ts-ignore: Adding custom property to the query
          schema.post(method, function (this: mongoose.Query<any, any>, result: any) {
            const endTime = Date.now();
            // @ts-ignore: Accessing custom property from the query
            const duration = endTime - (this.queryStartTime || endTime);

            const entry = {
              type: EntryType.QUERIES,
              timestamp: new Date(),
              data: {
                method,
                query: this.getQuery(),
                collection: this.model.collection.name,
                duration,
              },
            };
            telescopeInstance.storage.storeEntry(entry as any); // remove any type later
          });
        });
      });
    }
  }

  private setupExceptionLogging(): void {
    if (this.options.watchedEntries.includes(EntryType.EXCEPTIONS)) {
      process.on('uncaughtException', (error: Error) => {
        this.logException(error);
      });

      process.on('unhandledRejection', (reason: any) => {
        if (reason instanceof Error) {
          this.logException(reason);
        } else {
          this.logException(new Error(String(reason)));
        }
      });
    }
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