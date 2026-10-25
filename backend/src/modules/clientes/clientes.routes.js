import * as schemas from './clientes.schemas.js';
import * as service from './clientes.service.js';
import veiculosRoutes from '../veiculos/veiculos.routes.js';

export default async function clientesRoutes(app) {
  app.addHook('onRequest', app.autenticar);
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });
  const gerenciar = app.autorizar('ADMINISTRADOR', 'GERENTE');
  app.register(veiculosRoutes);

  app.get('/', { schema: schemas.listarClientesSchema }, async (request) => service.listarClientes(request.query));
  app.get('/:id', { schema: schemas.consultarClienteSchema }, async (request) => service.consultarCliente(request.params.id));
  app.post('/', { schema: schemas.criarClienteSchema }, async (request, reply) => {
    return reply.code(201).send(await service.cadastrarCliente(request.body, request.usuario.id));
  });
  app.patch('/:id', { schema: schemas.editarClienteSchema }, async (request) => service.editarCliente(request.params.id, request.body));
  app.patch('/:id/situacao', { schema: schemas.situacaoClienteSchema, onRequest: gerenciar }, async (request) => {
    return service.alterarSituacaoCliente(request.params.id, request.body.ativo);
  });
  app.patch('/:id/vaga-cativa', { schema: schemas.vagaCativaSchema, onRequest: gerenciar }, async (request) => {
    return service.alterarVagaCativa(request.params.id, request.body.vaga_cativa_id);
  });
  app.post('/:id/enderecos', { schema: schemas.criarEnderecoSchema }, async (request, reply) => {
    return reply.code(201).send(await service.cadastrarEndereco(request.params.id, request.body));
  });
  app.patch('/:id/enderecos/:enderecoId', { schema: schemas.editarEnderecoSchema }, async (request) => {
    return service.editarEndereco(request.params.id, request.params.enderecoId, request.body);
  });
  app.patch('/:id/enderecos/:enderecoId/principal', { schema: schemas.principalEnderecoSchema }, async (request) => {
    return service.definirEnderecoPrincipal(request.params.id, request.params.enderecoId);
  });
  app.delete('/:id/enderecos/:enderecoId', { schema: schemas.removerEnderecoSchema }, async (request, reply) => {
    await service.removerEndereco(request.params.id, request.params.enderecoId);
    return reply.code(204).send();
  });
}
