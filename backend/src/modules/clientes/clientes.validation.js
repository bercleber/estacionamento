import { httpError } from '../../utils/http-error.js';

const estados = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));

function texto(valor, nome, limite, obrigatorio = false) {
  if (!obrigatorio && (valor === null || valor === undefined || valor === '')) return null;
  if (typeof valor !== 'string') throw httpError(400, `${nome} inválido.`, 'DADOS_CLIENTE_INVALIDOS');
  const normalizado = valor.trim();
  if ([...normalizado].length > limite || (obrigatorio && !normalizado)) {
    throw httpError(400, `${nome} deve ${obrigatorio ? 'ser preenchido e ' : ''}ter até ${limite} caracteres.`, 'DADOS_CLIENTE_INVALIDOS');
  }
  return normalizado || null;
}

function normalizarCpf(valor) {
  const informado = texto(valor, 'CPF', 14);
  if (informado === null) return null;
  if (!/^(?:[0-9]{11}|[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2})$/.test(informado)) {
    throw httpError(400, 'Informe um CPF válido.', 'CPF_INVALIDO');
  }
  const cpf = informado.replace(/[.-]/g, '');
  let valido = !/^([0-9])\1{10}$/.test(cpf);
  for (let tamanho = 9; tamanho <= 10; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[tamanho])) valido = false;
  }
  if (!valido) throw httpError(400, 'Informe um CPF válido.', 'CPF_INVALIDO');
  return cpf;
}

export function normalizarCliente(dados) {
  if (!['HORISTA', 'MENSALISTA'].includes(dados.tipo)) {
    throw httpError(400, 'Informe um tipo de cliente válido.', 'TIPO_CLIENTE_INVALIDO');
  }
  return {
    nome: texto(dados.nome, 'Nome', 150, true),
    cpf: normalizarCpf(dados.cpf),
    telefone: texto(dados.telefone, 'Telefone', 20),
    tipo: dados.tipo,
  };
}

export function normalizarEndereco(dados) {
  const estado = texto(dados.estado, 'UF', 2, true).toUpperCase();
  if (!estados.has(estado)) throw httpError(400, 'Informe uma UF válida.', 'UF_INVALIDA');
  const cep = texto(dados.cep, 'CEP', 9);
  if (cep !== null && !/^[0-9]{5}-?[0-9]{3}$/.test(cep)) {
    throw httpError(400, 'Informe um CEP com oito dígitos.', 'CEP_INVALIDO');
  }
  return {
    logradouro: texto(dados.logradouro, 'Logradouro', 150, true),
    numero: texto(dados.numero, 'Número', 20),
    complemento: texto(dados.complemento, 'Complemento', 100),
    bairro: texto(dados.bairro, 'Bairro', 100),
    cidade: texto(dados.cidade, 'Cidade', 100, true),
    estado,
    cep: cep?.replace('-', '') ?? null,
  };
}

export function validarVagaId(id) {
  if (id !== null && (!Number.isInteger(id) || id < 1 || id > 2147483647)) {
    throw httpError(400, 'Informe uma vaga válida ou null para remover o vínculo.', 'VAGA_INVALIDA');
  }
}
