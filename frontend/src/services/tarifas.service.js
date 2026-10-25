import { api } from './api.js';

export function consultarTarifas(options = {}) {
  return api('/tarifas', options);
}

export function salvarTarifas(dados) {
  return api('/tarifas', { method: 'PUT', body: dados });
}
