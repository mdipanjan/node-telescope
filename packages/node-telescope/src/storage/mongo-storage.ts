import mongoose, { Schema, Document } from 'mongoose';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { StorageInterface, QueryOptions } from './storage-interface';
import { logger } from '../utils/logger';
import { Entry, EntryType } from '../types';

const baseEntrySchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(EntryType),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    discriminatorKey: 'type',
    _id: false,
  },
);

const requestEntrySchema = new Schema({
  duration: Number,
  request: {
    method: String,
    url: String,
    headers: Object,
    body: Schema.Types.Mixed,
    ip: String,
  },
  response: {
    statusCode: Number,
    headers: Object,
    body: String,
  },
});

const exceptionEntrySchema = new Schema({
  exception: {
    message: { type: String, required: true },
    stack: String, // No longer required
    class: String,
  },
});

const queryEntrySchema = new Schema({
  connection: String,
  query: String,
  duration: Number,
  result: Schema.Types.Mixed,
});

export interface MongoStorageOptions {
  uri: string;
  dbName: string;
}

export class MongoStorage extends EventEmitter implements StorageInterface {
  private EntryModel: mongoose.Model<Entry & Document>;
  private options: MongoStorageOptions;

  constructor(options: MongoStorageOptions) {
    super();
    this.options = options;
    mongoose.connect(options.uri, { dbName: options.dbName });

    this.EntryModel = mongoose.model<Entry & Document>('Entry', baseEntrySchema);
    this.EntryModel.discriminator(EntryType.REQUESTS, requestEntrySchema);
    this.EntryModel.discriminator(EntryType.EXCEPTIONS, exceptionEntrySchema);
    this.EntryModel.discriminator(EntryType.QUERIES, queryEntrySchema);
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.options.uri, {
        dbName: this.options.dbName,
      });
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async storeEntry(entry: Omit<Entry, 'id'>): Promise<string> {
    // console.log('Storing entry of type:', entry.type);
    // console.log('Storing entry:', JSON.stringify(entry, null, 2));
    try {
      const newEntry = new this.EntryModel(entry);
      await newEntry.save();
      this.emit('newEntry', newEntry.toObject());
      return newEntry.id;
    } catch (error) {
      logger.error('Failed to store entry:', error);
      throw error;
    }
  }

  async getEntry(id: string): Promise<Entry | null> {
    try {
      return await this.EntryModel.findOne({ id }).lean();
    } catch (error) {
      logger.error('Failed to get entry:', error);
      throw error;
    }
  }

  async getEntries(query: QueryOptions): Promise<{ entries: Entry[]; pagination: unknown }> {
    try {
      const { page = 1, perPage = 20, type, ...filters } = query;
      const skip = (page - 1) * perPage;
      const findQuery = type ? { type, ...filters } : filters;
      const entries = await this.EntryModel.find(filters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();

      const total = await this.EntryModel.countDocuments(findQuery);

      return {
        entries,
        pagination: {
          total,
          perPage,
          currentPage: page,
          totalPages: Math.ceil(total / perPage),
        },
      };
    } catch (error) {
      logger.error('Failed to get entries:', error);
      throw error;
    }
  }

  async getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]> {
    try {
      const query = type ? { type } : {};
      return await this.EntryModel.find(query).sort({ timestamp: -1 }).limit(limit).lean();
    } catch (error) {
      logger.error('Failed to get recent entries:', error);
      throw error;
    }
  }

  async prune(maxAge: number): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      const result = await this.EntryModel.deleteMany({ timestamp: { $lt: cutoffDate } });
      logger.info(`Pruned ${result.deletedCount} entries`);
    } catch (error) {
      logger.error('Failed to prune entries:', error);
      throw error;
    }
  }
}
