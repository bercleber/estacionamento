import { useState } from 'react';
import { alterarSituacaoVaga } from '../../services/vagas.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function ConfirmarSituacaoVaga({ vaga, onFechar, onConfirmado }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const acao = vaga.ativa ? 'Inativar' : 'Ativar';

  async function confirmar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try {
      onConfirmado(await alterarSituacaoVaga(vaga.id, !vaga.ativa));
    } catch (error) {
      setErro([403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível alterar a situação da vaga. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`${acao} vaga`} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={confirmar} className="space-y-5" aria-busy={enviando}>
        <p>Deseja {acao.toLowerCase()} a vaga <strong className="break-words">{vaga.numero}</strong>?</p>
        <p className="text-sm text-muted">
          {vaga.ativa
            ? 'A inativação só é permitida se a vaga não tiver movimentação em aberto nem vínculo com um cliente.'
            : 'A vaga voltará a ficar disponível, preservando seu número e histórico.'}
        </p>
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando} autoFocus>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Aplicando…' : acao}</Botao>
        </div>
      </form>
    </Modal>
  );
}
