import { consultarPainelSchema } from './painel.schemas.js';
import { consultarPainel } from './painel.service.js';

export default async function painelRoutes(app) {
  app.addHook('onRequest', app.autenticar);
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });
  app.get('/', { schema: consultarPainelSchema }, async (request) => consultarPainel(request.usuario.perfil));
}
