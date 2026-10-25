import { api, configurarAutenticacao, definirAccessToken } from './api.js';

let sessao = null;
let renovacao;
let versao = 0;
let fila = Promise.resolve();
const ouvintes = new Set();

function publicar(resultado) {
  sessao = resultado;
  definirAccessToken(resultado?.access_token ?? null);
  for (const ouvinte of ouvintes) ouvinte(resultado?.usuario ?? null);
}

function serializar(operacao) {
  // Evita a disputa pelo cookie rotativo entre abas quando Web Locks está disponível.
  const proxima = fila.then(() => globalThis.navigator?.locks
    ? navigator.locks.request('estacionamento-auth', operacao) : operacao());
  fila = proxima.catch(() => {});
  return proxima;
}

export function obterUsuario() {
  return sessao?.usuario ?? null;
}

export function observarSessao(ouvinte) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function atualizarUsuario(usuario) {
  if (sessao?.usuario.id !== usuario.id) return;
  const { id, nome, login, perfil } = usuario;
  publicar({ ...sessao, usuario: { id, nome, login, perfil } });
}

export function limparSessao() {
  ++versao;
  publicar(null);
}

export function renovarSessao() {
  if (renovacao) return renovacao;
  const versaoInicial = versao;

  renovacao = serializar(() => api('/auth/refresh', { method: 'POST', autenticada: false }))
    .then((resultado) => {
      if (versao === versaoInicial) publicar(resultado);
      return resultado;
    })
    .catch((error) => {
      if (error.status === 401 && versao === versaoInicial) publicar(null);
      throw error;
    })
    .finally(() => { renovacao = undefined; });

  return renovacao;
}

export async function restaurarSessao() {
  try {
    await renovarSessao();
  } catch (error) {
    if (error.status !== 401) throw error;
  }
}

export async function entrar(login, senha) {
  const atual = ++versao;
  const resultado = await serializar(() => api('/auth/login', {
    method: 'POST', body: { login: login.trim(), senha }, autenticada: false,
  }));
  if (versao === atual) publicar(resultado);
}

export async function sair() {
  ++versao;
  await serializar(() => api('/auth/logout', { method: 'POST', autenticada: false }));
  publicar(null);
}

export async function alterarSenha(senhaAtual, novaSenha) {
  await api('/auth/senha', {
    method: 'PATCH', body: { senha_atual: senhaAtual, nova_senha: novaSenha },
  });
  limparSessao();
}

configurarAutenticacao({
  renovar: renovarSessao,
  expirar: limparSessao,
});
