import { useState } from 'react';
import { alterarSituacaoUsuario } from '../../services/usuarios.service.js';
import { useAuth } from '../../hooks/useAuth.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function ConfirmarSituacaoUsuario({ usuario, onFechar, onConfirmado }) {
  const { usuario: usuarioAtual } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const acao = usuario.ativo ? 'Inativar' : 'Ativar';

  async function confirmar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try {
      const salvo = await alterarSituacaoUsuario(usuario.id, !usuario.ativo);
      onConfirmado(salvo);
    } catch (error) {
      setErro([403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível alterar a situação do usuário. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`${acao} usuário`} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={confirmar} className="space-y-5" aria-busy={enviando}>
        <p>Deseja {acao.toLowerCase()} o usuário <strong className="break-words">{usuario.nome}</strong>?</p>
        <p className="text-sm text-muted">
          {usuario.ativo
            ? 'O usuário não poderá entrar no sistema e sua sessão atual será encerrada.'
            : 'O usuário poderá entrar novamente no sistema com suas credenciais.'}
        </p>
        {usuario.ativo && usuario.id === usuarioAtual.id && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">Você está inativando sua própria conta e será desconectado.</p>
        )}
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando} autoFocus>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Aplicando…' : acao}</Botao>
        </div>
      </form>
    </Modal>
  );
}
