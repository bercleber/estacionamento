import mariadb from 'mariadb';

let pool;

export function getPool() {
  // O pool só é criado quando uma operação do banco é solicitada.
  if (!pool) {
    pool = mariadb.createPool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      database: process.env.DB_NAME ?? 'estacionamento',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 5),
      minimumIdle: 0,
    });
  }

  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export async function withTransaction(operation) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
