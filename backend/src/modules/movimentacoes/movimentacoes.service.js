import { withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/http-error.js';
import { bloquearCliente } from '../clientes/clientes.repository.js';
import { bloquearVeiculo } from '../veiculos/veiculos.repository.js';
import { normalizarVeiculo } from '../veiculos/veiculos.validation.js';
import { consultarTarifas } from '../tarifas/tarifas.repository.js';
import * as repository from './movimentacoes.repository.js';
import { calcularCobranca } from './movimentacoes.calculo.js';
import { normalizarFiltrosHistorico } from './movimentacoes.filtros.js';

function movimentacaoPublica(movimentacao) {
  return {
    id: movimentacao.id, cliente_id: movimentacao.cliente_id, cliente_nome: movimentacao.cliente_nome,
    veiculo_id: movimentacao.veiculo_id, placa_registrada: movimentacao.placa_registrada,
    modelo: movimentacao.modelo, cor: movimentacao.cor, tipo: movimentacao.tipo,
    vaga_id: movimentacao.vaga_id, vaga_numero: movimentacao.vaga_numero,
    entrada_em: movimentacao.entrada_em.toISOString(),
    saida_em: movimentacao.saida_em?.toISOString() ?? null,
    valor_hora_aplicado: movimentacao.valor_hora_aplicado, valor_total: movimentacao.valor_total,
    usuario_entrada_id: movimentacao.usuario_entrada_id, usuario_entrada_nome: movimentacao.usuario_entrada_nome,
    usuario_saida_id: movimentacao.usuario_saida_id, usuario_saida_nome: movimentacao.usuario_saida_nome,
  };
}

function exigirVeiculo(veiculo) {
  if (!veiculo) throw httpError(404, 'Veículo não encontrado. Cadastre-o na ficha de um cliente.', 'VEICULO_NAO_ENCONTRADO');
  return veiculo;
}

function exigirAtivos(clienteAtivo, veiculoAtivo) {
  if (!clienteAtivo) throw httpError(409, 'O cliente está inativo. Ative seu cadastro antes de registrar a entrada.', 'CLIENTE_INATIVO');
  if (!veiculoAtivo) throw httpError(409, 'O veículo está inativo. Ative seu cadastro antes de registrar a entrada.', 'VEICULO_INATIVO');
}

async function exigirSemEntrada(veiculoId, connection) {
  if (await repository.veiculoEstacionado(veiculoId, connection)) {
    throw httpError(409, 'Este veículo já está estacionado.', 'VEICULO_JA_ESTACIONADO');
  }
}

function exigirTarifa(tarifa) {
  if (!tarifa) throw httpError(409, 'Configure as tarifas antes de registrar a entrada de um horista.', 'TARIFA_NAO_CONFIGURADA');
  return tarifa.valor_hora;
}

export function consultarEntrada(placaInformada) {
  const { placa } = normalizarVeiculo({ placa: placaInformada });
  return withTransaction(async (connection) => {
    const dados = exigirVeiculo(await repository.buscarVeiculoPorPlaca(placa, connection));
    exigirAtivos(dados.cliente_ativo, dados.veiculo_ativo);
    await exigirSemEntrada(dados.veiculo_id, connection);
    const valorHora = dados.tipo === 'HORISTA' ? exigirTarifa(await consultarTarifas(connection)) : null;
    const vagas = await repository.listarVagasPermitidas(dados, connection);
    return {
      veiculo: { id: dados.veiculo_id, placa: dados.placa, modelo: dados.modelo, cor: dados.cor },
      cliente: { id: dados.cliente_id, nome: dados.cliente_nome, tipo: dados.tipo, vaga_cativa_id: dados.vaga_cativa_id },
      vagas_permitidas: vagas,
      valor_hora: valorHora,
    };
  });
}

export async function listarEmAberto() {
  return (await repository.listarEmAberto()).map(movimentacaoPublica);
}

function movimentacaoHistorica(movimentacao) {
  return { ...movimentacaoPublica(movimentacao), situacao: movimentacao.saida_em === null ? 'ABERTA' : 'ENCERRADA' };
}

export function listarHistorico(query) {
  const filtros = normalizarFiltrosHistorico(query);
  return withTransaction(async (connection) => {
    const { itens, total } = await repository.listarHistorico(filtros, connection);
    return {
      itens: itens.map(movimentacaoHistorica),
      pagina: filtros.pagina,
      por_pagina: filtros.porPagina,
      total,
      total_paginas: Math.ceil(total / filtros.porPagina),
    };
  });
}

export async function consultarDetalhes(id) {
  const dados = await repository.consultarDetalhes(id);
  if (!dados) throw httpError(404, 'Movimentação não encontrada.', 'MOVIMENTACAO_NAO_ENCONTRADA');
  const segundos = Number(dados.tempo_total_segundos);
  return {
    ...movimentacaoHistorica(dados),
    consultado_em: dados.consultado_em.toISOString(),
    tempo_total_segundos: dados.tempo_total_segundos !== null && Number.isSafeInteger(segundos) && segundos >= 0 ? segundos : null,
  };
}

function validarId(id) {
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    throw httpError(400, 'Informe um veículo e uma vaga válidos.', 'DADOS_ENTRADA_INVALIDOS');
  }
}

