const apiUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');
let accessToken = null;
let renovarSessao;
let expirarSessao;

export function definirAccessToken(token) {
  accessToken = token;
}

export function configurarAutenticacao({ renovar, expirar }) {
  renovarSessao = renovar;
  expirarSessao = expirar;
}

export function api(path, options = {}) {
  return solicitar(path, options, false);
}

async function solicitar(path, { body, headers, autenticada = true, ...options }, repetida) {
  const requestHeaders = new Headers(headers);
  const tokenEnviado = accessToken;

  if (autenticada && tokenEnviado) requestHeaders.set('Authorization', `Bearer ${tokenEnviado}`);

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiUrl}/${path.replace(/^\/+/, '')}`, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = response.status === 204
    ? null
    : isJson ? await response.json() : await response.text();

  if (response.status === 401 && autenticada && !repetida && renovarSessao) {
    // Outra requisição pode já ter atualizado o token enquanto esta aguardava.
    if (!accessToken || accessToken === tokenEnviado) await renovarSessao();
    return solicitar(path, { body, headers, autenticada, ...options }, true);
  }

  if (!response.ok) {
    if (response.status === 401 && autenticada) expirarSessao?.();
    const error = new Error(data?.mensagem ?? 'Não foi possível concluir a solicitação.');
    error.status = response.status;
    error.codigo = data?.codigo;
    throw error;
  }

  return data;
}
