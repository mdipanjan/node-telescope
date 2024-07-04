import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../storage/storage-interface';
import { logger } from '../utils/logger';
import { telescopeMiddleware } from '../middleware/telescope-middleware';
import cors from 'cors';
import { EntryType, EventTypes, ExceptionEntry, QueryEntry } from '../types';
import mongoose from 'mongoose';
import { MongoStorage } from '../storage/mongo-storage';
import { getRequestId } from '../utils/async-context';

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
    const { app, server } = this.options;
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
      const recentEntries = await this.storage.getEntries({
        page: 1,
        perPage: 50,
        sort: { timestamp: -1 },
        type: EntryType.REQUESTS,
      });
      socket.emit('initialEntries', recentEntries);
    } catch (error) {
      logger.error('Failed to send initial entries:', error);
    }
    this.storage.on(EventTypes.NEW_ENTRY, (entry: unknown) => {
      socket.emit(EventTypes.NEW_ENTRY, entry);
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
    if (
      this.options.enableQueryLogging &&
      this.options.watchedEntries.includes(EntryType.QUERIES)
    ) {
      const storage = this.storage as MongoStorage;
      const connection = storage.connection;

      if (connection) {
        const queryPlugin = (schema: mongoose.Schema) => {
          const methods = [
            'find',
            'findOne',
            'findOneAndUpdate',
            'updateOne',
            'updateMany',
            'deleteOne',
            'deleteMany',
            'aggregate',
            'insertMany',
            'create',
          ];

          methods.forEach(method => {
            //@ts-ignore
            schema.pre(method, function () {
              //@ts-ignore

              (this as any)._telescopeStartTime = Date.now();
            });
            //@ts-ignore

            schema.post(method, function (this: any, result) {
              const duration = Date.now() - (this._telescopeStartTime || Date.now());
              const requestId = getRequestId();
              const entry: QueryEntry = {
                type: EntryType.QUERIES,
                timestamp: new Date(this._telescopeStartTime),
                data: {
                  method,
                  query: JSON.stringify(this.getQuery ? this.getQuery() : this),
                  collection: this.model ? this.model.collection.name : this.collection.name,
                  duration,
                  result: result ? JSON.stringify(result).substring(0, 200) : undefined,
                  requestId: requestId,
                },
              };

              console.log('Query Logging:', entry);
              storage
                .storeEntry(entry as any)
                .then(() => console.log('Query entry stored successfully'))
                .catch(error => console.error('Failed to store query entry:', error));
            });
          });

          // Add logging for 'save' method
          schema.pre('save', function () {
            (this as any)._telescopeStartTime = Date.now();
          });

          schema.post('save', function (this: any) {
            const duration = Date.now() - (this._telescopeStartTime || Date.now());
            const requestId = getRequestId();
            const entry: QueryEntry = {
              type: EntryType.QUERIES,
              timestamp: new Date(this._telescopeStartTime),
              data: {
                method: 'save',
                query: JSON.stringify(this.toObject()),
                collection: this.constructor.collection.name,
                duration,
                result: JSON.stringify(this.toObject()).substring(0, 200),
                requestId: requestId,
              },
            };

            console.log('Query Logging (Save):', entry);
            storage
              .storeEntry(entry as any)
              .then(() => console.log('Save query entry stored successfully'))
              .catch(error => console.error('Failed to store save query entry:', error));
          });
        };

        // Apply the plugin to the connection
        connection.plugin(queryPlugin);

        console.log('Comprehensive query logging set up successfully');
      } else {
        console.warn('MongoDB connection not available for query logging');
      }
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
