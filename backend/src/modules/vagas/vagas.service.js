import { withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/http-error.js';
import * as repository from './vagas.repository.js';

function vagaPublica(vaga) {
  return {
    id: vaga.id,
    numero: vaga.numero,
    ativa: Boolean(vaga.ativa),
    disponibilidade: !vaga.ativa ? 'INATIVA'
      : vaga.ocupada ? 'OCUPADA' : vaga.cativa ? 'CATIVA' : 'LIVRE',
  };
}

function normalizarNumero(numero) {
  const normalizado = numero.trim().toUpperCase();
  if (!normalizado || [...normalizado].length > 10) {
    throw httpError(400, 'Informe um número de vaga com até 10 caracteres.', 'NUMERO_VAGA_INVALIDO');
  }
  return normalizado;
}

async function executarGravacao(operation) {
  try {
    return await withTransaction(operation);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'Este número já está cadastrado, mesmo que a vaga esteja inativa.', 'VAGA_DUPLICADA');
    }
    throw error;
  }
}

async function exigirVaga(id, connection) {
  if (!await repository.bloquearVaga(id, connection)) {
    throw httpError(404, 'Vaga não encontrada.', 'VAGA_NAO_ENCONTRADA');
  }
}

export async function listarVagas() {
  return (await repository.listarVagas()).map(vagaPublica);
}

export function cadastrarVaga({ numero }, criadoPor) {
  const normalizado = normalizarNumero(numero);
  return executarGravacao(async (connection) => vagaPublica(
    await repository.criarVaga({ numero: normalizado, criadoPor }, connection),
  ));
}

export function editarVaga(id, { numero }) {
  const normalizado = normalizarNumero(numero);
  return executarGravacao(async (connection) => {
    await exigirVaga(id, connection);
    return vagaPublica(await repository.editarVaga(id, normalizado, connection));
  });
}

export function alterarSituacaoVaga(id, ativa) {
  return executarGravacao(async (connection) => {
    await exigirVaga(id, connection);
    if (!ativa) {
      if (await repository.possuiMovimentacaoAberta(id, connection)) {
        throw httpError(409, 'Não é possível inativar uma vaga com movimentação em aberto.', 'VAGA_OCUPADA');
      }
      if (await repository.possuiClienteVinculado(id, connection)) {
        throw httpError(409, 'Não é possível inativar uma vaga vinculada a um cliente.', 'VAGA_CATIVA');
      }
    }
    return vagaPublica(await repository.alterarSituacao(id, ativa, connection));
  });
}
