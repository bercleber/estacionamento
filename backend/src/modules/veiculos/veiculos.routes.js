import * as schemas from './veiculos.schemas.js';
import * as service from './veiculos.service.js';

// Registrado dentro de /clientes, herdando autenticação e os cabeçalhos do módulo.
export default async function veiculosRoutes(app) {
  app.get('/:id/veiculos', { schema: schemas.listarVeiculosSchema }, async (request) => service.listarVeiculos(request.params.id));
  app.post('/:id/veiculos', { schema: schemas.criarVeiculoSchema }, async (request, reply) => {
    return reply.code(201).send(await service.cadastrarVeiculo(request.params.id, request.body, request.usuario.id));
  });
  app.patch('/:id/veiculos/:veiculoId', { schema: schemas.editarVeiculoSchema }, async (request) => {
    return service.editarVeiculo(request.params.id, request.params.veiculoId, request.body);
  });
  app.patch('/:id/veiculos/:veiculoId/situacao', {
    schema: schemas.situacaoVeiculoSchema, onRequest: app.autorizar('ADMINISTRADOR', 'GERENTE'),
  }, async (request) => service.alterarSituacaoVeiculo(request.params.id, request.params.veiculoId, request.body.ativo));
}
