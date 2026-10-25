import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ACCESS_TOKEN_SECONDS, SESSION_SECONDS } from '../../config/auth.js';
import { withTransaction } from '../../config/database.js';
import { httpError } from '../../utils/http-error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import * as repository from './auth.repository.js';

export function usuarioPublico(usuario) {
  return { id: usuario.id, nome: usuario.nome, login: usuario.login, perfil: usuario.perfil };
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function mesmoHash(stored, supplied) {
  return typeof stored === 'string' && stored.length === supplied.length
    && timingSafeEqual(Buffer.from(stored), Buffer.from(supplied));
}

function sessaoInvalida() {
  return httpError(401, 'Sessão expirada ou inválida. Faça login novamente.', 'SESSAO_INVALIDA');
}

export async function criarAuthService(jwt) {
  // A senha de um login inexistente também passa pela verificação Argon2id.
  const dummyHash = await hashPassword(randomBytes(32).toString('hex'));

  function emitirTokens(usuario, sessao, refreshToken) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = Math.min(
      ACCESS_TOKEN_SECONDS, Math.floor(sessao.refresh_expira_em.getTime() / 1000) - now,
    );
    if (expiresIn <= 0) throw sessaoInvalida();

    return {
      refreshToken,
      expiraEm: sessao.refresh_expira_em,
      resposta: {
        access_token: jwt.sign({ sub: String(usuario.id), sessao_versao: sessao.sessao_versao }, {
          expiresIn,
        }),
        expires_in: expiresIn,
        usuario: usuarioPublico(usuario),
      },
    };
  }

  return {
    async alterarSenha(usuarioId, versaoSessao, { senha_atual: senhaAtual, nova_senha: novaSenha }) {
      await withTransaction(async (connection) => {
        const usuario = await repository.bloquearUsuario(usuarioId, connection);
        const sessao = await repository.bloquearSessao(usuarioId, connection);
        if (!usuario?.ativo || !sessao?.vigente || !sessao.refresh_token_hash
            || sessao.sessao_versao !== versaoSessao) {
          throw sessaoInvalida();
        }

        if (!await verifyPassword(usuario.senha_hash, senhaAtual)) {
          throw httpError(400, 'A senha atual está incorreta.', 'SENHA_ATUAL_INVALIDA');
        }

        const senhaHash = await hashPassword(novaSenha);
        await repository.atualizarSenha(usuarioId, senhaHash, connection);
        await repository.revogarSessao(usuarioId, connection);
      });
    },

    async login(login, senha) {
      const usuario = await repository.buscarUsuarioPorLogin(login.trim());
      const senhaValida = await verifyPassword(usuario?.senha_hash ?? dummyHash, senha);
      if (!usuario?.ativo || !senhaValida) {
        throw httpError(401, 'Login ou senha inválidos.', 'CREDENCIAIS_INVALIDAS');
      }

      return withTransaction(async (connection) => {
        const atual = await repository.bloquearUsuario(usuario.id, connection);
        if (!atual?.ativo || atual.senha_hash !== usuario.senha_hash) {
          throw httpError(401, 'Login ou senha inválidos.', 'CREDENCIAIS_INVALIDAS');
        }
        const refreshToken = randomBytes(32).toString('base64url');
        const expiraEm = new Date(Date.now() + SESSION_SECONDS * 1000);
        const sessao = await repository.iniciarSessao(atual.id, hashToken(refreshToken), expiraEm, connection);
        return emitirTokens(atual, sessao, refreshToken);
      });
    },

    async refresh(token) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw sessaoInvalida();
      const hash = hashToken(token);
      const identificador = await repository.buscarSessaoPorHash(hash);
      if (!identificador) throw sessaoInvalida();

      return withTransaction(async (connection) => {
        // Login, renovação e logout bloqueiam primeiro o usuário, depois a sessão.
        const usuario = await repository.bloquearUsuario(identificador.usuario_id, connection);
        const sessao = await repository.bloquearSessao(identificador.usuario_id, connection);
        if (!usuario?.ativo || !sessao?.vigente || !mesmoHash(sessao.refresh_token_hash, hash)) {
          throw sessaoInvalida();
        }
        const refreshToken = randomBytes(32).toString('base64url');
        await repository.atualizarRefresh(usuario.id, hashToken(refreshToken), connection);
        return emitirTokens(usuario, sessao, refreshToken);
      });
    },

    async logout(token) {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
      const hash = hashToken(token);
      const identificador = await repository.buscarSessaoPorHash(hash);
      if (!identificador) return;

      await withTransaction(async (connection) => {
        await repository.bloquearUsuario(identificador.usuario_id, connection);
        const sessao = await repository.bloquearSessao(identificador.usuario_id, connection);
        if (sessao && mesmoHash(sessao.refresh_token_hash, hash)) {
          await repository.revogarSessao(identificador.usuario_id, connection);
        }
      });
    },
  };
}
