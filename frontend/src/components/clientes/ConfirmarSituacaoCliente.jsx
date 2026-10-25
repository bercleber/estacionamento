import { useState } from 'react';
import { alterarSituacaoCliente } from '../../services/clientes.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function ConfirmarSituacaoCliente({ cliente, onFechar, onConfirmado }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const acao = cliente.ativo ? 'Inativar' : 'Ativar';

  async function confirmar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try { onConfirmado(await alterarSituacaoCliente(cliente.id, !cliente.ativo)); }
    catch (error) {
      setErro([403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível alterar a situação do cliente. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={`${acao} cliente`} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={confirmar} className="space-y-5" aria-busy={enviando}>
        <p>Deseja {acao.toLowerCase()} o cliente <strong className="break-words">{cliente.nome}</strong>?</p>
        <p className="text-sm text-slate-600">
          {cliente.ativo
            ? 'A inativação exige que o cliente esteja sem movimentação em aberto e sem vaga cativa. Seus veículos e histórico serão preservados.'
            : 'O cadastro do cliente voltará a ficar ativo.'}
        </p>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando} autoFocus>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Aplicando…' : acao}</Botao>
        </div>
      </form>
    </Modal>
  );
}
