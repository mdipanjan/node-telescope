import { Telescope } from './src/core/telescope';
import { telescopeMiddleware } from './src/middleware/telescope-middleware';
import { StorageInterface } from './src/storage/storage-interface';
import { MongoStorage } from './src/storage/mongo-storage';
import { logger } from './src/utils/logger';
import { EntryType, TelescopeDatabaseType } from './src/types';
import { PostgreSQLStorage } from './src/storage/pg-storage';
// Re-export types
export type { TelescopeOptions } from './src/core/telescope';
export type { Request, Response } from 'express';

const telescope = {
  Telescope,
  telescopeMiddleware,
  MongoStorage,
  logger,
};

export default telescope;

export {
  Telescope,
  telescopeMiddleware,
  StorageInterface,
  MongoStorage,
  logger,
  EntryType,
  TelescopeDatabaseType,
  PostgreSQLStorage,
};

console.log('node-telescope module exports have been set up');
