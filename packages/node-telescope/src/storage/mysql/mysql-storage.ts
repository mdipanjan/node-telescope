import { Pool, PoolConnection, RowDataPacket, createPool } from 'mysql2/promise';
import { PoolOptions } from 'mysql2/promise';
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
import { RequestStorage } from './mysql-request-storage-helper';
import { QueryStorage } from './mysql-query-storage-helper';
import { ExceptionStorage } from './mysql-exception-storage-helper';
import { createTablesQuery } from './create-table-helper';
import { buildMySQLWhereClause, executeMySQLTransaction } from '../../utils/db-mysql-utils';

export class MySQLStorage extends EventEmitter implements StorageInterface {
  private pool: Pool;

  constructor(options: { connection: PoolOptions | Pool }) {
    super();
    if (this.isPool(options.connection)) {
      this.pool = options.connection;
    } else {
      this.pool = createPool(options.connection);
    }
  }

  private isPool(connection: PoolOptions | Pool): connection is Pool {
    return (connection as Pool).getConnection !== undefined;
  }

  async connect(): Promise<void> {
    try {
      logger.info('Attempting to connect to MySQL...');
      await this.pool.query('SELECT 1');
      logger.info('Connected to MySQL successfully');

      logger.info('Attempting to create tables...');
      await this.createTables();
      logger.info('Tables created successfully');
    } catch (error) {
      logger.error('Failed during MySQL connection or table creation:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await executeMySQLTransaction(connection, async conn => {
        const queries = createTablesQuery.split(';').filter(query => query.trim() !== '');
        for (const query of queries) {
          logger.info(`Executing query: ${query}`);
          await conn.query(query);
          logger.info('Query executed successfully');
        }
      });
    } catch (error) {
      logger.error('Failed to create tables:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async storeEntry(entry: Omit<Entry, 'id'>): Promise<string> {
    const connection: PoolConnection = await this.pool.getConnection();
    try {
      const id = crypto.randomUUID();
      await executeMySQLTransaction(connection, async conn => {
        await conn.query('INSERT INTO entries (id, type, timestamp) VALUES (?, ?, ?)', [
          id,
          entry.type,
          entry.timestamp,
        ]);

        switch (entry.type) {
          case EntryType.REQUESTS:
            await RequestStorage.storeEntry(conn, id, entry as RequestEntry);
            break;
          case EntryType.EXCEPTIONS:
            await ExceptionStorage.storeEntry(conn, id, entry as ExceptionEntry);
            break;
          case EntryType.QUERIES:
            await QueryStorage.storeEntry(conn, id, entry as QueryEntry);
            break;
        }
      });

      this.emit(EventTypes.NEW_ENTRY, { ...entry, id });
      return id;
    } catch (error) {
      logger.error('Failed to store entry:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getEntry(id: string): Promise<Entry | null> {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM entries WHERE id = ?', [
        id,
      ]);
      if (rows.length === 0) {
        return null;
      }

      const entry = rows[0] as Entry;
      let detailedEntry: Entry | null = null;

      try {
        switch (entry.type) {
          case EntryType.REQUESTS:
            detailedEntry = await RequestStorage.getEntry(connection, id, entry as RequestEntry);
            break;
          case EntryType.EXCEPTIONS:
            detailedEntry = await ExceptionStorage.getEntry(
              connection,
              id,
              entry as ExceptionEntry,
            );
            break;
          case EntryType.QUERIES:
            detailedEntry = await QueryStorage.getEntry(connection, id, entry as QueryEntry);
            break;
        }
      } catch (error) {
        logger.error(`Failed to get detailed entry for id ${id}:`, error);
        return entry; // Return basic entry if detailed retrieval fails
      }

      return detailedEntry || entry;
    } catch (error) {
      logger.error('Failed to get entry:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async getEntries(
    queryOptions: AdvancedQueryOptions,
  ): Promise<{ entries: Entry[]; pagination: unknown }> {
    const connection = await this.pool.getConnection();
    try {
      const { page = 1, perPage = 20, type, requestId } = queryOptions;
      const offset = (page - 1) * perPage;

      const queryParams: unknown[] = [];
      const whereConditions: string[] = [];

      if (type) {
        whereConditions.push('type = ?');
        queryParams.push(type);
      }

      if (requestId) {
        whereConditions.push('id IN (SELECT id FROM requests WHERE request_id = ?)');
        queryParams.push(requestId);
      }

      const whereClause = buildMySQLWhereClause(whereConditions, queryParams);

      const query = `SELECT * FROM entries${whereClause} ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
      queryParams.push(perPage, offset);

      const [rows] = await connection.query<RowDataPacket[]>(query, queryParams);
      const entries = await Promise.all(
        rows.map(async row => {
          try {
            const entry = await this.getEntry(row.id);
            return entry || (row as Entry);
          } catch (error) {
            logger.error(`Failed to get detailed entry for id ${row.id}:`, error);
            return row as Entry;
          }
        }),
      );

      const countQuery = `SELECT COUNT(*) as count FROM entries${whereClause}`;
      const [countResult] = await connection.query<RowDataPacket[]>(
        countQuery,
        queryParams.slice(0, -2),
      );
      const total = (countResult[0] as RowDataPacket).count as number;

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
      connection.release();
    }
  }

  async getRecentEntries(limit: number, type?: EntryType): Promise<Entry[]> {
    try {
      const queryParams: unknown[] = [];
      let query = 'SELECT * FROM entries';

      if (type) {
        query += ' WHERE type = ?';
        queryParams.push(type);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      queryParams.push(limit);

      const [rows] = await this.pool.query<RowDataPacket[]>(query, queryParams);
      return rows as Entry[];
    } catch (error) {
      logger.error('Failed to get recent entries:', error);
      throw error;
    }
  }

  async prune(maxAge: number): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge);
      const query = 'DELETE FROM entries WHERE timestamp < ?';
      await this.pool.query(query, [cutoffDate]);
    } catch (error) {
      logger.error('Failed to prune entries:', error);
      throw error;
    }
  }
}
