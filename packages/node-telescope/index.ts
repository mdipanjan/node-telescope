import { Telescope } from './src/core/telescope';
import { telescopeMiddleware } from './src/middleware/telescope-middleware';
import { StorageInterface } from './src/storage/storage-interface';
import { MongoStorage } from './src/storage/mongo-storage';
import { logger } from './src/utils/logger';
import { EntryType } from './src/types';
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

export { Telescope, telescopeMiddleware, StorageInterface, MongoStorage, logger, EntryType };

console.log('node-telescope module exports have been set up');
