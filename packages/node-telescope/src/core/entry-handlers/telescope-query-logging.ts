import { Telescope } from '../telescope';
import { EntryType, QueryEntry } from '../../types';
import { MongoStorage } from '../../storage/mongo/mongo-storage';
import { PostgreSQLStorage } from '../../storage/pg/pg-storage';
import { setupMongoQueryLogging } from './telescope-mongo-query-logging';
import { setupPostgresQueryLogging } from './telescope-postgres-query-logging';

export function setupQueryLogging(telescope: Telescope): void {
  if (
    telescope.options.enableQueryLogging &&
    telescope.options.watchedEntries.includes(EntryType.QUERIES)
  ) {
    if (telescope.storage instanceof MongoStorage) {
      setupMongoQueryLogging(telescope);
    } else if (telescope.storage instanceof PostgreSQLStorage) {
      setupPostgresQueryLogging(telescope);
    } else {
      console.warn('Unsupported storage type for query logging');
    }
  }
}

export function logQuery(telescope: Telescope, startTime: number, args: any[], result: any): void {
  const duration = Date.now() - startTime;
  const queryText = typeof args[0] === 'string' ? args[0] : args[0].text;
  const queryValues = args[1] || [];

  const entry: QueryEntry = {
    type: EntryType.QUERIES,
    timestamp: new Date(startTime),
    //@ts-ignore
    data: {
      method: 'query',
      query: JSON.stringify({ text: queryText, values: queryValues }),
      duration,
      result: JSON.stringify(result).substring(0, telescope.options.queryResultSizeLimit),
    },
  };

  console.log('Query Logging:', entry);
  telescope.storage
    .storeEntry(entry as any)
    .then(() => console.log('Query entry stored successfully'))
    .catch(error => console.error('Failed to store query entry:', error));
}
