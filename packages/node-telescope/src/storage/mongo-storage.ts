import mongoose, { Schema, Document, Connection } from 'mongoose';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { StorageInterface, AdvancedQueryOptions } from './storage-interface';
import { logger } from '../utils/logger';
import { Entry, EntryType, EventTypes } from '../types';
import { FilterQuery } from 'mongoose';

const requestEntrySchema = new Schema({
  duration: Number,
  request: {
    method: String,
    url: String,
    headers: Object,
    body: Schema.Types.Mixed,
    ip: String,
    requestId: String,
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
  duration: Number,
  data: {
    method: String,
    query: String,
    collection: String,
    result: Schema.Types.Mixed,
    requestId: String,
  },
});

export interface MongoStorageOptions {
  connection: Connection;
  dbName: string;
}

export class MongoStorage extends EventEmitter implements StorageInterface {
  private EntryModel: mongoose.Model<Entry & Document>;
  public connection: Connection;

  constructor(options: MongoStorageOptions) {
    super();
    this.connection = options.connection;

    const baseEntrySchema = new Schema(
      {
        id: { type: String, default: uuidv4, unique: true },
        type: { type: String, enum: Object.values(EntryType), required: true },
        timestamp: { type: Date, default: Date.now, required: true },
      },
      { discriminatorKey: 'type', _id: false },
    );

    this.EntryModel = this.connection.model<Entry & Document>('Entry', baseEntrySchema);
    this.EntryModel.discriminator(EntryType.REQUESTS, requestEntrySchema);
    this.EntryModel.discriminator(EntryType.EXCEPTIONS, exceptionEntrySchema);
    this.EntryModel.discriminator(EntryType.QUERIES, queryEntrySchema);
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async storeEntry(entry: Omit<Entry, 'id'>): Promise<string> {
    try {
      const newEntry = new this.EntryModel(entry);
      await newEntry.save();
      this.emit(EventTypes.NEW_ENTRY, newEntry.toObject());
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

  async getEntries(
    queryOptions: AdvancedQueryOptions,
  ): Promise<{ entries: Entry[]; pagination: unknown }> {
    console.log('Received queryOptions:', queryOptions);
    try {
      const {
        page = 1,
        perPage = 20,
        type,
        requestId,
        startDate,
        endDate,
        sort = { timestamp: -1 },
        ...filters
      } = queryOptions;

      const skip = (page - 1) * perPage;
      let findQuery: FilterQuery<Entry> = { ...filters };

      if (type) {
        findQuery.type = Array.isArray(type) ? { $in: type } : type;
      }

      if (requestId) {
        findQuery.$or = [{ 'request.requestId': requestId }, { 'data.requestId': requestId }];
      }

      if (startDate || endDate) {
        findQuery.timestamp = {};
        if (startDate) findQuery.timestamp.$gte = new Date(startDate);
        if (endDate) findQuery.timestamp.$lte = new Date(endDate);
      }

      console.log('Constructed findQuery:', JSON.stringify(findQuery, null, 2));
      console.log('Sort order:', sort);

      const entries = await this.EntryModel.find(findQuery)
        .sort(sort)
        .skip(skip)
        .limit(perPage)
        .lean();

      console.log(`Found ${entries.length} entries`);

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
  // this could be used when user comes to request for recent entries
  async getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]> {
    try {
      const query = type ? { type } : { type: EntryType.REQUESTS };
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
