import { QueryEntry } from '../../types';

export class QueryStorage {
  static async storeEntry(client: any, id: string, entry: QueryEntry): Promise<void> {
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

  static async getEntry(client: any, id: string, baseEntry: any): Promise<QueryEntry> {
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
}
