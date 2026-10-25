import { useState } from 'react';
import { cadastrarVeiculo, editarVeiculo } from '../../services/clientes.service.js';
import CamposVeiculo from './CamposVeiculo.jsx';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function FormularioVeiculo({ cliente, veiculo = null, onFechar, onSalvo }) {
  const [dados, setDados] = useState(() => ({ placa: veiculo?.placa ?? '', modelo: veiculo?.modelo ?? '', cor: veiculo?.cor ?? '' }));
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
    if (!dados.placa.trim()) { setErro('Informe a placa do veículo.'); return; }
    setEnviando(true);
    try {
      const valores = { placa: dados.placa, modelo: dados.modelo.trim() || null, cor: dados.cor.trim() || null };
      onSalvo(veiculo ? await editarVeiculo(cliente.id, veiculo.id, valores) : await cadastrarVeiculo(cliente.id, valores));
    } catch (error) {
      setErro([400, 403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível salvar o veículo. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={veiculo ? 'Editar veículo' : 'Adicionar veículo'} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
        <p className="break-words text-sm text-slate-600">Cliente: <strong>{cliente.nome}</strong></p>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="sr-only">Dados do veículo</legend>
          <CamposVeiculo dados={dados} onAlterar={alterar} autoFocus />
        </fieldset>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : veiculo ? 'Salvar alterações' : 'Adicionar veículo'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
