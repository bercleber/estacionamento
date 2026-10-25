export async function contarVagas(connection) {
  const rows = await connection.query(`SELECT disponibilidade, COUNT(*) AS total FROM (
    SELECT CASE
      WHEN v.ativa = FALSE THEN 'INATIVA'
      WHEN EXISTS (SELECT 1 FROM movimentacoes m WHERE m.vaga_id = v.id AND m.saida_em IS NULL) THEN 'OCUPADA'
      WHEN EXISTS (SELECT 1 FROM clientes c WHERE c.vaga_cativa_id = v.id) THEN 'CATIVA'
      ELSE 'LIVRE'
    END AS disponibilidade FROM vagas v
  ) AS disponibilidades GROUP BY disponibilidade`);
  const totais = { LIVRE: 0, OCUPADA: 0, CATIVA: 0, INATIVA: 0 };
  for (const row of rows) totais[row.disponibilidade] = Number(row.total);
  return totais;
}

export async function contarMovimentacoes(inicio, fim, connection) {
  const [row] = await connection.query(`SELECT
    (SELECT COUNT(*) FROM movimentacoes WHERE entrada_em >= ? AND entrada_em < ?) AS entradas,
    (SELECT COUNT(*) FROM movimentacoes WHERE saida_em >= ? AND saida_em < ?) AS saidas`,
  [inicio, fim, inicio, fim]);
  return { entradas: Number(row.entradas), saidas: Number(row.saidas) };
}

export async function contarClientesAtivos(connection) {
  const rows = await connection.query('SELECT tipo, COUNT(*) AS total FROM clientes WHERE ativo = TRUE GROUP BY tipo');
  const totais = { HORISTA: 0, MENSALISTA: 0 };
  for (const row of rows) totais[row.tipo] = Number(row.total);
  return { horistas: totais.HORISTA, mensalistas: totais.MENSALISTA };
}

export async function somarCobrancas(inicio, fim, connection) {
  const [row] = await connection.query(`SELECT COALESCE(SUM(valor_total), 0.00) AS total
    FROM movimentacoes WHERE tipo = 'HORISTA' AND saida_em >= ? AND saida_em < ?`, [inicio, fim]);
  // O conector mantém DECIMAL como string, inclusive nas somas monetárias.
  return row.total;
}

export async function contarUsuarios(connection) {
  const rows = await connection.query('SELECT ativo, COUNT(*) AS total FROM usuarios GROUP BY ativo');
  const totais = { ativos: 0, inativos: 0 };
  for (const row of rows) totais[row.ativo ? 'ativos' : 'inativos'] = Number(row.total);
  return totais;
}
