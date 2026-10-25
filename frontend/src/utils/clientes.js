export const enderecoVazio = { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' };

export function formatarCpf(valor = '') {
  return valor.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export function formatarCep(valor = '') {
  return valor.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export function formatarTelefone(valor = '') {
  const numeros = valor.replace(/\D/g, '');
  // Preserva telefones internacionais ou com extensão, já aceitos pelo sistema.
  if (valor.startsWith('+') || numeros.length > 11 || /[a-z]/i.test(valor)) return valor.slice(0, 20);
  return numeros.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4,5})(\d{4})$/, '$1-$2');
}

export function validarDadosCliente(dados) {
  const erros = {};
  if (!dados.nome.trim()) erros.nome = 'Informe o nome do cliente.';
  const cpf = dados.cpf.replace(/\D/g, '');
  if (cpf) {
    let valido = cpf.length === 11 && !/^(\d)\1{10}$/.test(cpf);
    for (let tamanho = 9; tamanho <= 10 && valido; tamanho++) {
      let soma = 0;
      for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
      valido = ((soma * 10) % 11) % 10 === Number(cpf[tamanho]);
    }
    if (cpf.length !== 11) erros.cpf = 'O CPF deve conter 11 dígitos.';
    else if (!valido) erros.cpf = 'Informe um CPF válido.';
  }
  return erros;
}

export function validarDadosVeiculo(dados) {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(dados.placa.replace(/[-\s]/g, '').toUpperCase())
    ? {} : { placa: 'Informe uma placa válida: ABC1234 ou ABC1D23.' };
}

export function validarDadosEndereco(dados) {
  const erros = {};
  if (!dados.logradouro.trim()) erros.logradouro = 'Informe o logradouro.';
  if (!dados.cidade.trim()) erros.cidade = 'Informe a cidade.';
  if (!dados.estado) erros.estado = 'Selecione a UF.';
  if (dados.cep && !/^\d{5}-?\d{3}$/.test(dados.cep)) erros.cep = 'Informe um CEP com oito dígitos.';
  return erros;
}

export function erroDoCampo(error) {
  const campos = { CPF_INVALIDO: 'cpf', CPF_DUPLICADO: 'cpf', PLACA_INVALIDA: 'placa', PLACA_DUPLICADA: 'placa', CEP_INVALIDO: 'cep', UF_INVALIDA: 'estado' };
  const campo = campos[error.codigo];
  return campo ? { [campo]: error.message } : {};
}

export function focarPrimeiroErro(form) {
  requestAnimationFrame(() => form?.querySelector('[aria-invalid="true"]')?.focus());
}
