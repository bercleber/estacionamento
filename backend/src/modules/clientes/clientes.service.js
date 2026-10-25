import { withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/http-error.js';
import { normalizarCliente, normalizarEndereco, validarVagaId } from './clientes.validation.js';
import * as repository from './clientes.repository.js';
import { normalizarVeiculo } from '../veiculos/veiculos.validation.js';
import { criarVeiculoNaTransacao, veiculoPublico } from '../veiculos/veiculos.service.js';
import { listarVeiculos } from '../veiculos/veiculos.repository.js';

function clientePublico(cliente) {
  return {
    id: cliente.id, nome: cliente.nome, cpf: cliente.cpf, telefone: cliente.telefone,
    tipo: cliente.tipo, vaga_cativa_id: cliente.vaga_cativa_id,
    vaga_cativa_numero: cliente.vaga_cativa_numero, ativo: Boolean(cliente.ativo),
  };
}

function enderecoPublico(endereco) {
  return { ...endereco, principal: Boolean(endereco.principal) };
}

function exigirCliente(cliente) {
  if (!cliente) throw httpError(404, 'Cliente não encontrado.', 'CLIENTE_NAO_ENCONTRADO');
  return cliente;
}

async function exigirSemMovimentacao(id, connection) {
  if (await repository.possuiMovimentacaoAberta(id, connection)) {
    throw httpError(409, 'O cliente possui movimentação em aberto. Registre a saída antes desta operação.', 'CLIENTE_COM_MOVIMENTACAO');
  }
}

async function gravar(operation, vagaCativa = false) {
  try {
    return await withTransaction(operation);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw vagaCativa
        ? httpError(409, 'A vaga já está vinculada a outro cliente.', 'VAGA_INDISPONIVEL')
        : httpError(409, 'Este CPF já está cadastrado, inclusive entre clientes inativos.', 'CPF_DUPLICADO');
    }
    throw error;
  }
}

export async function listarClientes() {
  return (await repository.listarClientes()).map(clientePublico);
}

export function consultarCliente(id) {
  return withTransaction(async (connection) => {
    const cliente = exigirCliente(await repository.buscarCliente(id, connection));
    const enderecos = await repository.listarEnderecos(id, connection);
    const veiculos = await listarVeiculos(id, connection);
    return { ...clientePublico(cliente), enderecos: enderecos.map(enderecoPublico), veiculos: veiculos.map(veiculoPublico) };
  });
}

export function cadastrarCliente(dados, criadoPor) {
  const normalizados = normalizarCliente(dados);
  const veiculo = normalizarVeiculo(dados.veiculo);
  return gravar(async (connection) => {
    const cliente = await repository.criarCliente(normalizados, criadoPor, connection);
    const cadastrado = await criarVeiculoNaTransacao(cliente.id, veiculo, criadoPor, connection);
    return { ...clientePublico(cliente), veiculos: [cadastrado] };
  });
}

export function editarCliente(id, dados) {
  if (!Object.keys(dados).length) throw httpError(400, 'Informe os dados do cliente a alterar.', 'DADOS_CLIENTE_INVALIDOS');
  return gravar(async (connection) => {
    const anterior = exigirCliente(await repository.bloquearCliente(id, connection));
    const normalizados = normalizarCliente({ ...anterior, ...dados });
    if (normalizados.tipo !== anterior.tipo) {
      await exigirSemMovimentacao(id, connection);
      if (normalizados.tipo === 'HORISTA' && anterior.vaga_cativa_id !== null) {
        throw httpError(409, 'Remova a vaga cativa antes de mudar o cliente para horista.', 'CLIENTE_COM_VAGA_CATIVA');
      }
    }
    return clientePublico(await repository.editarCliente(id, normalizados, connection));
  });
}

export function alterarSituacaoCliente(id, ativo) {
  return gravar(async (connection) => {
    const cliente = exigirCliente(await repository.bloquearCliente(id, connection));
    if (!ativo) {
      await exigirSemMovimentacao(id, connection);
      if (cliente.vaga_cativa_id !== null) {
        throw httpError(409, 'Remova a vaga cativa antes de inativar o cliente.', 'CLIENTE_COM_VAGA_CATIVA');
      }
    }
    return clientePublico(await repository.alterarSituacao(id, ativo, connection));
  });
}

