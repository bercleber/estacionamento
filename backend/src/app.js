import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { getAuthConfig } from './config/auth.js';
import { closePool } from './config/database.js';
import { autenticar } from './hooks/autenticar.js';
import { autorizar } from './hooks/autorizar.js';
import authRoutes from './modules/auth/auth.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import vagasRoutes from './modules/vagas/vagas.routes.js';
import tarifasRoutes from './modules/tarifas/tarifas.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import movimentacoesRoutes from './modules/movimentacoes/movimentacoes.routes.js';
import painelRoutes from './modules/painel/painel.routes.js';

export function buildApp() {
  const authConfig = getAuthConfig();
  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    },
  });

  app.register(cookie);
  app.register(jwt, {
    secret: authConfig.secret,
    sign: { algorithm: 'HS256' },
    verify: { algorithms: ['HS256'] },
  });
  app.register(rateLimit, { global: false });
  app.decorateRequest('usuario', null);
  app.decorate('autenticar', autenticar);
  app.decorate('autorizar', autorizar);
  app.register(authRoutes, { prefix: '/auth', authConfig });
  app.register(usuariosRoutes, { prefix: '/usuarios', authConfig });
  app.register(vagasRoutes, { prefix: '/vagas' });
  app.register(tarifasRoutes, { prefix: '/tarifas' });
  app.register(clientesRoutes, { prefix: '/clientes' });
  app.register(movimentacoesRoutes, { prefix: '/movimentacoes' });
  app.register(painelRoutes, { prefix: '/painel' });

  app.get('/health', async () => ({ status: 'ok' }));

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ mensagem: 'Rota não encontrada.' });
  });

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({ mensagem: 'Dados inválidos.' });
    }

    const statusCode = error.statusCode >= 400 && error.statusCode < 500
      ? error.statusCode
      : 500;

    if (statusCode === 500) {
      request.log.error(error);
    }

    return reply.code(statusCode).send({
      mensagem: statusCode === 500 ? 'Erro interno do servidor.' : error.message,
      ...(statusCode < 500 && error.code ? { codigo: error.code } : {}),
    });
  });

  app.addHook('onClose', closePool);

  return app;
}
