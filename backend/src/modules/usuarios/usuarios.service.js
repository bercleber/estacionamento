import { withTransaction } from '../../config/database.js';
import { hashPassword } from '../../utils/password.js';
import { httpError } from '../../utils/http-error.js';
import { revogarSessao } from '../auth/auth.repository.js';
import * as repository from './usuarios.repository.js';

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    ativo: Boolean(usuario.ativo),
  };
}

export async function listarUsuarios() {
  return (await repository.listarUsuarios()).map(usuarioPublico);
}

export async function cadastrarUsuario({ nome, login, senha, perfil }, criadoPor) {
  const senhaHash = await hashPassword(senha);
  return executarGravacao(async (connection) => {
    const usuario = await repository.criarUsuario({
      nome: nome.trim(), login: login.trim(), senhaHash, perfil, criadoPor,
    }, connection);
    return usuarioPublico(usuario);
  });
}

async function executarGravacao(operation) {
  try {
    return await withTransaction(operation);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw httpError(409, 'Este login já está cadastrado. Informe outro login.', 'LOGIN_DUPLICADO');
    }
    throw error;
  }
}

function validarAlteracao(usuarios, id, administradorId, alteracoes) {
  const administrador = usuarios.find((usuario) => usuario.id === administradorId);
  if (!administrador?.ativo || administrador.perfil !== 'ADMINISTRADOR') {
    throw httpError(403, 'Você não tem permissão para esta operação.', 'ACESSO_NEGADO');
  }

  const usuario = usuarios.find((atual) => atual.id === id);
  if (!usuario) throw httpError(404, 'Usuário não encontrado.', 'USUARIO_NAO_ENCONTRADO');

  const novoPerfil = alteracoes.perfil ?? usuario.perfil;
  const novoAtivo = alteracoes.ativo ?? Boolean(usuario.ativo);
  const administradoresAtivos = usuarios.filter((atual) => atual.ativo && atual.perfil === 'ADMINISTRADOR');
  if (usuario.ativo && usuario.perfil === 'ADMINISTRADOR'
      && (!novoAtivo || novoPerfil !== 'ADMINISTRADOR') && administradoresAtivos.length <= 1) {
    throw httpError(409, 'É necessário manter pelo menos um administrador ativo.', 'ULTIMO_ADMINISTRADOR');
  }
  return usuario;
}

export function editarUsuario(id, { nome, login, perfil }, administradorId) {
  return executarGravacao(async (connection) => {
    const usuarios = await repository.bloquearUsuarios(connection);
    const anterior = validarAlteracao(usuarios, id, administradorId, { perfil });
    const usuario = await repository.editarUsuario(id, { nome: nome.trim(), login: login.trim(), perfil }, connection);
    if (anterior.perfil !== usuario.perfil) await revogarSessao(id, connection);
    return usuarioPublico(usuario);
  });
}

export function alterarSituacaoUsuario(id, ativo, administradorId) {
  return executarGravacao(async (connection) => {
    const usuarios = await repository.bloquearUsuarios(connection);
    const anterior = validarAlteracao(usuarios, id, administradorId, { ativo });
    const usuario = await repository.alterarSituacao(id, ativo, connection);
    if (anterior.ativo && !ativo) await revogarSessao(id, connection);
    return usuarioPublico(usuario);
  });
}
