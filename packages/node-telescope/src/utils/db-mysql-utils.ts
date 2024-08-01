import { PoolConnection } from 'mysql2/promise';

export async function executeMySQLTransaction(
  connection: PoolConnection,
  callback: (conn: PoolConnection) => Promise<void>,
): Promise<void> {
  try {
    await connection.beginTransaction();
    await callback(connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

export function buildMySQLWhereClause(conditions: string[], _params: unknown[]): string {
  if (conditions.length === 0) {
    return '';
  }
  return ' WHERE ' + conditions.join(' AND ');
}
