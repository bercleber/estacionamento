import { api } from './api.js';

export function listarUsuarios(options = {}) {
  return api('/usuarios', options);
}

export function cadastrarUsuario(dados) {
  return api('/usuarios', { method: 'POST', body: dados });
}

export function editarUsuario(id, dados) {
  return api(`/usuarios/${id}`, { method: 'PATCH', body: dados });
}

export function alterarSituacaoUsuario(id, ativo) {
  return api(`/usuarios/${id}/situacao`, { method: 'PATCH', body: { ativo } });
}
