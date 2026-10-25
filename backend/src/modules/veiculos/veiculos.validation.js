import { httpError } from '../../utils/http-error.js';

export function normalizarVeiculo(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw httpError(400, 'Informe o veículo do cliente.', 'VEICULO_OBRIGATORIO');
  }
  if (typeof dados.placa !== 'string') throw httpError(400, 'Informe uma placa válida.', 'PLACA_INVALIDA');
  const placa = dados.placa.replace(/[\s-]/g, '').toUpperCase();
  if (!/^[A-Z]{3}(?:[0-9]{4}|[0-9][A-Z][0-9]{2})$/.test(placa)) {
    throw httpError(400, 'Informe uma placa no formato ABC1234 ou ABC1D23.', 'PLACA_INVALIDA');
  }
  function opcional(valor, nome, limite) {
    if (valor === undefined || valor === null) return null;
    if (typeof valor !== 'string' || [...valor.trim()].length > limite) {
      throw httpError(400, `${nome} deve ter até ${limite} caracteres.`, 'DADOS_VEICULO_INVALIDOS');
    }
    return valor.trim() || null;
  }
  return { placa, modelo: opcional(dados.modelo, 'Modelo', 100), cor: opcional(dados.cor, 'Cor', 40) };
}
