import { withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/http-error.js';
import * as repository from './tarifas.repository.js';

function normalizarValor(valor, campo) {
  if (typeof valor !== 'string' || valor.trim() !== valor
      || !/^[0-9]{1,8}(?:\.[0-9]{1,2})?$/.test(valor)) {
    throw httpError(400,
      `${campo} deve ser uma string decimal entre 0.00 e 99999999.99, com até duas casas decimais.`,
      'VALOR_TARIFA_INVALIDO');
  }
  const [inteiro, centavos = ''] = valor.split('.');
  return `${inteiro.replace(/^0+(?=\d)/, '')}.${centavos.padEnd(2, '0')}`;
}

export function consultarTarifas() {
  return repository.consultarTarifas();
}

export async function salvarTarifas(dados, criadoPor) {
  const valores = {
    valor_hora: normalizarValor(dados.valor_hora, 'O valor por hora'),
    valor_mes: normalizarValor(dados.valor_mes, 'O valor mensal'),
  };

  try {
    return await withTransaction(async (connection) => ({
      tarifa: await repository.criarTarifas(valores, criadoPor, connection),
      cadastrada: true,
    }));
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
  }

  // A tentativa de inserção já foi revertida, liberando o bloqueio antes da atualização.
  // Mesmo no primeiro cadastro simultâneo, somente uma requisição retorna 201.
  return withTransaction(async (connection) => ({
    tarifa: await repository.atualizarTarifas(valores, connection),
    cadastrada: false,
  }));
}
