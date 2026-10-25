import { getPool } from '../../config/database.js';

const consultaVeiculo = `SELECT v.id AS veiculo_id, v.cliente_id, v.placa, v.modelo, v.cor,
  v.ativo AS veiculo_ativo, c.nome AS cliente_nome, c.ativo AS cliente_ativo,
  c.tipo, c.vaga_cativa_id FROM veiculos v JOIN clientes c ON c.id = v.cliente_id`;

const camposMovimentacao = `m.id, m.cliente_id, c.nome AS cliente_nome, m.veiculo_id,
  m.placa_registrada, v.modelo, v.cor, m.tipo, m.vaga_id, g.numero AS vaga_numero,
  m.entrada_em, m.saida_em, m.valor_hora_aplicado, m.valor_total,
  m.usuario_entrada_id, u.nome AS usuario_entrada_nome, m.usuario_saida_id,
  us.nome AS usuario_saida_nome`;
const relacionamentosMovimentacao = `FROM movimentacoes m JOIN clientes c ON c.id = m.cliente_id
  JOIN veiculos v ON v.id = m.veiculo_id JOIN vagas g ON g.id = m.vaga_id
  JOIN usuarios u ON u.id = m.usuario_entrada_id
  LEFT JOIN usuarios us ON us.id = m.usuario_saida_id`;
const consultaMovimentacao = `SELECT ${camposMovimentacao} ${relacionamentosMovimentacao}`;

export async function buscarVeiculoPorPlaca(placa, connection) {
  const rows = await connection.query(`${consultaVeiculo} WHERE v.placa = ?`, [placa]);
  return rows[0];
}

export async function buscarVeiculoPorId(id) {
  const rows = await getPool().query(`${consultaVeiculo} WHERE v.id = ?`, [id]);
  return rows[0];
}

export async function bloquearVaga(id, connection) {
  const rows = await connection.query('SELECT id, numero, ativa FROM vagas WHERE id = ? FOR UPDATE', [id]);
  return rows[0];
}

export async function veiculoEstacionado(id, connection) {
  const rows = await connection.query('SELECT id FROM movimentacoes WHERE veiculo_id = ? AND saida_em IS NULL LIMIT 1', [id]);
  return rows.length > 0;
}

export async function vagaOcupada(id, connection) {
  const rows = await connection.query('SELECT id FROM movimentacoes WHERE vaga_id = ? AND saida_em IS NULL LIMIT 1', [id]);
  return rows.length > 0;
}

export async function buscarClienteDaVaga(id, connection) {
  const rows = await connection.query('SELECT id FROM clientes WHERE vaga_cativa_id = ?', [id]);
  return rows[0];
}

export function listarVagasPermitidas(cliente, connection) {
  const cativa = cliente.tipo === 'MENSALISTA' && cliente.vaga_cativa_id !== null;
  return connection.query(`SELECT v.id, v.numero FROM vagas v
    WHERE v.ativa = TRUE
      AND NOT EXISTS (SELECT 1 FROM movimentacoes m WHERE m.vaga_id = v.id AND m.saida_em IS NULL)
      AND ${cativa ? 'v.id = ?' : 'NOT EXISTS (SELECT 1 FROM clientes c WHERE c.vaga_cativa_id = v.id)'}
    ORDER BY v.numero, v.id`, cativa ? [cliente.vaga_cativa_id] : []);
}

export async function buscarTarifaAtual(connection) {
  // Leitura atual, mesmo após a consulta das ocupações, preservada até o commit.
  const rows = await connection.query('SELECT valor_hora FROM tarifas WHERE id = 1 LOCK IN SHARE MODE');
  return rows[0];
}

export function listarEmAberto() {
  return getPool().query(`${consultaMovimentacao} WHERE m.saida_em IS NULL ORDER BY m.entrada_em DESC, m.id DESC`);
}

export async function buscarMovimentacao(id, connection = getPool()) {
  const rows = await connection.query(`${consultaMovimentacao} WHERE m.id = ?`, [id]);
  return rows[0];
}

export async function listarHistorico(filtros, connection) {
  const condicoes = [];
  const valores = [];
  if (filtros.inicio !== undefined) { condicoes.push('m.entrada_em >= ?'); valores.push(filtros.inicio); }
  if (filtros.fimExclusivo !== undefined) { condicoes.push('m.entrada_em < ?'); valores.push(filtros.fimExclusivo); }
  if (filtros.placa !== undefined) { condicoes.push('m.placa_registrada = ?'); valores.push(filtros.placa); }
  if (filtros.clienteId !== undefined) { condicoes.push('m.cliente_id = ?'); valores.push(filtros.clienteId); }
  if (filtros.situacao !== undefined) condicoes.push(filtros.situacao === 'ABERTA' ? 'm.saida_em IS NULL' : 'm.saida_em IS NOT NULL');
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const [contagem] = await connection.query(`SELECT COUNT(*) AS total FROM movimentacoes m ${where}`, valores);
  const itens = await connection.query(`${consultaMovimentacao} ${where}
    ORDER BY m.entrada_em DESC, m.id DESC LIMIT ? OFFSET ?`, [...valores, filtros.porPagina, filtros.offset]);
  return { itens, total: Number(contagem.total) };
}

export async function consultarDetalhes(id) {
  const rows = await getPool().query(`SELECT ${camposMovimentacao},
    CURRENT_TIMESTAMP AS consultado_em,
    TIMESTAMPDIFF(SECOND, m.entrada_em, COALESCE(m.saida_em, CURRENT_TIMESTAMP)) AS tempo_total_segundos
    ${relacionamentosMovimentacao} WHERE m.id = ?`, [id]);
  return rows[0];
}

export async function bloquearMovimentacao(id, connection) {
  const rows = await connection.query('SELECT id, cliente_id, veiculo_id, vaga_id, saida_em FROM movimentacoes WHERE id = ? FOR UPDATE', [id]);
  return rows[0];
}

export async function consultarCalculoSaida(id, connection = getPool()) {
  // O mesmo instante do banco determina a duração, a prévia e o horário a gravar.
  const rows = await connection.query(`SELECT
    CURRENT_TIMESTAMP AS horario_calculo,
    DATE_FORMAT(CURRENT_TIMESTAMP, '%Y-%m-%d %H:%i:%s') AS horario_calculo_sql,
    TIMESTAMPDIFF(SECOND, m.entrada_em, CURRENT_TIMESTAMP) AS tempo_total_segundos,
    ${camposMovimentacao} ${relacionamentosMovimentacao} WHERE m.id = ?`, [id]);
  return rows[0];
}

export async function registrarSaida(id, horario, valorTotal, usuarioId, connection) {
  const result = await connection.query(`UPDATE movimentacoes
    SET saida_em = ?, valor_total = ?, usuario_saida_id = ? WHERE id = ? AND saida_em IS NULL`,
  [horario, valorTotal, usuarioId, id]);
  return Number(result.affectedRows) === 1;
}

export async function criarEntrada({ cliente, veiculo, vagaId, valorHora, usuarioId }, connection) {
  const result = await connection.query(`INSERT INTO movimentacoes
    (cliente_id, veiculo_id, vaga_id, placa_registrada, tipo, valor_hora_aplicado, usuario_entrada_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [cliente.id, veiculo.id, vagaId, veiculo.placa, cliente.tipo, valorHora, usuarioId]);
  const rows = await connection.query(`${consultaMovimentacao} WHERE m.id = ?`, [result.insertId]);
  return rows[0];
}
