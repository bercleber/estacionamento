import { httpError } from '../utils/http-error.js';

export function autorizar(...perfis) {
  return async function verificarPerfil(request) {
    if (!request.usuario) throw httpError(401, 'Autenticação necessária.', 'SESSAO_INVALIDA');
    if (!perfis.includes(request.usuario.perfil)) {
      throw httpError(403, 'Você não tem permissão para esta operação.', 'ACESSO_NEGADO');
    }
  };
}
