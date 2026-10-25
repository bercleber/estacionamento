import { useState } from 'react';
import { alterarSituacaoVeiculo } from '../../services/clientes.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function ConfirmarSituacaoVeiculo({ cliente, veiculo, onFechar, onConfirmado }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const acao = veiculo.ativo ? 'Inativar' : 'Ativar';

  async function confirmar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try { onConfirmado(await alterarSituacaoVeiculo(cliente.id, veiculo.id, !veiculo.ativo)); }
    catch (error) {
      setErro([403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível alterar a situação do veículo. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={`${acao} veículo`} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={confirmar} className="space-y-5" aria-busy={enviando}>
        <p>Deseja {acao.toLowerCase()} o veículo <strong>{veiculo.placa}</strong> de <strong className="break-words">{cliente.nome}</strong>?</p>
        <p className="text-sm text-slate-600">{veiculo.ativo
          ? 'O veículo precisa estar sem movimentação em aberto. Seu cadastro e histórico serão preservados.'
          : 'A ativação exige que o cliente também esteja ativo.'}</p>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando} autoFocus>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Aplicando…' : acao}</Botao>
        </div>
      </form>
    </Modal>
  );
}
