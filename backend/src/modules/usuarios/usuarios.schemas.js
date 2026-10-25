const perfis = ['ADMINISTRADOR', 'GERENTE', 'OPERADOR'];

const usuario = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'nome', 'login', 'perfil', 'ativo'],
  properties: {
    id: { type: 'integer' },
    nome: { type: 'string' },
    login: { type: 'string' },
    perfil: { type: 'string', enum: perfis },
    ativo: { type: 'boolean' },
  },
};

export const listarUsuariosSchema = {
  response: { 200: { type: 'array', items: usuario } },
};

export const criarUsuarioSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['nome', 'login', 'senha', 'perfil'],
    properties: {
      nome: { type: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
      login: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      senha: { type: 'string', minLength: 8, maxLength: 128 },
      perfil: { type: 'string', enum: perfis },
    },
  },
  response: { 201: usuario },
};

const params = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1, maximum: 2147483647 } },
};

export const editarUsuarioSchema = {
  params,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['nome', 'login', 'perfil'],
    properties: {
      nome: { type: 'string', minLength: 1, maxLength: 150, pattern: '\\S' },
      login: { type: 'string', minLength: 1, maxLength: 100, pattern: '\\S' },
      perfil: { type: 'string', enum: perfis },
    },
  },
  response: { 200: usuario },
};

export const alterarSituacaoSchema = {
  params,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['ativo'],
    // Enum sem coerção: null, números e strings não podem provocar uma inativação.
    properties: { ativo: { enum: [true, false] } },
  },
  response: { 200: usuario },
};
