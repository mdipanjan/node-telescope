import { Pool, PoolConfig } from 'pg';
import { AdvancedQueryOptions, StorageInterface } from './storage-interface';
import { logger } from '../utils/logger';
import { Entry, EntryType, EventTypes, ExceptionEntry, QueryEntry, RequestEntry } from '../types';
import EventEmitter from 'events';

export class PostgreSQLStorage extends EventEmitter implements StorageInterface {
  private pool: Pool;

  constructor(options: { connection: PoolConfig }) {
    super();
    this.pool = new Pool(options.connection);
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

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        CREATE TABLE IF NOT EXISTS entries (
          id UUID PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS requests (
          id UUID PRIMARY KEY REFERENCES entries(id),
          method VARCHAR(10),
          url TEXT,
          headers JSONB,
          ip VARCHAR(45),
          request_id UUID,
          response_status_code INTEGER,
          response_headers JSONB,
          response_body TEXT,
          curl_command TEXT,
          memory_usage_before INTEGER,
          memory_usage_after INTEGER,
          memory_usage_difference INTEGER,
          duration INTEGER
        );

        CREATE TABLE IF NOT EXISTS exceptions (
          id UUID PRIMARY KEY REFERENCES entries(id),
          class VARCHAR(255),
          file TEXT,
          line INTEGER,
          message TEXT,
          stack TEXT
        );

        CREATE TABLE IF NOT EXISTS queries (
          id UUID PRIMARY KEY REFERENCES entries(id),
          collection VARCHAR(255),
          method VARCHAR(50),
          query TEXT,
          request_id UUID,
          result TEXT
        );
      `);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async storeEntry(entry: Omit<Entry, 'id'>): Promise<string> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const id = crypto.randomUUID();
      await client.query('INSERT INTO entries (id, type, timestamp) VALUES ($1, $2, $3)', [
        id,
        entry.type,
        entry.timestamp,
      ]);

      switch (entry.type) {
        case EntryType.REQUESTS:
          await this.storeRequestEntry(client, id, entry as RequestEntry);
          break;
        case EntryType.EXCEPTIONS:
          await this.storeExceptionEntry(client, id, entry as ExceptionEntry);
          break;
        case EntryType.QUERIES:
          await this.storeQueryEntry(client, id, entry as QueryEntry);
          break;
      }

      await client.query('COMMIT');
      this.emit(EventTypes.NEW_ENTRY, { ...entry, id });
      return id;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to store entry:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async storeRequestEntry(client: any, id: string, entry: RequestEntry): Promise<void> {
    await client.query(
      `INSERT INTO requests (id, method, url, headers, ip, request_id, response_status_code, response_headers, response_body, curl_command, memory_usage_before, memory_usage_after, memory_usage_difference, duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        id,
        entry.request.method,
        entry.request.url,
        JSON.stringify(entry.request.headers),
        entry.request.ip,
        entry.request.requestId,
        entry.response.statusCode,
        JSON.stringify(entry.response.headers),
        entry.response.body,
        entry.curlCommand,
        entry.memoryUsage?.before,
        entry.memoryUsage?.after,
        entry.memoryUsage?.difference,
        entry.duration,
      ],
    );
  }

  private async storeExceptionEntry(client: any, id: string, entry: ExceptionEntry): Promise<void> {
    await client.query(
      `INSERT INTO exceptions (id, class, file, line, message, stack)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        entry.exception.class,
        entry.exception.file,
        entry.exception.line,
        entry.exception.message,
        entry.exception.stack,
      ],
    );
  }

  private async storeQueryEntry(client: any, id: string, entry: QueryEntry): Promise<void> {
    await client.query(
      `INSERT INTO queries (id, collection, method, query, request_id, result)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        entry.data.collection,
        entry.data.method,
        entry.data.query,
        entry.data.requestId,
        entry.data.result,
      ],
    );
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
          detailedEntry = await this.getRequestEntry(client, id, entry);
          break;
        case EntryType.EXCEPTIONS:
          detailedEntry = await this.getExceptionEntry(client, id, entry);
          break;
        case EntryType.QUERIES:
          detailedEntry = await this.getQueryEntry(client, id, entry);
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

  private async getRequestEntry(client: any, id: string, baseEntry: any): Promise<RequestEntry> {
    const requestResult = await client.query('SELECT * FROM requests WHERE id = $1', [id]);
    const request = requestResult.rows[0];
    return {
      ...baseEntry,
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        ip: request.ip,
        requestId: request.request_id,
      },
      response: {
        statusCode: request.response_status_code,
        headers: request.response_headers,
        body: request.response_body,
      },
      curlCommand: request.curl_command,
      memoryUsage: {
        before: request.memory_usage_before,
        after: request.memory_usage_after,
        difference: request.memory_usage_difference,
      },
      duration: request.duration,
    };
  }

  private async getExceptionEntry(
    client: any,
    id: string,
    baseEntry: any,
  ): Promise<ExceptionEntry> {
    const exceptionResult = await client.query('SELECT * FROM exceptions WHERE id = $1', [id]);
    const exception = exceptionResult.rows[0];
    return {
      ...baseEntry,
      exception: {
        class: exception.class,
        file: exception.file,
        line: exception.line,
        message: exception.message,
        stack: exception.stack,
      },
    };
  }

  private async getQueryEntry(client: any, id: string, baseEntry: any): Promise<QueryEntry> {
    const queryResult = await client.query('SELECT * FROM queries WHERE id = $1', [id]);
    const query = queryResult.rows[0];
    return {
      ...baseEntry,
      data: {
        collection: query.collection,
        method: query.method,
        query: query.query,
        requestId: query.request_id,
        result: query.result,
      },
    };
  }

  async getEntries(
    queryOptions: AdvancedQueryOptions,
  ): Promise<{ entries: Entry[]; pagination: unknown }> {
    const client = await this.pool.connect();
    try {
      const { page = 1, perPage = 20, type, requestId } = queryOptions;
      const offset = (page - 1) * perPage;

      let query = 'SELECT * FROM entries';
      const queryParams: any[] = [];
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

      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query +=
        ' ORDER BY timestamp DESC LIMIT $' +
        (queryParams.length + 1) +
        ' OFFSET $' +
        (queryParams.length + 2);
      queryParams.push(perPage, offset);

      const result = await client.query(query, queryParams);
      const entries = await Promise.all(result.rows.map(row => this.getEntry(row.id)));

      const countQuery =
        'SELECT COUNT(*) FROM entries' +
        (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '');
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
      let query = 'SELECT * FROM entries';
      const queryParams: any[] = [];

      if (type) {
        query += ' WHERE type = $1';
        queryParams.push(type);
      }

      query += ' ORDER BY timestamp DESC LIMIT $' + (queryParams.length + 1);
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
