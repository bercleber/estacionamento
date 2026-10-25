import { api } from './api.js';

export function consultarEntrada(placa, options = {}) {
  return api(`/movimentacoes/consulta-entrada?${new URLSearchParams({ placa })}`, options);
}

export function registrarEntrada(dados) {
  return api('/movimentacoes/entradas', { method: 'POST', body: dados });
}

export function listarEmAberto(options = {}) {
  return api('/movimentacoes/em-aberto', options);
}

export function consultarPreviaSaida(id, options = {}) {
  return api(`/movimentacoes/${id}/previa-saida`, options);
}

export function registrarSaida(id) {
  return api(`/movimentacoes/${id}/saida`, { method: 'POST' });
}

export function listarHistorico(filtros, options = {}) {
  const params = new URLSearchParams();
  for (const [campo, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== undefined && valor !== null) params.set(campo, String(valor));
  }
  return api(`/movimentacoes/historico?${params}`, options);
}

export function consultarMovimentacao(id, options = {}) {
  return api(`/movimentacoes/${id}`, options);
}
