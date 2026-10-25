import { httpError } from '../../utils/http-error.js';
import * as schemas from './movimentacoes.schemas.js';
import * as service from './movimentacoes.service.js';

export default async function movimentacoesRoutes(app) {
  app.addHook('onRequest', app.autenticar);
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  app.get('/consulta-entrada', { schema: schemas.consultarEntradaSchema }, async (request) => service.consultarEntrada(request.query.placa));
  app.get('/em-aberto', { schema: schemas.listarEmAbertoSchema }, async () => service.listarEmAberto());
  app.get('/historico', { schema: schemas.historicoSchema }, async (request) => service.listarHistorico(request.query));
  app.get('/:id', { schema: schemas.detalhesSchema }, async (request) => service.consultarDetalhes(request.params.id));
  app.get('/:id/previa-saida', { schema: schemas.previaSaidaSchema }, async (request) => service.consultarPreviaSaida(request.params.id));
  app.post('/:id/saida', {
    schema: schemas.registrarSaidaSchema,
    preValidation: async (request) => {
      const body = request.body;
      if (body !== undefined && (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 0)) {
        throw httpError(400, 'A saída não recebe valores, horários ou operador. Os dados são definidos pelo sistema.', 'DADOS_SAIDA_INVALIDOS');
      }
    },
  }, async (request) => service.registrarSaida(request.params.id, request.usuario.id));
  app.post('/entradas', {
    schema: schemas.registrarEntradaSchema,
    preValidation: async (request) => {
      if (request.body && Object.keys(request.body).some((campo) => !['veiculo_id', 'vaga_id'].includes(campo))) {
        throw httpError(400, 'Informe somente o veículo e a vaga. Os demais dados são definidos pelo sistema.', 'DADOS_ENTRADA_INVALIDOS');
      }
    },
  }, async (request, reply) => {
    const movimentacao = await service.registrarEntrada(request.body, request.usuario.id);
    return reply.code(201).send(movimentacao);
  });
}
