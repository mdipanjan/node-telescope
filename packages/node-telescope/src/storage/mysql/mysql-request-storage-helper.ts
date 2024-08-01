import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { RequestEntry } from '../../types';

export class RequestStorage {
  static async storeEntry(
    connection: PoolConnection,
    id: string,
    entry: RequestEntry,
  ): Promise<void> {
    await connection.query(
      `INSERT INTO requests (
        id, method, url, headers, body, ip, request_id, 
        response_status_code, response_headers, response_body, 
        curl_command, memory_usage_before, memory_usage_after, 
        memory_usage_difference, duration
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        entry.request.method,
        entry.request.url,
        JSON.stringify(entry.request.headers),
        JSON.stringify(entry.request.body),
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

  static async getEntry(
    connection: PoolConnection,
    id: string,
    baseEntry: RequestEntry,
  ): Promise<RequestEntry> {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM requests WHERE id = ?', [
      id,
    ]);
    if (rows.length === 0) {
      throw new Error(`Request entry not found for id: ${id}`);
    }
    const request = rows[0];
    return {
      ...baseEntry,
      request: {
        method: request.method,
        url: request.url,
        headers: JSON.parse(request.headers),
        ip: request.ip,
        requestId: request.request_id,
        body: JSON.parse(request.body),
      },
      response: {
        statusCode: request.response_status_code,
        headers: JSON.parse(request.response_headers),
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
}
