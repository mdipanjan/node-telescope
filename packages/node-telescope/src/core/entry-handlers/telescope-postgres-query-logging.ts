import { PostgreSQLStorage } from '../../storage/pg/pg-storage';
import { Telescope } from '../telescope';
import { logQuery } from './telescope-query-logging';
import { Pool, QueryResult, QueryResultRow, QueryConfig } from 'pg';

export function setupPostgresQueryLogging(telescope: Telescope): void {
  console.log('Setting up PostgreSQL query logging');

  if (!isPostgreSQLStorage(telescope.storage)) {
    console.warn('PostgreSQL storage not available for query logging');
    return;
  }

  const pool = telescope.storage.getPool();
  console.log('Original pool:', pool);

  if (!pool || typeof pool.query !== 'function') {
    console.warn('PostgreSQL pool not properly initialized');
    return;
  }

  console.log('PostgreSQL pool properly initialized, setting up query logging');

  const originalQuery = pool.query.bind(pool);
  console.log('Original query method:', originalQuery);

  const interceptedQuery = function (
    this: Pool,
    queryTextOrConfig: string | QueryConfig<any[]>,
    values?: any[] | ((err: Error, result: QueryResult<QueryResultRow>) => void),
    callback?: (err: Error, result: QueryResult<QueryResultRow>) => void,
  ): Promise<QueryResult> | void {
    console.log('Intercepted query call with args:', queryTextOrConfig, values, callback);
    const startTime = Date.now();

    const queryResult = originalQuery.call(
      this,
      queryTextOrConfig as any,
      values as never,
      callback as never,
    );

    if (isPromise(queryResult)) {
      return queryResult
        .then(result => {
          console.log('Query result:', result);
          logQuery(telescope, startTime, [queryTextOrConfig, values], result);
          return result;
        })
        .catch((error: any) => {
          console.error('Error in query:', error);
          throw error;
        });
    } else {
      console.log('Query result is not a Promise:', queryResult);
      return queryResult;
    }
  };

  // Preserve the original method's properties
  Object.assign(interceptedQuery, originalQuery);

  // Type assertion to match the complex overloaded signature
  (pool as any).query = interceptedQuery as typeof pool.query;

  telescope.storage.setPool(pool);

  console.log('Intercepted pool:', pool);
  console.log('PostgreSQL query logging set up successfully');
}

function isPostgreSQLStorage(storage: unknown): storage is PostgreSQLStorage {
  return (
    typeof storage === 'object' && storage !== null && 'getPool' in storage && 'setPool' in storage
  );
}

function isPromise(value: unknown): value is Promise<any> {
  return value instanceof Promise;
}
