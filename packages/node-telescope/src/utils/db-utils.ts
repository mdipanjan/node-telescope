import { PoolClient } from 'pg';

export async function executeTransaction(
  client: PoolClient,
  callback: (client: PoolClient) => Promise<void>,
): Promise<void> {
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export function buildWhereClause(conditions: string[], _params: unknown[]): string {
  return conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
}
