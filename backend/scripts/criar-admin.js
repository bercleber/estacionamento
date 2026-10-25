import { input, password } from '@inquirer/prompts';
import { closePool, withTransaction } from '../src/config/database.js';
import { criarPrimeiroAdministrador, existeAdministrador } from '../src/modules/usuarios/usuarios.repository.js';
import { hashPassword } from '../src/utils/password.js';

function validarTexto(value, max) {
  return value.trim().length > 0 && value.trim().length <= max
    ? true : `Informe entre 1 e ${max} caracteres.`;
}

try {
  if (!process.stdin.isTTY) throw new Error('Execute este comando em um terminal interativo.');

  const nome = (await input({ message: 'Nome do administrador:', validate: (value) => validarTexto(value, 150) })).trim();
  const login = (await input({ message: 'Login:', validate: (value) => validarTexto(value, 100) })).trim();
  const senha = await password({
    message: 'Senha (8 a 128 caracteres):',
    mask: '*',
    validate: (value) => value.length >= 8 && value.length <= 128
      ? true : 'A senha deve ter entre 8 e 128 caracteres.',
  });
  const confirmacao = await password({ message: 'Confirme a senha:', mask: '*' });
  if (confirmacao !== senha) throw new Error('As senhas não conferem.');

  const senhaHash = await hashPassword(senha);
  await withTransaction(async (connection) => {
    if (await existeAdministrador(connection)) {
      throw new Error('Já existe um administrador. Utilize o gerenciamento de usuários.');
    }
    await criarPrimeiroAdministrador({ nome, login, senhaHash }, connection);
  });
  console.log('Administrador criado com sucesso.');
} catch (error) {
  const mensagem = error.name === 'ExitPromptError'
    ? 'Criação cancelada.'
    : error.code === 'ER_DUP_ENTRY' ? 'O login informado já está cadastrado.'
      : error.message;
  console.error(mensagem);
  process.exitCode = 1;
} finally {
  await closePool();
}
