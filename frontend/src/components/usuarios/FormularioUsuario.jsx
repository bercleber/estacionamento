import { useState } from 'react';
import { cadastrarUsuario, editarUsuario } from '../../services/usuarios.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import { nomesPerfis } from '../../utils/perfis.js';
import Botao from '../ui/Botao.jsx';
import Campo from '../ui/Campo.jsx';
import CampoSenha from '../ui/CampoSenha.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';
import Select from '../ui/Select.jsx';

const valoresIniciais = { nome: '', login: '', perfil: 'OPERADOR', senha: '', confirmacao: '' };

export default function FormularioUsuario({ usuario = null, onFechar, onSalvo }) {
  const { usuario: usuarioAtual } = useAuth();
  const editando = Boolean(usuario);
  const [dados, setDados] = useState(() => ({
    ...valoresIniciais,
    ...(usuario ? { nome: usuario.nome, login: usuario.login, perfil: usuario.perfil } : {}),
  }));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atuais) => ({ ...atuais, [name]: value }));
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setErro('');
    if (!dados.nome.trim() || !dados.login.trim()) {
      setErro('Preencha o nome e o login.');
      return;
    }
    if (!editando && dados.senha !== dados.confirmacao) {
      setErro('A confirmação da senha não confere.');
      return;
    }

    setEnviando(true);
    try {
      const alteracoes = { nome: dados.nome.trim(), login: dados.login.trim(), perfil: dados.perfil };
      const salvo = editando
        ? await editarUsuario(usuario.id, alteracoes)
        : await cadastrarUsuario({ ...alteracoes, senha: dados.senha });
      setDados(valoresIniciais);
      onSalvo(salvo);
    } catch (error) {
      setErro([403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível salvar o usuário. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={editando ? 'Editar usuário' : 'Novo usuário'} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="sr-only">Dados do usuário</legend>
          <Campo label="Nome" name="nome" value={dados.nome} onChange={alterar}
            autoComplete="name" maxLength={150} required autoFocus />
          <Campo label="Login" name="login" value={dados.login} onChange={alterar}
            autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={100} required />
          <Select label="Perfil" name="perfil" value={dados.perfil} onChange={alterar} required>
            {Object.entries(nomesPerfis).map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
          </Select>
          {!editando && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <CampoSenha label="Senha" name="senha" value={dados.senha} onChange={alterar}
                  autoComplete="new-password" minLength={8} maxLength={128} required />
                <CampoSenha label="Confirmar senha" name="confirmacao" value={dados.confirmacao} onChange={alterar}
                  autoComplete="new-password" minLength={8} maxLength={128} required />
              </div>
              <p className="text-sm text-slate-500">A senha deve ter entre 8 e 128 caracteres.</p>
            </>
          )}
          {editando && usuario.id === usuarioAtual.id && dados.perfil !== usuarioAtual.perfil && (
            <p className="text-sm text-amber-800">Ao alterar seu próprio perfil, sua sessão será encerrada e será necessário entrar novamente.</p>
          )}
        </fieldset>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Cadastrar usuário'}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
