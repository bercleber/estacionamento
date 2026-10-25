const vaga = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'numero', 'ativa', 'disponibilidade'],
  properties: {
    id: { type: 'integer' },
    numero: { type: 'string' },
    ativa: { type: 'boolean' },
    disponibilidade: { type: 'string', enum: ['INATIVA', 'OCUPADA', 'CATIVA', 'LIVRE'] },
  },
};

const numeroBody = {
  type: 'object',
  additionalProperties: false,
  required: ['numero'],
  properties: {
    numero: { type: 'string', minLength: 1, maxLength: 10, pattern: '\\S' },
  },
};

const params = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1, maximum: 2147483647 } },
};

export const listarVagasSchema = {
  response: { 200: { type: 'array', items: vaga } },
};

export const criarVagaSchema = {
  body: numeroBody,
  response: { 201: vaga },
};

export const editarVagaSchema = {
  params,
  body: numeroBody,
  response: { 200: vaga },
};

export const alterarSituacaoSchema = {
  params,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['ativa'],
    // Sem coerção: strings, números e null não podem inativar uma vaga.
    properties: { ativa: { enum: [true, false] } },
  },
  response: { 200: vaga },
};
