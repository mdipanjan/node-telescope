import { MySQLStorage } from '../../storage/mysql/mysql-storage';
import { Telescope } from '../telescope';
import { logQuery } from './telescope-query-logging';
import { Pool, QueryOptions, Query } from 'mysql2/promise';

export function setupMySQLQueryLogging(telescope: Telescope): void {
  console.log('Setting up MySQL query logging');

  if (!isMySQLStorage(telescope.storage)) {
    console.warn('MySQL storage not available for query logging');
    return;
  }

  const pool = telescope.storage.getPool();
  console.log('Original pool:', pool);

  if (!pool || typeof pool.query !== 'function') {
    console.warn('MySQL pool not properly initialized');
    return;
  }

  console.log('MySQL pool properly initialized, setting up query logging');

  const originalQuery = pool.query.bind(pool);
  console.log('Original query method:', originalQuery);

  const interceptedQuery = function (
    this: Pool,
    sql: string | QueryOptions,
    values?: any | any[] | { [param: string]: any },
    callback?: (err: Error | null, result: any, fields: any) => any,
  ): Promise<any> | Query {
    console.log('Intercepted query call with args:', sql, values, callback);
    const startTime = Date.now();

    const queryResult = originalQuery.call(this, sql, values, callback);

    if (isPromise(queryResult)) {
      return queryResult
        .then(result => {
          console.log('Query result:', result);
          logQuery(telescope, startTime, [sql, values], result);
          return result;
        })
        .catch((error: Error) => {
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
  (pool as Pool).query = interceptedQuery as typeof pool.query;

  telescope.storage.setPool(pool);

  console.log('Intercepted pool:', pool);
  console.log('MySQL query logging set up successfully');
}

function isMySQLStorage(storage: unknown): storage is MySQLStorage {
  return (
    typeof storage === 'object' && storage !== null && 'getPool' in storage && 'setPool' in storage
  );
}

function isPromise(value: unknown): value is Promise<any> {
  return value instanceof Promise;
}
