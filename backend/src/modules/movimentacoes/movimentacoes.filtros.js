import { httpError } from '../../utils/http-error.js';
import { inicioDia, validarData } from '../../utils/datas.js';
import { normalizarVeiculo } from '../veiculos/veiculos.validation.js';

export function normalizarFiltrosHistorico(query) {
  const { data_inicio: inicio, data_fim: fim } = query;
  if (inicio !== undefined) validarData(inicio);
  if (fim !== undefined) validarData(fim);
  if (inicio !== undefined && fim !== undefined && inicio > fim) {
    throw httpError(400, 'A data inicial não pode ser posterior à data final.', 'PERIODO_INVALIDO');
  }
  let fimExclusivo;
  if (fim !== undefined && fim !== '9999-12-31') {
    const diaSeguinte = new Date(validarData(fim));
    diaSeguinte.setUTCDate(diaSeguinte.getUTCDate() + 1);
    fimExclusivo = inicioDia(diaSeguinte.toISOString().slice(0, 10));
  }
  const pagina = query.pagina ?? 1;
  return {
    inicio: inicio === undefined ? undefined : inicioDia(inicio),
    fimExclusivo,
    placa: query.placa === undefined ? undefined : normalizarVeiculo({ placa: query.placa }).placa,
    clienteId: query.cliente_id,
    situacao: query.situacao,
    pagina,
    porPagina: 20,
    offset: (pagina - 1) * 20,
  };
}
