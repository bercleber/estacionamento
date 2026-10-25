import { REFRESH_COOKIE } from '../../config/auth.js';
import { httpError } from '../../utils/http-error.js';
import { criarAuthService } from './auth.service.js';
import { loginSchema, refreshSchema, meSchema, alterarSenhaSchema } from './auth.schemas.js';

export default async function authRoutes(app, { authConfig }) {
  const service = await criarAuthService(app.jwt);

  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  async function validarOrigem(request) {
    if (!authConfig.origins.includes(request.headers.origin)) {
      throw httpError(403, 'Origem da requisição não permitida.', 'ORIGEM_INVALIDA');
    }
  }

  function responderTokens(reply, resultado) {
    const maxAge = Math.max(0, Math.floor((resultado.expiraEm.getTime() - Date.now()) / 1000));
    reply.setCookie(REFRESH_COOKIE, resultado.refreshToken, {
      ...authConfig.cookie, maxAge, expires: resultado.expiraEm,
    });
    return resultado.resposta;
  }

  app.post('/login', {
    schema: loginSchema,
    onRequest: validarOrigem,
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    return responderTokens(reply, await service.login(request.body.login, request.body.senha));
  });

  app.post('/refresh', {
    schema: refreshSchema,
    onRequest: validarOrigem,
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    try {
      return responderTokens(reply, await service.refresh(request.cookies[REFRESH_COOKIE]));
    } catch (error) {
      if (error.statusCode === 401) reply.clearCookie(REFRESH_COOKIE, authConfig.cookie);
      throw error;
    }
  });

  app.post('/logout', { onRequest: validarOrigem }, async (request, reply) => {
    await service.logout(request.cookies[REFRESH_COOKIE]);
    reply.clearCookie(REFRESH_COOKIE, authConfig.cookie);
    return reply.code(204).send();
  });

  app.get('/me', { schema: meSchema, onRequest: app.autenticar }, async (request) => request.usuario);

  app.patch('/senha', {
    schema: alterarSenhaSchema,
    onRequest: [validarOrigem, app.autenticar],
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    await service.alterarSenha(request.usuario.id, request.user.sessao_versao, request.body);
    reply.clearCookie(REFRESH_COOKIE, authConfig.cookie);
    return reply.code(204).send();
  });
}
