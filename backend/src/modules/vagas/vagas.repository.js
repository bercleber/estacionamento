import { getPool } from '../../config/database.js';

const consultaVagas = `
  SELECT v.id, v.numero, v.ativa,
    EXISTS (SELECT 1 FROM movimentacoes m WHERE m.vaga_id = v.id AND m.saida_em IS NULL) AS ocupada,
    EXISTS (SELECT 1 FROM clientes c WHERE c.vaga_cativa_id = v.id) AS cativa
  FROM vagas v`;

export function listarVagas() {
  return getPool().query(`${consultaVagas} ORDER BY v.numero, v.id`);
}

async function buscarVaga(id, connection) {
  const rows = await connection.query(`${consultaVagas} WHERE v.id = ?`, [id]);
  return rows[0];
}

export async function bloquearVaga(id, connection) {
  const rows = await connection.query('SELECT id FROM vagas WHERE id = ? FOR UPDATE', [id]);
  return rows[0];
}

export async function criarVaga({ numero, criadoPor }, connection) {
  const result = await connection.query(
    'INSERT INTO vagas (numero, ativa, criado_por) VALUES (?, TRUE, ?)',
    [numero, criadoPor],
  );
  return buscarVaga(result.insertId, connection);
}

export async function editarVaga(id, numero, connection) {
  await connection.query('UPDATE vagas SET numero = ? WHERE id = ?', [numero, id]);
  return buscarVaga(id, connection);
}

export async function possuiMovimentacaoAberta(id, connection) {
  const rows = await connection.query(
    'SELECT id FROM movimentacoes WHERE vaga_id = ? AND saida_em IS NULL LIMIT 1 FOR UPDATE', [id],
  );
  return rows.length > 0;
}

export async function possuiClienteVinculado(id, connection) {
  const rows = await connection.query(
    'SELECT id FROM clientes WHERE vaga_cativa_id = ? LIMIT 1 FOR UPDATE', [id],
  );
  return rows.length > 0;
}

export async function alterarSituacao(id, ativa, connection) {
  await connection.query('UPDATE vagas SET ativa = ? WHERE id = ?', [ativa, id]);
  return buscarVaga(id, connection);
}
