import { REFRESH_COOKIE } from '../../config/auth.js';
import { criarUsuarioSchema, listarUsuariosSchema, editarUsuarioSchema, alterarSituacaoSchema } from './usuarios.schemas.js';
import { cadastrarUsuario, listarUsuarios, editarUsuario, alterarSituacaoUsuario } from './usuarios.service.js';

export default async function usuariosRoutes(app, { authConfig }) {
  app.addHook('onRequest', app.autenticar);
  app.addHook('onRequest', app.autorizar('ADMINISTRADOR'));
  app.addHook('onRequest', async (_request, reply) => {
    reply.header('Cache-Control', 'no-store');
  });

  app.get('/', { schema: listarUsuariosSchema }, async () => listarUsuarios());

  app.post('/', { schema: criarUsuarioSchema }, async (request, reply) => {
    const usuario = await cadastrarUsuario(request.body, request.usuario.id);
    return reply.code(201).send(usuario);
  });

  function responderAlteracao(request, reply, usuario) {
    if (usuario.id === request.usuario.id && (!usuario.ativo || usuario.perfil !== request.usuario.perfil)) {
      reply.clearCookie(REFRESH_COOKIE, authConfig.cookie);
    }
    return usuario;
  }

  app.patch('/:id', { schema: editarUsuarioSchema }, async (request, reply) => {
    const usuario = await editarUsuario(request.params.id, request.body, request.usuario.id);
    return responderAlteracao(request, reply, usuario);
  });

  app.patch('/:id/situacao', { schema: alterarSituacaoSchema }, async (request, reply) => {
    const usuario = await alterarSituacaoUsuario(request.params.id, request.body.ativo, request.usuario.id);
    return responderAlteracao(request, reply, usuario);
  });
}
