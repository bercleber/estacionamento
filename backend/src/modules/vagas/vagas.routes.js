import { criarVagaSchema, listarVagasSchema, editarVagaSchema, alterarSituacaoSchema } from './vagas.schemas.js';
import { cadastrarVaga, listarVagas, editarVaga, alterarSituacaoVaga } from './vagas.service.js';

export default async function vagasRoutes(app) {
  app.addHook('onRequest', app.autenticar);
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  const gerenciar = app.autorizar('ADMINISTRADOR', 'GERENTE');

  app.get('/', { schema: listarVagasSchema }, async () => listarVagas());

  app.post('/', { schema: criarVagaSchema, onRequest: gerenciar }, async (request, reply) => {
    const vaga = await cadastrarVaga(request.body, request.usuario.id);
    return reply.code(201).send(vaga);
  });

  app.patch('/:id', { schema: editarVagaSchema, onRequest: gerenciar }, async (request) => {
    return editarVaga(request.params.id, request.body);
  });

  app.patch('/:id/situacao', { schema: alterarSituacaoSchema, onRequest: gerenciar }, async (request) => {
    return alterarSituacaoVaga(request.params.id, request.body.ativa);
  });
}
