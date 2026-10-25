import { api } from './api.js';

export function listarVagas(options = {}) {
  return api('/vagas', options);
}

export function cadastrarVaga(dados) {
  return api('/vagas', { method: 'POST', body: dados });
}

export function editarVaga(id, dados) {
  return api(`/vagas/${id}`, { method: 'PATCH', body: dados });
}

export function alterarSituacaoVaga(id, ativa) {
  return api(`/vagas/${id}/situacao`, { method: 'PATCH', body: { ativa } });
}