export async function registrarEntrada({ veiculo_id: veiculoId, vaga_id: vagaId }, usuarioId) {
  validarId(veiculoId);
  validarId(vagaId);
  // Consulta inicial fora da transação: nenhuma leitura antiga é usada para validar a entrada.
  const inicial = exigirVeiculo(await repository.buscarVeiculoPorId(veiculoId));
  return withTransaction(async (connection) => {
    // Ordem compartilhada com a atribuição de vagas cativas e a edição dos cadastros.
    const vaga = await repository.bloquearVaga(vagaId, connection);
    if (!vaga) throw httpError(404, 'Vaga não encontrada.', 'VAGA_NAO_ENCONTRADA');
    const cliente = await bloquearCliente(inicial.cliente_id, connection);
    if (!cliente) throw httpError(404, 'Cliente não encontrado.', 'CLIENTE_NAO_ENCONTRADO');
    const veiculo = exigirVeiculo(await bloquearVeiculo(cliente.id, veiculoId, connection));
    exigirAtivos(cliente.ativo, veiculo.ativo);

    // A primeira leitura consistente ocorre depois dos bloqueios. Os mesmos pais
    // serializam entradas concorrentes; não é necessário bloquear lacunas de movimentações.
    await exigirSemEntrada(veiculoId, connection);
    if (!vaga.ativa) throw httpError(409, 'A vaga está inativa.', 'VAGA_INATIVA');
    if (await repository.vagaOcupada(vagaId, connection)) {
      throw httpError(409, 'A vaga foi ocupada. Consulte as vagas disponíveis novamente.', 'VAGA_OCUPADA');
    }
    const possuiCativa = cliente.tipo === 'MENSALISTA' && cliente.vaga_cativa_id !== null;
    if (possuiCativa && cliente.vaga_cativa_id !== vagaId) {
      throw httpError(409, 'Este mensalista deve utilizar sua própria vaga cativa.', 'VAGA_NAO_PERMITIDA');
    }
    const vinculo = await repository.buscarClienteDaVaga(vagaId, connection);
    if (vinculo && (!possuiCativa || vinculo.id !== cliente.id)) {
      throw httpError(409, 'Esta vaga é cativa e não pode ser utilizada por este cliente.', 'VAGA_NAO_PERMITIDA');
    }
    const valorHora = cliente.tipo === 'HORISTA' ? exigirTarifa(await repository.buscarTarifaAtual(connection)) : null;
    return movimentacaoPublica(await repository.criarEntrada({ cliente, veiculo, vagaId, valorHora, usuarioId }, connection));
  });
}

function exigirMovimentacaoAberta(movimentacao) {
  if (!movimentacao) throw httpError(404, 'Movimentação não encontrada.', 'MOVIMENTACAO_NAO_ENCONTRADA');
  if (movimentacao.saida_em !== null) throw httpError(409, 'A saída desta movimentação já foi registrada.', 'SAIDA_JA_REGISTRADA');
  return movimentacao;
}

export async function consultarPreviaSaida(id) {
  const dados = exigirMovimentacaoAberta(await repository.consultarCalculoSaida(id));
  return {
    movimentacao: movimentacaoPublica(dados),
    saida_prevista_em: dados.horario_calculo.toISOString(),
    ...calcularCobranca(dados),
  };
}

export async function registrarSaida(id, usuarioId) {
  const inicial = exigirMovimentacaoAberta(await repository.buscarMovimentacao(id));
  return withTransaction(async (connection) => {
    await repository.bloquearVaga(inicial.vaga_id, connection);
    await bloquearCliente(inicial.cliente_id, connection);
    const veiculo = await bloquearVeiculo(inicial.cliente_id, inicial.veiculo_id, connection);
    const atual = exigirMovimentacaoAberta(await repository.bloquearMovimentacao(id, connection));
    if (!veiculo || atual.vaga_id !== inicial.vaga_id || atual.cliente_id !== inicial.cliente_id || atual.veiculo_id !== inicial.veiculo_id) {
      throw httpError(409, 'Os dados da movimentação foram alterados. Consulte a saída novamente.', 'MOVIMENTACAO_ALTERADA');
    }
    // O relógio é consultado somente após a aquisição de todos os bloqueios.
    const dados = exigirMovimentacaoAberta(await repository.consultarCalculoSaida(id, connection));
    const cobranca = calcularCobranca(dados);
    const registrada = await repository.registrarSaida(id, dados.horario_calculo_sql, cobranca.valor_total, usuarioId, connection);
    if (!registrada) throw httpError(409, 'A saída desta movimentação já foi registrada.', 'SAIDA_JA_REGISTRADA');
    return { ...movimentacaoPublica(await repository.buscarMovimentacao(id, connection)), ...cobranca };
  });
}
