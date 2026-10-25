import { getPool } from '../../config/database.js';

// A configuração única usa a própria chave primária para impedir cadastros concorrentes.
const TARIFA_ID = 1;

export async function consultarTarifas(connection = getPool()) {
  const rows = await connection.query(
    'SELECT id, valor_hora, valor_mes FROM tarifas WHERE id = ?', [TARIFA_ID],
  );
  return rows[0] ?? null;
}

export async function criarTarifas({ valor_hora, valor_mes }, criadoPor, connection) {
  await connection.query(
    'INSERT INTO tarifas (id, valor_hora, valor_mes, criado_por) VALUES (?, ?, ?, ?)',
    [TARIFA_ID, valor_hora, valor_mes, criadoPor],
  );
  return consultarTarifas(connection);
}

export async function atualizarTarifas({ valor_hora, valor_mes }, connection) {
  await connection.query(
    'UPDATE tarifas SET valor_hora = ?, valor_mes = ? WHERE id = ?',
    [valor_hora, valor_mes, TARIFA_ID],
  );
  return consultarTarifas(connection);
}
