import { consultarTarifasSchema, salvarTarifasSchema } from './tarifas.schemas.js';
import { consultarTarifas, salvarTarifas } from './tarifas.service.js';

export default async function tarifasRoutes(app) {
  app.addHook('onRequest', app.autenticar);
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  app.get('/', { schema: consultarTarifasSchema }, async () => consultarTarifas());

  app.put('/', {
    schema: salvarTarifasSchema,
    onRequest: app.autorizar('ADMINISTRADOR', 'GERENTE'),
  }, async (request, reply) => {
    const { tarifa, cadastrada } = await salvarTarifas(request.body, request.usuario.id);
    return reply.code(cadastrada ? 201 : 200).send(tarifa);
  });
}
