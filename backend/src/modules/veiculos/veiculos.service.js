import { withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/http-error.js';
import * as clientes from '../clientes/clientes.repository.js';
import * as repository from './veiculos.repository.js';
import { normalizarVeiculo } from './veiculos.validation.js';

export function veiculoPublico(veiculo) {
  return {
    id: veiculo.id, cliente_id: veiculo.cliente_id, cliente_nome: veiculo.cliente_nome,
    cliente_ativo: Boolean(veiculo.cliente_ativo), placa: veiculo.placa,
    modelo: veiculo.modelo, cor: veiculo.cor, ativo: Boolean(veiculo.ativo),
  };
}

function exigirCliente(cliente) {
  if (!cliente) throw httpError(404, 'Cliente não encontrado.', 'CLIENTE_NAO_ENCONTRADO');
  return cliente;
}

function exigirClienteAtivo(cliente) {
  if (!cliente.ativo) throw httpError(409, 'Ative o cliente antes de cadastrar ou ativar um veículo.', 'CLIENTE_INATIVO');
}

function exigirVeiculo(veiculo) {
  if (!veiculo) throw httpError(404, 'Veículo não encontrado para este cliente.', 'VEICULO_NAO_ENCONTRADO');
  return veiculo;
}

async function tratarDuplicidade(operation) {
  try { return await operation(); }
  catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'Esta placa já está cadastrada, inclusive entre veículos inativos.', 'PLACA_DUPLICADA');
    }
    throw error;
  }
}

async function exigirSemMovimentacao(id, connection) {
  if (await repository.possuiMovimentacaoAberta(id, connection)) {
    throw httpError(409, 'O veículo possui movimentação em aberto. Registre a saída antes desta operação.', 'VEICULO_COM_MOVIMENTACAO');
  }
}

// Recebe a conexão do cadastro de clientes para preservar a mesma transação.
export function criarVeiculoNaTransacao(clienteId, dados, criadoPor, connection) {
  return tratarDuplicidade(async () => veiculoPublico(await repository.criarVeiculo(clienteId, dados, criadoPor, connection)));
}

export function listarVeiculos(clienteId) {
  return withTransaction(async (connection) => {
    exigirCliente(await clientes.buscarCliente(clienteId, connection));
    return (await repository.listarVeiculos(clienteId, connection)).map(veiculoPublico);
  });
}

export function cadastrarVeiculo(clienteId, dados, criadoPor) {
  const normalizados = normalizarVeiculo(dados);
  return withTransaction(async (connection) => {
    exigirClienteAtivo(exigirCliente(await clientes.bloquearCliente(clienteId, connection)));
    return criarVeiculoNaTransacao(clienteId, normalizados, criadoPor, connection);
  });
}

export function editarVeiculo(clienteId, id, dados) {
  if (!Object.keys(dados).length) throw httpError(400, 'Informe os dados do veículo a alterar.', 'DADOS_VEICULO_INVALIDOS');
  return tratarDuplicidade(() => withTransaction(async (connection) => {
    exigirCliente(await clientes.bloquearCliente(clienteId, connection));
    const anterior = exigirVeiculo(await repository.bloquearVeiculo(clienteId, id, connection));
    const normalizados = normalizarVeiculo({ ...anterior, ...dados });
    if (normalizados.placa !== anterior.placa) await exigirSemMovimentacao(id, connection);
    return veiculoPublico(await repository.editarVeiculo(clienteId, id, normalizados, connection));
  }));
}

export function alterarSituacaoVeiculo(clienteId, id, ativo) {
  return withTransaction(async (connection) => {
    const cliente = exigirCliente(await clientes.bloquearCliente(clienteId, connection));
    exigirVeiculo(await repository.bloquearVeiculo(clienteId, id, connection));
    if (ativo) exigirClienteAtivo(cliente);
    else await exigirSemMovimentacao(id, connection);
    return veiculoPublico(await repository.alterarSituacao(clienteId, id, ativo, connection));
  });
}
