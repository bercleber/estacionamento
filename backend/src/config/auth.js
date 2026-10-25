export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const SESSION_SECONDS = 8 * 60 * 60;
export const REFRESH_COOKIE = 'estacionamento_refresh';

export function getAuthConfig() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Configure JWT_SECRET no .env com pelo menos 32 caracteres aleatórios.');
  }

  const origins = (process.env.AUTH_ORIGINS ?? 'http://127.0.0.1:5173,http://127.0.0.1:4173')
    .split(',').map((origin) => origin.trim()).filter(Boolean);

  if (origins.length === 0 || origins.some((origin) => new URL(origin).origin !== origin)) {
    throw new Error('AUTH_ORIGINS deve conter origens completas, separadas por vírgula e sem barra final.');
  }

  return {
    secret,
    origins,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
      sameSite: 'strict',
      path: '/api/auth',
    },
  };
}
