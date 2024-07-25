import { Pool, PoolClient, PoolConfig } from 'pg';
import { AdvancedQueryOptions, StorageInterface } from '../storage-interface';
import { logger } from '../../utils/logger';
import {
  Entry,
  EntryType,
  EventTypes,
  ExceptionEntry,
  QueryEntry,
  RequestEntry,
} from '../../types';
import EventEmitter from 'events';
import { RequestStorage } from './request-storage-helper';
import { buildWhereClause, executeTransaction } from '../../utils/db-utils';
import { QueryStorage } from './query-storage-helper';
import { ExceptionStorage } from './exception-storage-helper';
import { createTablesQuery } from './create-table-helper';

export class PostgreSQLStorage extends EventEmitter implements StorageInterface {
  private pool: Pool;

  constructor(options: { connection: PoolConfig | Pool }) {
    super();
    this.pool =
      options.connection instanceof Pool ? options.connection : new Pool(options.connection);
  }

  async connect(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
      logger.info('Connected to PostgreSQL');
      await this.createTables();
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  setPool(pool: Pool): void {
    this.pool = pool;
    logger.info('Pool updated in PostgreSQLStorage');
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await executeTransaction(client, async c => {
        await c.query(createTablesQuery);
      });
    } finally {
      client.release();
    }
  }

  async storeEntry(entry: Omit<Entry, 'id'>): Promise<string> {
    const client: PoolClient = await this.pool.connect();
    try {
      const id = crypto.randomUUID();
      await executeTransaction(client, async c => {
        await c.query('INSERT INTO entries (id, type, timestamp) VALUES ($1, $2, $3)', [
          id,
          entry.type,
          entry.timestamp,
        ]);

        switch (entry.type) {
          case EntryType.REQUESTS:
            await RequestStorage.storeEntry(c, id, entry as RequestEntry);
            break;
          case EntryType.EXCEPTIONS:
            await ExceptionStorage.storeEntry(c, id, entry as ExceptionEntry);
            break;
          case EntryType.QUERIES:
            await QueryStorage.storeEntry(c, id, entry as QueryEntry);
            break;
        }
      });

      this.emit(EventTypes.NEW_ENTRY, { ...entry, id });
      return id;
    } catch (error) {
      logger.error('Failed to store entry:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getEntry(id: string): Promise<Entry | null> {
    const client = await this.pool.connect();
    try {
      const entryResult = await client.query('SELECT * FROM entries WHERE id = $1', [id]);
      if (entryResult.rows.length === 0) {
        return null;
      }

      const entry = entryResult.rows[0];
      let detailedEntry;

      switch (entry.type) {
        case EntryType.REQUESTS:
          detailedEntry = await RequestStorage.getEntry(client, id, entry);
          break;
        case EntryType.EXCEPTIONS:
          detailedEntry = await ExceptionStorage.getEntry(client, id, entry);
          break;
        case EntryType.QUERIES:
          detailedEntry = await QueryStorage.getEntry(client, id, entry);
          break;
      }

      return detailedEntry || entry;
    } catch (error) {
      logger.error('Failed to get entry:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getEntries(
    queryOptions: AdvancedQueryOptions,
  ): Promise<{ entries: Entry[]; pagination: unknown }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, perPage = 20, type, requestId } = queryOptions;
      const offset = (page - 1) * perPage;

      const queryParams: unknown[] = [];
      const whereConditions: string[] = [];

      if (type) {
        whereConditions.push('type = $' + (queryParams.length + 1));
        queryParams.push(type);
      }

      if (requestId) {
        whereConditions.push(
          'id IN (SELECT id FROM requests WHERE request_id = $' + (queryParams.length + 1) + ')',
        );
        queryParams.push(requestId);
      }

      const whereClause = buildWhereClause(whereConditions, queryParams);

      const query = `SELECT * FROM entries${whereClause} ORDER BY timestamp DESC LIMIT $${
        queryParams.length + 1
      } OFFSET $${queryParams.length + 2}`;
      queryParams.push(perPage, offset);

      const result = await client.query(query, queryParams);
      const entries = await Promise.all(result.rows.map(row => this.getEntry(row.id)));

      const countQuery = `SELECT COUNT(*) FROM entries${whereClause}`;
      const countResult = await client.query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      return {
        entries: entries.filter((entry): entry is Entry => entry !== null),
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
    } finally {
      client.release();
    }
  }

  async getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]> {
    try {
      const queryParams: unknown[] = [];
      let query = 'SELECT * FROM entries';

      if (type) {
        query += ' WHERE type = $1';
        queryParams.push(type);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${queryParams.length + 1}`;
      queryParams.push(limit);

      const result = await this.pool.query(query, queryParams);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get recent entries:', error);
      throw error;
    }
  }

  async prune(maxAge: number): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      const query = 'DELETE FROM entries WHERE timestamp < $1';
      await this.pool.query(query, [cutoffDate]);
    } catch (error) {
      logger.error('Failed to prune entries:', error);
      throw error;
    }
  }
}
