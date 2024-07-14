import { ExceptionEntry } from '../../types';

export class ExceptionStorage {
  static async storeEntry(client: any, id: string, entry: ExceptionEntry): Promise<void> {
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

  static async getEntry(client: any, id: string, baseEntry: any): Promise<ExceptionEntry> {
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
}
