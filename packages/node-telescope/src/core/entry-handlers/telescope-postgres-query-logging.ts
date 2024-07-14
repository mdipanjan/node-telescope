import { PostgreSQLStorage } from '../../storage/pg/pg-storage';
import { Telescope } from '../telescope';
import { logQuery } from './telescope-query-logging';

export function setupPostgresQueryLogging(telescope: Telescope): void {
  console.log('Setting up PostgreSQL query logging');
  if (!(telescope.storage instanceof PostgreSQLStorage)) {
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

  const originalQuery = pool.query;
  console.log('Original query method:', originalQuery);

  const interceptedQuery = (...args: any[]): any => {
    console.log('Intercepted query call with args:', args);
    const startTime = Date.now();
    //@ts-ignore

    const result = originalQuery.apply(pool, args);
    //@ts-ignore

    if (result instanceof Promise) {
      result
        .then((queryResult: any) => {
          console.log('Query result:', queryResult);
          logQuery(telescope, startTime, args, queryResult);
        })
        .catch((error: any) => {
          console.error('Error in query:', error);
        });
    } else {
      console.log('Query result is not a Promise:', result);
    }

    return result;
  };

  pool.query = interceptedQuery;
  telescope.storage.setPool(pool);

  console.log('Intercepted pool:', pool);
  console.log('PostgreSQL query logging set up successfully');
}
