import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { ExceptionEntry } from '../../types';

export class ExceptionStorage {
  static async storeEntry(
    connection: PoolConnection,
    id: string,
    entry: ExceptionEntry,
  ): Promise<void> {
    await connection.query(
      `INSERT INTO exceptions (id, class, file, line, message, stack)
       VALUES (?, ?, ?, ?, ?, ?)`,
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

  static async getEntry(
    connection: PoolConnection,
    id: string,
    baseEntry: ExceptionEntry,
  ): Promise<ExceptionEntry> {
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM exceptions WHERE id = ?',
      [id],
    );
    if (rows.length === 0) {
      throw new Error(`Exception entry not found for id: ${id}`);
    }
    const exception = rows[0];
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
}
