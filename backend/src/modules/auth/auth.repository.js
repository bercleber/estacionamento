import { getPool } from '../../config/database.js';

export async function buscarUsuarioPorLogin(login) {
  const rows = await getPool().query(
    'SELECT id, nome, login, perfil, ativo, senha_hash FROM usuarios WHERE login = ?',
    [login],
  );
  return rows[0];
}

export async function bloquearUsuario(id, connection) {
  const rows = await connection.query(
    'SELECT id, nome, login, perfil, ativo, senha_hash FROM usuarios WHERE id = ? FOR UPDATE',
    [id],
  );
  return rows[0];
}

export async function buscarSessaoPorHash(hash) {
  const rows = await getPool().query(
    'SELECT usuario_id FROM sessoes_usuarios WHERE refresh_token_hash = ?', [hash],
  );
  return rows[0];
}

export async function bloquearSessao(usuarioId, connection) {
  const rows = await connection.query(
    `SELECT usuario_id, refresh_token_hash, refresh_expira_em, sessao_versao,
            refresh_expira_em > CURRENT_TIMESTAMP AS vigente
       FROM sessoes_usuarios WHERE usuario_id = ? FOR UPDATE`,
    [usuarioId],
  );
  return rows[0];
}

export async function iniciarSessao(usuarioId, hash, expiraEm, connection) {
  await connection.query(
    `INSERT INTO sessoes_usuarios
       (usuario_id, refresh_token_hash, refresh_expira_em, sessao_versao)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE refresh_token_hash = VALUES(refresh_token_hash),
       refresh_expira_em = VALUES(refresh_expira_em), sessao_versao = sessao_versao + 1`,
    [usuarioId, hash, expiraEm],
  );
  return bloquearSessao(usuarioId, connection);
}

export async function atualizarRefresh(usuarioId, hash, connection) {
  await connection.query(
    'UPDATE sessoes_usuarios SET refresh_token_hash = ? WHERE usuario_id = ?',
    [hash, usuarioId],
  );
}

export async function revogarSessao(usuarioId, connection) {
  await connection.query(
    `UPDATE sessoes_usuarios SET refresh_token_hash = NULL, refresh_expira_em = NULL,
       sessao_versao = sessao_versao + 1 WHERE usuario_id = ?`,
    [usuarioId],
  );
}

export async function atualizarSenha(usuarioId, senhaHash, connection) {
  await connection.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, usuarioId]);
}

export async function buscarSessaoAutenticada(usuarioId) {
  const rows = await getPool().query(
    `SELECT u.id, u.nome, u.login, u.perfil, u.ativo, s.sessao_versao,
            s.refresh_token_hash IS NOT NULL
              AND s.refresh_expira_em > CURRENT_TIMESTAMP AS vigente
       FROM usuarios u JOIN sessoes_usuarios s ON s.usuario_id = u.id WHERE u.id = ?`,
    [usuarioId],
  );
  return rows[0];
}
