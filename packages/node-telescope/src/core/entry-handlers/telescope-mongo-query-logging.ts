import { Telescope } from '../telescope';
import { MongoStorage } from '../../storage/mongo/mongo-storage';
import { EntryType, QueryEntry } from '../../types';
import { getRequestId } from '../../utils/async-context';
import { MongoQueries } from '../../constants/constant';
import mongoose from 'mongoose';

export function setupMongoQueryLogging(telescope: Telescope): void {
  const storage = telescope.storage as MongoStorage;
  const connection = storage.connection;

  const queryResultSizeLimit = telescope.options.queryResultSizeLimit as number;
  if (connection) {
    const queryPlugin = (schema: mongoose.Schema) => {
      MongoQueries.forEach(method => {
        // Use type assertion here
        (schema as any).pre(method, function (this: any) {
          this._telescopeStartTime = Date.now();
        });

        // Use type assertion here as well
        (schema as any).post(method, function (this: any, result: any) {
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
              result: result
                ? JSON.stringify(result).substring(0, queryResultSizeLimit)
                : undefined,
              requestId: requestId,
            },
          };

          console.log('Query Logging:', entry);
          storage
            .storeEntry(entry)
            .then(() => console.log('Query entry stored successfully'))
            .catch(error => console.error('Failed to store query entry:', error));
        });
      });

      setupSaveLogging(schema, storage, queryResultSizeLimit);
    };

    connection.plugin(queryPlugin);
    console.log('MongoDB query logging set up successfully');
  } else {
    console.warn('MongoDB connection not available for query logging');
  }
}

function setupSaveLogging(
  schema: mongoose.Schema,
  storage: MongoStorage,
  queryResultSizeLimit: number,
): void {
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
        result: JSON.stringify(this.toObject()).substring(0, queryResultSizeLimit),
        requestId: requestId,
      },
    };

    console.log('Query Logging (Save):', entry);
    storage
      .storeEntry(entry)
      .then(() => console.log('Save query entry stored successfully'))
      .catch(error => console.error('Failed to store save query entry:', error));
  });
}
