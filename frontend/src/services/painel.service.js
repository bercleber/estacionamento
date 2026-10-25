import { api } from './api.js';

export function consultarPainel(options = {}) {
  return api('/painel', options);
}
