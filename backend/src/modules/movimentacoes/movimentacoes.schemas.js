const id = { type: 'integer' };
const texto = { type: 'string' };
const textoNulo = { anyOf: [texto, { type: 'null' }] };
const tipo = { type: 'string', enum: ['HORISTA', 'MENSALISTA'] };
const vaga = {
  type: 'object', additionalProperties: false, required: ['id', 'numero'],
  properties: { id, numero: texto },
};
const movimentacao = {
  type: 'object', additionalProperties: false,
  required: ['id', 'cliente_id', 'cliente_nome', 'veiculo_id', 'placa_registrada', 'modelo', 'cor', 'tipo',
    'vaga_id', 'vaga_numero', 'entrada_em', 'saida_em', 'valor_hora_aplicado', 'valor_total', 'usuario_entrada_id', 'usuario_entrada_nome', 'usuario_saida_id', 'usuario_saida_nome'],
  properties: {
    id, cliente_id: id, cliente_nome: texto, veiculo_id: id, placa_registrada: texto,
    modelo: textoNulo, cor: textoNulo, tipo, vaga_id: id, vaga_numero: texto,
    entrada_em: texto, saida_em: textoNulo, valor_hora_aplicado: textoNulo,
    valor_total: textoNulo, usuario_entrada_id: id, usuario_entrada_nome: texto,
    usuario_saida_id: { anyOf: [id, { type: 'null' }] },
    usuario_saida_nome: textoNulo,
  },
};

export const consultarEntradaSchema = {
  querystring: {
    type: 'object', additionalProperties: false, required: ['placa'],
    properties: { placa: { type: 'string', minLength: 1, maxLength: 10 } },
  },
  response: { 200: {
    type: 'object', additionalProperties: false, required: ['veiculo', 'cliente', 'vagas_permitidas', 'valor_hora'],
    properties: {
      veiculo: {
        type: 'object', additionalProperties: false, required: ['id', 'placa', 'modelo', 'cor'],
        properties: { id, placa: texto, modelo: textoNulo, cor: textoNulo },
      },
      cliente: {
        type: 'object', additionalProperties: false, required: ['id', 'nome', 'tipo', 'vaga_cativa_id'],
        properties: { id, nome: texto, tipo, vaga_cativa_id: { anyOf: [id, { type: 'null' }] } },
      },
      vagas_permitidas: { type: 'array', items: vaga }, valor_hora: textoNulo,
    },
  } },
};
export const listarEmAbertoSchema = { response: { 200: { type: 'array', items: movimentacao } } };
export const registrarEntradaSchema = {
  body: {
    type: 'object', additionalProperties: false, required: ['veiculo_id', 'vaga_id'],
    // O serviço valida números inteiros sem coerção de strings, booleanos ou null.
    properties: { veiculo_id: {}, vaga_id: {} },
  },
  response: { 201: movimentacao },
};

const params = {
  type: 'object', required: ['id'],
  properties: { id: { type: 'integer', minimum: 1, maximum: 2147483647 } },
};
const cobranca = {
  tempo_total_segundos: { type: 'integer', minimum: 0 },
  horas_cobradas: { type: 'integer', minimum: 0 },
  valor_total: texto,
};
export const previaSaidaSchema = {
  params,
  response: { 200: {
    type: 'object', additionalProperties: false,
    required: ['movimentacao', 'saida_prevista_em', ...Object.keys(cobranca)],
    properties: { movimentacao, saida_prevista_em: texto, ...cobranca },
  } },
};
export const registrarSaidaSchema = {
  params,
  response: { 200: {
    ...movimentacao,
    required: [...movimentacao.required, 'tempo_total_segundos', 'horas_cobradas'],
    properties: { ...movimentacao.properties, ...cobranca },
  } },
};

const historica = {
  ...movimentacao, required: [...movimentacao.required, 'situacao'],
  properties: { ...movimentacao.properties, situacao: { type: 'string', enum: ['ABERTA', 'ENCERRADA'] } },
};
export const historicoSchema = {
  querystring: {
    type: 'object', additionalProperties: false,
    properties: {
      data_inicio: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
      data_fim: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
      placa: { type: 'string', minLength: 1, maxLength: 10 },
      cliente_id: { type: 'integer', minimum: 1, maximum: 2147483647 },
      situacao: { type: 'string', enum: ['ABERTA', 'ENCERRADA'] },
      pagina: { type: 'integer', minimum: 1, maximum: 2147483647, default: 1 },
    },
  },
  response: { 200: {
    type: 'object', additionalProperties: false,
    required: ['itens', 'pagina', 'por_pagina', 'total', 'total_paginas'],
    properties: {
      itens: { type: 'array', items: historica }, pagina: { type: 'integer' }, por_pagina: { type: 'integer' },
      total: { type: 'integer' }, total_paginas: { type: 'integer' },
    },
  } },
};
export const detalhesSchema = {
  params,
  response: { 200: {
    ...historica, required: [...historica.required, 'consultado_em', 'tempo_total_segundos'],
    properties: {
      ...historica.properties, consultado_em: texto,
      tempo_total_segundos: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
    },
  } },
};
