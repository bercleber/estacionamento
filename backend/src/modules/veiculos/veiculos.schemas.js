const id = { type: 'integer', minimum: 1, maximum: 2147483647 };
const params = { type: 'object', required: ['id'], properties: { id } };
const veiculoParams = { type: 'object', required: ['id', 'veiculoId'], properties: { id, veiculoId: id } };
const textoNulo = { anyOf: [{ type: 'string' }, { type: 'null' }] };

export const veiculoSchema = {
  type: 'object', additionalProperties: false,
  required: ['id', 'cliente_id', 'cliente_nome', 'cliente_ativo', 'placa', 'modelo', 'cor', 'ativo'],
  properties: {
    id, cliente_id: id, cliente_nome: { type: 'string' }, cliente_ativo: { type: 'boolean' },
    placa: { type: 'string' }, modelo: textoNulo, cor: textoNulo, ativo: { type: 'boolean' },
  },
};

// A validação dos textos no serviço preserva seus tipos, sem coerção do AJV.
export const veiculoBody = {
  type: 'object', additionalProperties: false, properties: { placa: {}, modelo: {}, cor: {} },
};
export const criarVeiculoBody = { ...veiculoBody, required: ['placa'] };
export const listarVeiculosSchema = { params, response: { 200: { type: 'array', items: veiculoSchema } } };
export const criarVeiculoSchema = { params, body: criarVeiculoBody, response: { 201: veiculoSchema } };
export const editarVeiculoSchema = {
  params: veiculoParams, body: { ...veiculoBody, minProperties: 1 }, response: { 200: veiculoSchema },
};
export const situacaoVeiculoSchema = {
  params: veiculoParams,
  body: { type: 'object', additionalProperties: false, required: ['ativo'], properties: { ativo: { enum: [true, false] } } },
  response: { 200: veiculoSchema },
};
