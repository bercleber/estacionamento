import { getPool } from '../../config/database.js';

export function listarUsuarios() {
  return getPool().query('SELECT id, nome, login, perfil, ativo FROM usuarios ORDER BY nome, id');
}

export function bloquearUsuarios(connection) {
  // O cadastro é pequeno: bloqueio em ordem fixa para proteger o último administrador.
  return connection.query('SELECT id, nome, login, perfil, ativo FROM usuarios ORDER BY id FOR UPDATE');
}

async function buscarUsuarioPorId(id, connection) {
  const rows = await connection.query(
    'SELECT id, nome, login, perfil, ativo FROM usuarios WHERE id = ?', [id],
  );
  return rows[0];
}

export async function editarUsuario(id, { nome, login, perfil }, connection) {
  await connection.query(
    'UPDATE usuarios SET nome = ?, login = ?, perfil = ? WHERE id = ?',
    [nome, login, perfil, id],
  );
  return buscarUsuarioPorId(id, connection);
}

export async function alterarSituacao(id, ativo, connection) {
  await connection.query('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo, id]);
  return buscarUsuarioPorId(id, connection);
}

export async function criarUsuario({ nome, login, senhaHash, perfil, criadoPor }, connection) {
  const result = await connection.query(
    `INSERT INTO usuarios (nome, login, senha_hash, perfil, ativo, criado_por)
     VALUES (?, ?, ?, ?, TRUE, ?)`,
    [nome, login, senhaHash, perfil, criadoPor],
  );
  const rows = await connection.query(
    'SELECT id, nome, login, perfil, ativo FROM usuarios WHERE id = ?', [result.insertId],
  );
  return rows[0];
}

export async function existeAdministrador(connection) {
  const rows = await connection.query(
    "SELECT id FROM usuarios WHERE perfil = 'ADMINISTRADOR' LIMIT 1 FOR UPDATE",
  );
  return rows.length > 0;
}

export async function criarPrimeiroAdministrador({ nome, login, senhaHash }, connection) {
  await connection.query(
    `INSERT INTO usuarios (nome, login, senha_hash, perfil, ativo, criado_por)
     VALUES (?, ?, ?, 'ADMINISTRADOR', TRUE, NULL)`,
    [nome, login, senhaHash],
  );
}
