import { Express } from 'express';
import { Server as HttpServer } from 'http';
import { StorageInterface } from '../storage/storage-interface';
import { TelescopeDatabaseType } from '../types';

export interface TelescopeOptions {
  storage: StorageInterface;
  watchedEntries: string[];
  // routePrefix?: string; // default: '/telescope' will make it dynamic later
  corsOptions?: Record<string, unknown>;
  app?: Express;
  server?: HttpServer;
  enableQueryLogging?: boolean;
  enableFileReading?: boolean;
  fileReadingEnvironments?: string[];
  includeCurlCommand?: boolean;
  recordMemoryUsage?: boolean;
  databaseType: TelescopeDatabaseType;
  responseBodySizeLimit?: number;
  queryResultSizeLimit?: number;
}
