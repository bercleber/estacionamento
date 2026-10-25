import { buscarSessaoAutenticada } from '../modules/auth/auth.repository.js';
import { usuarioPublico } from '../modules/auth/auth.service.js';
import { httpError } from '../utils/http-error.js';

export async function autenticar(request) {
  try {
    await request.jwtVerify();
  } catch {
    throw httpError(401, 'Sessão expirada ou inválida. Faça login novamente.', 'SESSAO_INVALIDA');
  }

  const { sub, sessao_versao: versao } = request.user;
  if (!/^[1-9]\d*$/.test(sub) || !Number.isSafeInteger(Number(sub)) || !Number.isInteger(versao)) {
    throw httpError(401, 'Sessão inválida.', 'SESSAO_INVALIDA');
  }

  const usuario = await buscarSessaoAutenticada(Number(sub));
  if (!usuario?.ativo || !usuario.vigente || usuario.sessao_versao !== versao) {
    throw httpError(401, 'Sessão expirada ou inválida. Faça login novamente.', 'SESSAO_INVALIDA');
  }
  request.usuario = usuarioPublico(usuario);
}
