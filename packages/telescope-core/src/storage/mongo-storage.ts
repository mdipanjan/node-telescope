import mongoose, { Schema, Document } from 'mongoose';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { StorageInterface, Entry, QueryOptions } from './storage-interface';
import { logger } from '../utils/logger';

// Define a type for the document in MongoDB
interface EntryDocument extends Omit<Entry, 'id'>, Document {
  _id: string;
}
const entrySchema = new Schema(
  {
    id: { type: String, default: uuidv4, unique: true },
    type: String,
    timestamp: Date,
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
  },
  {
    strict: false,
    _id: false, // Disable MongoDB's default _id
  },
);

export interface MongoStorageOptions {
  uri: string;
  dbName: string;
}

export class MongoStorage extends EventEmitter implements StorageInterface {
  private EntryModel: mongoose.Model<EntryDocument>;
  private options: MongoStorageOptions;

  constructor(options: MongoStorageOptions) {
    super();
    this.options = options;
    this.EntryModel = mongoose.model<EntryDocument>('Entry', entrySchema);
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

  async storeEntry(entry: Entry): Promise<string> {
    try {
      const entryId = entry.id || uuidv4();
      const newEntry = new this.EntryModel({ ...entry, _id: entryId });
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
      const { page = 1, perPage = 20, ...filters } = query;
      const skip = (page - 1) * perPage;

      const documents = await this.EntryModel.find(filters)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();

      const total = await this.EntryModel.countDocuments(filters);

      const entries: Entry[] = documents.map(doc => {
        const { _id, ...rest } = doc;
        return {
          id: _id as string,
          ...(rest as Omit<Entry, 'id'>),
        };
      });

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

  async getRecentEntries(limit: number): Promise<Entry[]> {
    try {
      return await this.EntryModel.find().sort({ timestamp: -1 }).limit(limit).lean();
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
