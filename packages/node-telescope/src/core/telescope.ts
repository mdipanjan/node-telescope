import express, { Express, Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { StorageInterface } from '../storage/storage-interface';
import { logger } from '../utils/logger';
import { telescopeMiddleware } from '../middleware/telescope-middleware';
import cors from 'cors';
import { EntryType, EventTypes, ExceptionEntry, QueryEntry, TelescopeDatabaseType } from '../types';
import mongoose from 'mongoose';
import { MongoStorage } from '../storage/mongo-storage';
import { getRequestId } from '../utils/async-context';
import * as fs from 'fs';
import { sanitizeCodeSnippet } from '../utils/utility';
import { MongoQueries } from '../constants/constant';
import { PostgreSQLStorage } from '../storage/pg-storage';

export interface TelescopeOptions {
  storage: StorageInterface;
  watchedEntries: string[];
  routePrefix: string;
  corsOptions?: Record<string, unknown>;
  app?: Express;
  server?: HttpServer;
  enableQueryLogging?: boolean;
  enableFileReading?: boolean;
  fileReadingEnvironments?: string[];
  includeCurlCommand?: boolean;
  recordMemoryUsage?: boolean;
  databaseType: TelescopeDatabaseType;
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
      enableFileReading: options.enableFileReading ?? false,
      fileReadingEnvironments: options.fileReadingEnvironments ?? ['development'],
      includeCurlCommand: options.includeCurlCommand ?? false,
      recordMemoryUsage: options.recordMemoryUsage ?? false,
      databaseType: options.databaseType,
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
      // To get the route config on the frontend
      app.get(`/telescope-config`, this.geRouteConfig.bind(this));
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
    console.log('New socket connection established');

    const sendInitialEntries = async (params: {
      type: EntryType;
      page: number;
      perPage: number;
    }) => {
      console.log(`Fetching initial entries with params:`, params);
      try {
        const recentEntries = await this.storage.getEntries({
          page: params.page,
          perPage: params.perPage,
          sort: { timestamp: -1 },
          type: params.type,
        });
        console.log(`Sending ${recentEntries.entries.length} initial entries`);
        socket.emit(EventTypes.INITIAL_ENTRIES, recentEntries);
      } catch (error) {
        console.error('Failed to send initial entries:', error);
        socket.emit('error', { message: 'Failed to fetch initial entries' });
      }
    };

    socket.on(
      EventTypes.GET_INITIAL_ENTRIES,
      (params: { type: EntryType; page: number; perPage: number }) => {
        console.log(`Received request for initial entries:`, params);
        sendInitialEntries(params);
      },
    );

    this.storage.on(EventTypes.NEW_ENTRY, (entry: unknown) => {
      console.log('New entry detected, emitting to client');
      socket.emit(EventTypes.NEW_ENTRY, entry);
    });

    socket.on(EventTypes.GET_ENTRY_DETAILS, async ({ id }: { id: string }) => {
      try {
        const entry = await this.storage.getEntry(id);
        if (entry) {
          socket.emit(EventTypes.ENTRY_DETAILS, entry);
        } else {
          socket.emit('error', { message: 'Entry not found' });
        }
      } catch (error) {
        logger.error('Failed to fetch entry details:', error);
        socket.emit('error', { message: 'Failed to fetch entry details' });
      }
    });
  }

  private initialize(): void {
    if (this.options.databaseType === TelescopeDatabaseType.POSTGRES) {
      this.connect();
      logger.info('Telescope storage connected and initialized');
    }

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
      let errorInfo: {
        message: string;
        stack?: string;
        class: string;
        file?: string;
        line?: number;
        context?: { [key: string]: string };
      };

      if (error instanceof Error) {
        const stackLines = error.stack?.split('\n') || [];
        const errorLine = stackLines[1] || '';
        const match = errorLine.match(/\((.+):(\d+):(\d+)\)$/);

        errorInfo = {
          message: error.message,
          stack: error.stack,
          class: error.constructor.name,
          file: match ? this.sanitizeFilePath(match[1]) : undefined,
          line: match ? parseInt(match[2], 10) : undefined,
        };
        if (this.shouldReadFile()) {
          errorInfo.context = this.getFileContext(
            match ? match[1] : undefined,
            match ? parseInt(match[2], 10) : undefined,
          );
        }
      } else {
        errorInfo = {
          message: String(error),
          class: 'UnknownError',
        };
      }
      const entry: Omit<ExceptionEntry, 'id'> = {
        type: EntryType.EXCEPTIONS,
        timestamp: new Date(),
        exception: errorInfo,
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

  private shouldReadFile(): boolean | undefined {
    return (
      this.options.enableFileReading &&
      this.options.fileReadingEnvironments &&
      this.options.fileReadingEnvironments.includes(process.env.NODE_ENV || 'development')
    );
  }

  private sanitizeFilePath(filePath: string): string {
    // Remove sensitive parts of the file path
    const projectRoot = process.cwd();
    return filePath.replace(projectRoot, '[PROJECT_ROOT]');
  }

  private getFileContext(
    filePath?: string,
    lineNumber?: number,
  ): { [key: string]: string } | undefined {
    if (!this.shouldReadFile() || !filePath || !lineNumber) return undefined;

    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      const start = Math.max(0, lineNumber - 3);
      const end = Math.min(lines.length, lineNumber + 2);
      const context: { [key: string]: string } = {};

      for (let i = start; i < end; i++) {
        context[`${i + 1}`] = sanitizeCodeSnippet(lines[i]);
      }

      return context;
    } catch (error) {
      console.error('Failed to read file for context:', error);
      return undefined;
    }
  }
  private setupQueryLogging(): void {
    if (
      this.options.enableQueryLogging &&
      this.options.watchedEntries.includes(EntryType.QUERIES)
    ) {
      if (this.storage instanceof MongoStorage) {
        this.setupMongoQueryLogging();
      } else if (this.storage instanceof PostgreSQLStorage) {
        this.setupPostgresQueryLogging();
      } else {
        console.warn('Unsupported storage type for query logging');
      }
    }
  }

  private setupMongoQueryLogging(): void {
    const storage = this.storage as MongoStorage;
    const connection = storage.connection;

    if (connection) {
      const queryPlugin = (schema: mongoose.Schema) => {
        MongoQueries.forEach(method => {
          //@ts-ignore
          schema.pre(method, function (this: any) {
            this._telescopeStartTime = Date.now();
          });
          //@ts-ignore

          schema.post(method, function (this: any, result: any) {
            const duration = Date.now() - (this._telescopeStartTime || Date.now());
            const requestId = getRequestId();
            const entry: QueryEntry = {
              type: EntryType.QUERIES,
              timestamp: new Date(this._telescopeStartTime),
              data: {
                method,
                query: JSON.stringify(this.getQuery ? this.getQuery() : this),
                collection: this.model?.collection?.name || this.collection?.name || 'unknown',
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

        // Handling 'save' method separately as it's a document method, not a query method
        schema.pre('save', function (this: mongoose.Document) {
          (this as any)._telescopeStartTime = Date.now();
        });

        schema.post('save', function (this: mongoose.Document) {
          const duration = Date.now() - ((this as any)._telescopeStartTime || Date.now());
          const requestId = getRequestId();
          const entry: QueryEntry = {
            type: EntryType.QUERIES,
            timestamp: new Date((this as any)._telescopeStartTime),
            data: {
              method: 'save',
              query: JSON.stringify(this.toObject()),
              collection: (this.constructor as any).collection.name,
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

      connection.plugin(queryPlugin);
      console.log('MongoDB query logging set up successfully');
    } else {
      console.warn('MongoDB connection not available for query logging');
    }
  }

  private setupPostgresQueryLogging(): void {
    if (!(this.storage instanceof PostgreSQLStorage)) {
      console.warn('PostgreSQL storage not available for query logging');
      return;
    }

    const pool = this.storage.getPool();

    if (!pool) {
      console.warn('PostgreSQL pool not available for query logging');
      return;
    }

    if (!pool || typeof pool.query !== 'function') {
      console.warn('PostgreSQL pool not properly initialized');
      return;
    }
    console.log('PostgreSQL pool properly initialized, setting up query logging');

    const originalQuery = pool.query;
    pool.query = (...args: any[]): any => {
      console.log('-==========================???pool???=========', pool);

      const startTime = Date.now();
      //@ts-ignore
      const result = originalQuery.apply(pool, args);
      //@ts-ignore

      if (result instanceof Promise) {
        console.log('-==========================result=========', result);

        result
          .then((queryResult: any) => {
            //@ts-ignore
            this.logQuery(startTime, args, queryResult);
            console.log('-==========================queryResult=========', queryResult);
          })
          .catch((error: any) => {
            console.error('Error in query:', error);
          });
      }

      return result;
    };

    console.log('PostgreSQL query logging set up successfully');
  }

  private logQuery(startTime: number, args: any[], result: any): void {
    console.log('-===================================', startTime);

    const duration = Date.now() - startTime;
    const queryText = typeof args[0] === 'string' ? args[0] : args[0].text;
    const queryValues = args[1] || [];

    const entry = {
      type: 'queries',
      timestamp: new Date(startTime),
      data: {
        method: 'query',
        query: JSON.stringify({ text: queryText, values: queryValues }),
        duration,
        result: JSON.stringify(result).substring(0, 200),
      },
    };
    console.log('-==========================entry=========', entry);

    console.log('Query Logging:', entry);
    this.storage
      .storeEntry(entry as any)
      .then(() => console.log('Query entry stored successfully'))
      .catch(error => console.error('Failed to store query entry:', error));
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

  private async geRouteConfig(_req: Request, res: Response): Promise<void> {
    res.json({
      routePrefix: this.options.routePrefix,
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
