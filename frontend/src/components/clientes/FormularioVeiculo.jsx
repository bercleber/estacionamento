import { useRef, useState } from 'react';
import { cadastrarVeiculo, editarVeiculo } from '../../services/clientes.service.js';
import CamposVeiculo from './CamposVeiculo.jsx';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';
import useAlteracoesPendentes from '../../hooks/useAlteracoesPendentes.js';
import { validarDadosVeiculo, erroDoCampo, focarPrimeiroErro } from '../../utils/clientes.js';

export default function FormularioVeiculo({ cliente, veiculo = null, onFechar, onSalvo }) {
  const [inicial] = useState(() => ({ placa: veiculo?.placa ?? '', modelo: veiculo?.modelo ?? '', cor: veiculo?.cor ?? '' }));
  const [dados, setDados] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erros, setErros] = useState({});
  const formRef = useRef(null);
  const { permitirSaida, podeFechar } = useAlteracoesPendentes(JSON.stringify(dados) !== JSON.stringify(inicial));
  function fechar() { if (podeFechar()) onFechar(); }

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atuais) => ({ ...atuais, [name]: value }));
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    const encontrados = validarDadosVeiculo(dados);
    setErros(encontrados);
    setErro('');
    if (Object.keys(encontrados).length) { focarPrimeiroErro(formRef.current); return; }
    setEnviando(true);
    try {
      const valores = { placa: dados.placa, modelo: dados.modelo.trim() || null, cor: dados.cor.trim() || null };
      const salvo = veiculo ? await editarVeiculo(cliente.id, veiculo.id, valores) : await cadastrarVeiculo(cliente.id, valores);
      permitirSaida();
      onSalvo(salvo);
    } catch (error) {
      setErros(erroDoCampo(error));
      setErro([400, 403, 404, 409].includes(error.status) ? error.message : 'Não foi possível salvar o veículo. Tente novamente.');
      focarPrimeiroErro(formRef.current);
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={veiculo ? 'Editar veículo' : 'Adicionar veículo'} onFechar={fechar} bloqueada={enviando}>
      <form ref={formRef} onSubmit={enviar} noValidate className="space-y-5" aria-busy={enviando}>
        <p className="break-words text-sm text-slate-600">Cliente: <strong>{cliente.nome}</strong></p>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="sr-only">Dados do veículo</legend>
          <CamposVeiculo dados={dados} onAlterar={alterar} erros={erros} autoFocus bloquearPlaca={veiculo?.movimentacao_aberta} />
        </fieldset>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={fechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : veiculo ? 'Salvar alterações' : 'Adicionar veículo'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
