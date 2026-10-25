const tarifa = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'valor_hora', 'valor_mes'],
  properties: {
    id: { type: 'integer' },
    valor_hora: { type: 'string' },
    valor_mes: { type: 'string' },
  },
};

export const consultarTarifasSchema = {
  response: { 200: { anyOf: [tarifa, { type: 'null' }] } },
};

export const salvarTarifasSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['valor_hora', 'valor_mes'],
    // O serviço valida tipo e formato sem permitir a coerção de números para strings pelo AJV.
    properties: { valor_hora: {}, valor_mes: {} },
  },
  response: { 200: tarifa, 201: tarifa },
};
