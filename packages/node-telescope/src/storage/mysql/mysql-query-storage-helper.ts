import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { QueryEntry } from '../../types';

export class QueryStorage {
  static async storeEntry(
    connection: PoolConnection,
    id: string,
    entry: QueryEntry,
  ): Promise<void> {
    await connection.query(
      `INSERT INTO queries (id, collection, method, query, request_id, result)
       VALUES (?, ?, ?, ?, ?, ?)`,
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

  static async getEntry(
    connection: PoolConnection,
    id: string,
    baseEntry: QueryEntry,
  ): Promise<QueryEntry> {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM queries WHERE id = ?', [
      id,
    ]);
    if (rows.length === 0) {
      throw new Error(`Query entry not found for id: ${id}`);
    }
    const query = rows[0];
    return {
      ...baseEntry,
      data: {
        collection: query.collection,
        method: query.method,
        query: query.query,
        requestId: query.request_id,
        result: query.result,
        duration: query.duration || null,
      },
    };
  }
}
