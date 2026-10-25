import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import Botao from '../ui/Botao.jsx';
import CampoSenha from '../ui/CampoSenha.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

const valoresIniciais = { atual: '', nova: '', confirmacao: '' };

export default function FormularioSenha({ onFechar }) {
  const { alterarSenha } = useAuth();
  const navigate = useNavigate();
  const [dados, setDados] = useState(valoresIniciais);
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
    if (dados.nova !== dados.confirmacao) {
      setErro('A confirmação da nova senha não confere.');
      return;
    }

    setEnviando(true);
    try {
      await alterarSenha(dados.atual, dados.nova);
      setDados(valoresIniciais);
      navigate('/login', { replace: true, state: { senhaAlterada: true } });
    } catch (error) {
      setErro(error.status === 429 ? 'Muitas tentativas. Aguarde um minuto e tente novamente.'
        : [400, 403].includes(error.status) ? error.message
          : 'Não foi possível alterar a senha. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo="Alterar senha" onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="sr-only">Alteração da própria senha</legend>
          <CampoSenha label="Senha atual" name="atual" value={dados.atual} onChange={alterar}
            autoComplete="current-password" maxLength={128} required autoFocus />
          <CampoSenha label="Nova senha" name="nova" value={dados.nova} onChange={alterar}
            autoComplete="new-password" minLength={8} maxLength={128} required />
          <CampoSenha label="Confirmar nova senha" name="confirmacao" value={dados.confirmacao} onChange={alterar}
            autoComplete="new-password" minLength={8} maxLength={128} required />
          <p className="text-sm text-muted">A nova senha deve ter entre 8 e 128 caracteres. Após salvar, você precisará entrar novamente.</p>
        </fieldset>
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar nova senha'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
