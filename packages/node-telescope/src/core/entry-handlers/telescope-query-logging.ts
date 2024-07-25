import { Telescope } from '../telescope';
import { EntryType, QueryEntry } from '../../types';
import { MongoStorage } from '../../storage/mongo/mongo-storage';
import { PostgreSQLStorage } from '../../storage/pg/pg-storage';
import { setupMongoQueryLogging } from './telescope-mongo-query-logging';
import { setupPostgresQueryLogging } from './telescope-postgres-query-logging';
import { getRequestId } from '../../utils/async-context';

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

export function logQuery(
  telescope: Telescope,
  startTime: number,
  args: any[],
  result: unknown,
): void {
  const duration = Date.now() - startTime;
  const queryText = typeof args[0] === 'string' ? args[0] : args[0].text;
  const queryValues = args[1] || [];

  // Attempt to determine the collection name
  let collection = 'unknown';
  if (telescope.storage instanceof MongoStorage) {
    // For MongoDB, try to extract collection name from the query
    const match = queryText.match(/db\.(\w+)/);
    collection = match ? match[1] : 'unknown';
  } else if (telescope.storage instanceof PostgreSQLStorage) {
    // For PostgreSQL, try to extract table name from the query
    const match = queryText.match(/FROM\s+(\w+)/i);
    collection = match ? match[1] : 'unknown';
  }

  const entry: QueryEntry = {
    type: EntryType.QUERIES,
    timestamp: new Date(startTime),
    data: {
      method: 'query',
      query: JSON.stringify({ text: queryText, values: queryValues }),
      collection,
      duration,
      result: JSON.stringify(result).substring(0, telescope.options.queryResultSizeLimit || 2000),
      requestId: getRequestId(),
    },
  };

  console.log('Query Logging:', entry);
  telescope.storage
    .storeEntry(entry)
    .then(() => console.log('Query entry stored successfully'))
    .catch(error => console.error('Failed to store query entry:', error));
}