export async function alterarVagaCativa(id, vagaId) {
  validarVagaId(vagaId);
  const inicial = exigirCliente(await repository.buscarCliente(id));
  return gravar(async (connection) => {
    // Vagas antes do cliente: mesma ordem utilizada ao inativar uma vaga.
    const ids = [...new Set([inicial.vaga_cativa_id, vagaId].filter((valor) => valor !== null))].sort((a, b) => a - b);
    const vagas = await repository.bloquearVagas(ids, connection);
    const cliente = exigirCliente(await repository.bloquearCliente(id, connection));
    if (cliente.vaga_cativa_id !== inicial.vaga_cativa_id) {
      throw httpError(409, 'A vaga cativa deste cliente foi alterada. Atualize os dados e tente novamente.', 'VAGA_CATIVA_ALTERADA');
    }
    await exigirSemMovimentacao(id, connection);
    if (vagaId !== null) {
      if (!cliente.ativo || cliente.tipo !== 'MENSALISTA') {
        throw httpError(409, 'Somente mensalistas ativos podem receber uma vaga cativa.', 'CLIENTE_NAO_ELEGIVEL');
      }
      const vaga = vagas.find((atual) => atual.id === vagaId);
      if (!vaga) throw httpError(404, 'Vaga não encontrada.', 'VAGA_NAO_ENCONTRADA');
      if (!vaga.ativa || await repository.vagaOcupada(vagaId, connection)
          || await repository.vagaVinculadaAOutroCliente(vagaId, id, connection)) {
        throw httpError(409, 'Escolha uma vaga ativa, desocupada e sem vínculo com outro cliente.', 'VAGA_INDISPONIVEL');
      }
    }
    return clientePublico(await repository.alterarVagaCativa(id, vagaId, connection));
  }, true);
}

async function bloquearEnderecos(clienteId, connection) {
  exigirCliente(await repository.bloquearCliente(clienteId, connection));
  return repository.listarEnderecos(clienteId, connection, true);
}

function exigirEndereco(enderecos, id) {
  const endereco = enderecos.find((atual) => atual.id === id);
  if (!endereco) throw httpError(404, 'Endereço não encontrado para este cliente.', 'ENDERECO_NAO_ENCONTRADO');
  return endereco;
}

export function cadastrarEndereco(clienteId, dados) {
  const normalizados = normalizarEndereco(dados);
  return gravar(async (connection) => {
    const enderecos = await bloquearEnderecos(clienteId, connection);
    return enderecoPublico(await repository.criarEndereco(clienteId, normalizados, enderecos.length === 0, connection));
  });
}

export function editarEndereco(clienteId, enderecoId, dados) {
  if (!Object.keys(dados).length) throw httpError(400, 'Informe os dados do endereço a alterar.', 'DADOS_CLIENTE_INVALIDOS');
  return gravar(async (connection) => {
    const enderecos = await bloquearEnderecos(clienteId, connection);
    const anterior = exigirEndereco(enderecos, enderecoId);
    return enderecoPublico(await repository.editarEndereco(enderecoId, clienteId, normalizarEndereco({ ...anterior, ...dados }), connection));
  });
}

export function definirEnderecoPrincipal(clienteId, enderecoId) {
  return gravar(async (connection) => {
    const enderecos = await bloquearEnderecos(clienteId, connection);
    exigirEndereco(enderecos, enderecoId);
    return enderecoPublico(await repository.definirPrincipal(enderecoId, clienteId, connection));
  });
}

export function removerEndereco(clienteId, enderecoId) {
  return gravar(async (connection) => {
    const enderecos = await bloquearEnderecos(clienteId, connection);
    const removido = exigirEndereco(enderecos, enderecoId);
    await repository.removerEndereco(enderecoId, clienteId, connection);
    const restante = enderecos.find((atual) => atual.id !== enderecoId);
    if (removido.principal && restante) await repository.definirPrincipal(restante.id, clienteId, connection);
  });
}
