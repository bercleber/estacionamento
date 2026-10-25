import { criarVeiculoBody, veiculoSchema } from '../veiculos/veiculos.schemas.js';

const id = { type: 'integer', minimum: 1, maximum: 2147483647 };
const params = { type: 'object', required: ['id'], properties: { id } };
const enderecoParams = { type: 'object', required: ['id', 'enderecoId'], properties: { id, enderecoId: id } };
const textoNulo = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const cliente = {
  type: 'object', additionalProperties: false,
  required: ['id', 'nome', 'cpf', 'telefone', 'tipo', 'vaga_cativa_id', 'vaga_cativa_numero', 'ativo'],
  properties: {
    id, nome: { type: 'string' }, cpf: textoNulo, telefone: textoNulo,
    tipo: { type: 'string', enum: ['HORISTA', 'MENSALISTA'] },
    vaga_cativa_id: { anyOf: [id, { type: 'null' }] }, vaga_cativa_numero: textoNulo,
    ativo: { type: 'boolean' },
  },
};
const endereco = {
  type: 'object', additionalProperties: false,
  required: ['id', 'cliente_id', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep', 'principal'],
  properties: {
    id, cliente_id: id, logradouro: { type: 'string' }, numero: textoNulo,
    complemento: textoNulo, bairro: textoNulo, cidade: { type: 'string' },
    estado: { type: 'string' }, cep: textoNulo, principal: { type: 'boolean' },
  },
};

// Tipos e limites dos textos são validados no serviço, sem coerção automática do AJV.
const clienteBody = {
  type: 'object', additionalProperties: false,
  properties: { nome: {}, cpf: {}, telefone: {}, tipo: { enum: ['HORISTA', 'MENSALISTA'] } },
};
const enderecoBody = {
  type: 'object', additionalProperties: false,
  properties: { logradouro: {}, numero: {}, complemento: {}, bairro: {}, cidade: {}, estado: {}, cep: {} },
};

export const listarClientesSchema = { response: { 200: { type: 'array', items: cliente } } };
export const consultarClienteSchema = {
  params,
  response: { 200: {
    ...cliente, required: [...cliente.required, 'enderecos', 'veiculos'],
    properties: { ...cliente.properties, enderecos: { type: 'array', items: endereco }, veiculos: { type: 'array', items: veiculoSchema } },
  } },
};
export const criarClienteSchema = {
  body: { ...clienteBody, required: ['nome', 'tipo', 'veiculo'], properties: { ...clienteBody.properties, veiculo: criarVeiculoBody } },
  response: { 201: {
    ...cliente, required: [...cliente.required, 'veiculos'],
    properties: { ...cliente.properties, veiculos: { type: 'array', items: veiculoSchema } },
  } },
};
export const editarClienteSchema = { params, body: { ...clienteBody, minProperties: 1 }, response: { 200: cliente } };
export const situacaoClienteSchema = {
  params, body: { type: 'object', additionalProperties: false, required: ['ativo'], properties: { ativo: { enum: [true, false] } } },
  response: { 200: cliente },
};
export const vagaCativaSchema = {
  params, body: { type: 'object', additionalProperties: false, required: ['vaga_cativa_id'], properties: { vaga_cativa_id: {} } },
  response: { 200: cliente },
};
export const criarEnderecoSchema = {
  params, body: { ...enderecoBody, required: ['logradouro', 'cidade', 'estado'] }, response: { 201: endereco },
};
export const editarEnderecoSchema = {
  params: enderecoParams, body: { ...enderecoBody, minProperties: 1 }, response: { 200: endereco },
};
export const principalEnderecoSchema = { params: enderecoParams, response: { 200: endereco } };
export const removerEnderecoSchema = { params: enderecoParams };
