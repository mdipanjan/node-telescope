import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { StorageInterface } from '../storage/storage-interface';
import { logger } from '../utils/logger';
import { telescopeMiddleware } from '../middleware/telescope-middleware';
import { EntryType, TelescopeDatabaseType } from '../types';
import { TelescopeOptions } from './telescope-options';
import { setupSocketIO } from './base/telescope-socket-setup';
import { setupExpressMiddleware, setupRoutes } from './base/telescope-express-setup';
import { logException, setupExceptionLogging } from './entry-handlers/telescope-exception-handling';
import express from 'express';
import { setupQueryLogging } from './entry-handlers/telescope-query-logging';
import { serveFrontend } from './serve-frontend';

export class Telescope {
  public options: TelescopeOptions;
  public storage: StorageInterface;
  private io: SocketServer | null = null;

  constructor(options: TelescopeOptions) {
    this.options = this.initializeOptions(options);
    this.validateOptions();
    this.storage = options.storage;
    this.setupWithExpress();
    this.initialize();
  }

  private initializeOptions(options: TelescopeOptions): TelescopeOptions {
    return {
      ...options,
      watchedEntries: options.watchedEntries || [
        EntryType.REQUESTS,
        EntryType.EXCEPTIONS,
        EntryType.QUERIES,
      ],
      enableQueryLogging: options.enableQueryLogging ?? false,
      routePrefix: options.routePrefix || '/telescope',
      corsOptions: options.corsOptions || {},
      enableFileReading: options.enableFileReading ?? false,
      fileReadingEnvironments: options.fileReadingEnvironments ?? ['development'],
      includeCurlCommand: options.includeCurlCommand ?? false,
      recordMemoryUsage: options.recordMemoryUsage ?? false,
      responseBodySizeLimit: options.responseBodySizeLimit || 2000,
      queryResultSizeLimit: options.queryResultSizeLimit || 2000,
    };
  }

  private validateOptions(): void {
    if (!this.options.storage) {
      throw new Error('Storage must be provided');
    }
    if (!this.options.app || !this.options.server) {
      throw new Error('Express app and HTTP server must be provided');
    }
  }

  public setupWithExpress(): void {
    const { app, server } = this.options;
    if (app && server) {
      setupExpressMiddleware(app, this.options);
      setupRoutes(app, this);
      this.setupSocketServer(server);
      serveFrontend(app, this.options.routePrefix);
    }
  }

  private setupSocketServer(server: HttpServer): void {
    if (!this.io) {
      this.io = new SocketServer(server, {
        path: `${this.options.routePrefix}/socket.io`,
        cors: this.options.corsOptions,
      });
      setupSocketIO(this.io, this.storage);
    }
  }

  private initialize(): void {
    if (this.options.databaseType === TelescopeDatabaseType.POSTGRES) {
      this.connect();
    }
    if (this.options.enableQueryLogging) {
      setupQueryLogging(this);
    }
    if (this.options.watchedEntries.includes(EntryType.EXCEPTIONS)) {
      setupExceptionLogging(this);
    }
  }

  public logException(error: Error | unknown): void {
    logException(this, error);
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
