import { getPool } from '../../config/database.js';

const consulta = `SELECT c.id, c.nome, c.cpf, c.telefone, c.tipo, c.vaga_cativa_id,
  v.numero AS vaga_cativa_numero, c.ativo FROM clientes c
  LEFT JOIN vagas v ON v.id = c.vaga_cativa_id`;

export function listarClientes() {
  return getPool().query(`${consulta} ORDER BY c.nome, c.id`);
}

export async function buscarCliente(id, connection = getPool()) {
  const rows = await connection.query(`${consulta} WHERE c.id = ?`, [id]);
  return rows[0];
}

export async function bloquearCliente(id, connection) {
  const rows = await connection.query(
    'SELECT id, nome, cpf, telefone, tipo, vaga_cativa_id, ativo FROM clientes WHERE id = ? FOR UPDATE', [id],
  );
  return rows[0];
}

export async function possuiMovimentacaoAberta(id, connection) {
  const rows = await connection.query(
    'SELECT id FROM movimentacoes WHERE cliente_id = ? AND saida_em IS NULL LIMIT 1 FOR UPDATE', [id],
  );
  return rows.length > 0;
}

export async function criarCliente(dados, criadoPor, connection) {
  const result = await connection.query(
    'INSERT INTO clientes (nome, cpf, telefone, tipo, ativo, criado_por) VALUES (?, ?, ?, ?, TRUE, ?)',
    [dados.nome, dados.cpf, dados.telefone, dados.tipo, criadoPor],
  );
  return buscarCliente(result.insertId, connection);
}

export async function editarCliente(id, dados, connection) {
  await connection.query('UPDATE clientes SET nome = ?, cpf = ?, telefone = ?, tipo = ? WHERE id = ?',
    [dados.nome, dados.cpf, dados.telefone, dados.tipo, id]);
  return buscarCliente(id, connection);
}

export async function alterarSituacao(id, ativo, connection) {
  await connection.query('UPDATE clientes SET ativo = ? WHERE id = ?', [ativo, id]);
  return buscarCliente(id, connection);
}

export async function bloquearVagas(ids, connection) {
  if (!ids.length) return [];
  const marcadores = ids.map(() => '?').join(', ');
  return connection.query(`SELECT id, ativa FROM vagas WHERE id IN (${marcadores}) ORDER BY id FOR UPDATE`, ids);
}

export async function vagaOcupada(id, connection) {
  const rows = await connection.query(
    'SELECT id FROM movimentacoes WHERE vaga_id = ? AND saida_em IS NULL LIMIT 1 FOR UPDATE', [id],
  );
  return rows.length > 0;
}

export async function vagaVinculadaAOutroCliente(vagaId, clienteId, connection) {
  const rows = await connection.query(
    'SELECT id FROM clientes WHERE vaga_cativa_id = ? AND id <> ? LIMIT 1 FOR UPDATE', [vagaId, clienteId],
  );
  return rows.length > 0;
}

export async function alterarVagaCativa(id, vagaId, connection) {
  await connection.query('UPDATE clientes SET vaga_cativa_id = ? WHERE id = ?', [vagaId, id]);
  return buscarCliente(id, connection);
}

export function listarEnderecos(clienteId, connection = getPool(), bloquear = false) {
  return connection.query(`SELECT id, cliente_id, logradouro, numero, complemento, bairro,
    cidade, estado, cep, principal FROM enderecos WHERE cliente_id = ? ORDER BY id${bloquear ? ' FOR UPDATE' : ''}`, [clienteId]);
}

async function buscarEndereco(id, clienteId, connection) {
  const rows = await connection.query('SELECT * FROM enderecos WHERE id = ? AND cliente_id = ?', [id, clienteId]);
  return rows[0];
}

export async function criarEndereco(clienteId, dados, principal, connection) {
  const result = await connection.query(`INSERT INTO enderecos
    (cliente_id, logradouro, numero, complemento, bairro, cidade, estado, cep, principal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [clienteId, dados.logradouro, dados.numero, dados.complemento, dados.bairro, dados.cidade, dados.estado, dados.cep, principal]);
  return buscarEndereco(result.insertId, clienteId, connection);
}

export async function editarEndereco(id, clienteId, dados, connection) {
  await connection.query(`UPDATE enderecos SET logradouro = ?, numero = ?, complemento = ?,
    bairro = ?, cidade = ?, estado = ?, cep = ? WHERE id = ? AND cliente_id = ?`,
  [dados.logradouro, dados.numero, dados.complemento, dados.bairro, dados.cidade, dados.estado, dados.cep, id, clienteId]);
  return buscarEndereco(id, clienteId, connection);
}

export async function definirPrincipal(id, clienteId, connection) {
  await connection.query('UPDATE enderecos SET principal = (id = ?) WHERE cliente_id = ?', [id, clienteId]);
  return buscarEndereco(id, clienteId, connection);
}

export function removerEndereco(id, clienteId, connection) {
  return connection.query('DELETE FROM enderecos WHERE id = ? AND cliente_id = ?', [id, clienteId]);
}
