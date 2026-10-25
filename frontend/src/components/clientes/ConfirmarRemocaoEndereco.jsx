import { useState } from 'react';
import { removerEndereco } from '../../services/clientes.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function ConfirmarRemocaoEndereco({ cliente, endereco, onFechar, onConfirmado }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  async function confirmar() {
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try { await removerEndereco(cliente.id, endereco.id); onConfirmado(); }
    catch (error) { setErro([403, 404, 409].includes(error.status) ? error.message : 'Não foi possível remover o endereço. Tente novamente.'); }
    finally { setEnviando(false); }
  }
  return (
    <Modal titulo="Remover endereço" onFechar={onFechar} bloqueada={enviando}>
      <div className="space-y-5" aria-busy={enviando}>
        <p>Deseja remover o endereço <strong className="break-words">{endereco.logradouro}{endereco.numero ? `, ${endereco.numero}` : ''}</strong> de <strong>{cliente.nome}</strong>?</p>
        {endereco.principal && cliente.enderecos.length > 1 && <p className="text-sm text-slate-600">O endereço restante mais antigo passará a ser o principal.</p>}
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando} autoFocus>Cancelar</Botao>
          <Botao onClick={confirmar} disabled={enviando}>{enviando ? 'Removendo…' : 'Remover endereço'}</Botao>
        </div>
      </div>
    </Modal>
  );
}
