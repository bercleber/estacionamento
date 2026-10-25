import { api } from './api.js';

export function listarClientes(options = {}) {
  return api('/clientes', options);
}

export function consultarCliente(id, options = {}) {
  return api(`/clientes/${id}`, options);
}

export function cadastrarCliente(dados) {
  return api('/clientes', { method: 'POST', body: dados });
}

export function editarCliente(id, dados) {
  return api(`/clientes/${id}`, { method: 'PATCH', body: dados });
}

export function alterarSituacaoCliente(id, ativo) {
  return api(`/clientes/${id}/situacao`, { method: 'PATCH', body: { ativo } });
}

export function alterarVagaCativa(id, vagaId) {
  return api(`/clientes/${id}/vaga-cativa`, { method: 'PATCH', body: { vaga_cativa_id: vagaId } });
}

export function cadastrarEndereco(clienteId, dados) {
  return api(`/clientes/${clienteId}/enderecos`, { method: 'POST', body: dados });
}

export function editarEndereco(clienteId, enderecoId, dados) {
  return api(`/clientes/${clienteId}/enderecos/${enderecoId}`, { method: 'PATCH', body: dados });
}

export function definirEnderecoPrincipal(clienteId, enderecoId) {
  return api(`/clientes/${clienteId}/enderecos/${enderecoId}/principal`, { method: 'PATCH' });
}

export function removerEndereco(clienteId, enderecoId) {
  return api(`/clientes/${clienteId}/enderecos/${enderecoId}`, { method: 'DELETE' });
}

export function cadastrarVeiculo(clienteId, dados) {
  return api(`/clientes/${clienteId}/veiculos`, { method: 'POST', body: dados });
}

export function editarVeiculo(clienteId, veiculoId, dados) {
  return api(`/clientes/${clienteId}/veiculos/${veiculoId}`, { method: 'PATCH', body: dados });
}

export function alterarSituacaoVeiculo(clienteId, veiculoId, ativo) {
  return api(`/clientes/${clienteId}/veiculos/${veiculoId}/situacao`, { method: 'PATCH', body: { ativo } });
}
