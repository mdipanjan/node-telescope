import { RequestEntry } from '../../types';

export class RequestStorage {
  static async storeEntry(client: any, id: string, entry: RequestEntry): Promise<void> {
    await client.query(
      `INSERT INTO requests (
        id, method, url, headers, body, ip, request_id, 
        response_status_code, response_headers, response_body, 
        curl_command, memory_usage_before, memory_usage_after, 
        memory_usage_difference, duration
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        entry.request.method,
        entry.request.url,
        entry.request.headers,
        entry.request.body,
        entry.request.ip,
        entry.request.requestId,
        entry.response.statusCode,
        entry.response.headers,
        entry.response.body,
        entry.curlCommand,
        entry.memoryUsage?.before,
        entry.memoryUsage?.after,
        entry.memoryUsage?.difference,
        entry.duration,
      ],
    );
  }

  static async getEntry(client: any, id: string, baseEntry: any): Promise<RequestEntry> {
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
        body: request.body,
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
}
