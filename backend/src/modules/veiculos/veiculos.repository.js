import { getPool } from '../../config/database.js';

const consulta = `SELECT v.id, v.cliente_id, c.nome AS cliente_nome, c.ativo AS cliente_ativo,
  v.placa, v.modelo, v.cor, v.ativo FROM veiculos v JOIN clientes c ON c.id = v.cliente_id`;

export function listarVeiculos(clienteId, connection = getPool()) {
  return connection.query(`${consulta} WHERE v.cliente_id = ? ORDER BY v.placa, v.id`, [clienteId]);
}

async function buscarVeiculo(clienteId, id, connection) {
  const rows = await connection.query(`${consulta} WHERE v.id = ? AND v.cliente_id = ?`, [id, clienteId]);
  return rows[0];
}

export async function bloquearVeiculo(clienteId, id, connection) {
  const rows = await connection.query(
    'SELECT id, cliente_id, placa, modelo, cor, ativo FROM veiculos WHERE id = ? AND cliente_id = ? FOR UPDATE', [id, clienteId],
  );
  return rows[0];
}

export async function criarVeiculo(clienteId, dados, criadoPor, connection) {
  const result = await connection.query(
    'INSERT INTO veiculos (cliente_id, placa, modelo, cor, ativo, criado_por) VALUES (?, ?, ?, ?, TRUE, ?)',
    [clienteId, dados.placa, dados.modelo, dados.cor, criadoPor],
  );
  return buscarVeiculo(clienteId, result.insertId, connection);
}

export async function editarVeiculo(clienteId, id, dados, connection) {
  await connection.query('UPDATE veiculos SET placa = ?, modelo = ?, cor = ? WHERE id = ? AND cliente_id = ?',
    [dados.placa, dados.modelo, dados.cor, id, clienteId]);
  return buscarVeiculo(clienteId, id, connection);
}

export async function alterarSituacao(clienteId, id, ativo, connection) {
  await connection.query('UPDATE veiculos SET ativo = ? WHERE id = ? AND cliente_id = ?', [ativo, id, clienteId]);
  return buscarVeiculo(clienteId, id, connection);
}

export async function possuiMovimentacaoAberta(id, connection) {
  const rows = await connection.query(
    'SELECT id FROM movimentacoes WHERE veiculo_id = ? AND saida_em IS NULL LIMIT 1 FOR UPDATE', [id],
  );
  return rows.length > 0;
}
