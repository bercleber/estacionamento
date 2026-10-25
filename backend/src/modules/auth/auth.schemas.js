const usuario = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'nome', 'login', 'perfil'],
  properties: {
    id: { type: 'integer' },
    nome: { type: 'string' },
    login: { type: 'string' },
    perfil: { type: 'string', enum: ['ADMINISTRADOR', 'GERENTE', 'OPERADOR'] },
  },
};

const tokens = {
  type: 'object',
  additionalProperties: false,
  required: ['access_token', 'expires_in', 'usuario'],
  properties: {
    access_token: { type: 'string' },
    expires_in: { type: 'integer' },
    usuario,
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['login', 'senha'],
    properties: {
      login: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      senha: { type: 'string', minLength: 1, maxLength: 128 },
    },
  },
  response: { 200: tokens },
};

export const refreshSchema = { response: { 200: tokens } };
export const meSchema = { response: { 200: usuario } };

export const alterarSenhaSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['senha_atual', 'nova_senha'],
    properties: {
      senha_atual: { type: 'string', minLength: 1, maxLength: 128 },
      nova_senha: { type: 'string', minLength: 8, maxLength: 128 },
    },
  },
};
