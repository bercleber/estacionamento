import { useRef, useState } from 'react';
import { editarCliente } from '../../services/clientes.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';
import CamposCliente from './CamposCliente.jsx';
import useAlteracoesPendentes from '../../hooks/useAlteracoesPendentes.js';
import { formatarCpf, formatarTelefone, validarDadosCliente, erroDoCampo, focarPrimeiroErro } from '../../utils/clientes.js';

export default function FormularioCliente({ cliente, onFechar, onSalvo }) {
  const [inicial] = useState(() => ({ nome: cliente.nome, cpf: formatarCpf(cliente.cpf ?? ''), telefone: formatarTelefone(cliente.telefone ?? ''), tipo: cliente.tipo }));
  const [dados, setDados] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erros, setErros] = useState({});
  const formRef = useRef(null);
  const { permitirSaida, podeFechar } = useAlteracoesPendentes(JSON.stringify(dados) !== JSON.stringify(inicial));
  function fechar() { if (podeFechar()) onFechar(); }

  function alterar(event) {
    const { name, value } = event.target;
    const formatar = { cpf: formatarCpf, telefone: formatarTelefone }[name];
    setDados((atuais) => ({ ...atuais, [name]: formatar ? formatar(value) : value }));
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setErro('');
    const encontrados = validarDadosCliente(dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length) { focarPrimeiroErro(formRef.current); return; }
    setEnviando(true);
    try {
      const salvo = await editarCliente(cliente.id, { ...dados, cpf: dados.cpf || null, telefone: dados.telefone || null });
      permitirSaida();
      onSalvo(salvo);
    } catch (error) {
      setErros(erroDoCampo(error));
      setErro([400, 403, 404, 409].includes(error.status) ? error.message : 'Não foi possível salvar o cliente. Tente novamente.');
      focarPrimeiroErro(formRef.current);
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo="Editar dados do cliente" onFechar={fechar} bloqueada={enviando}>
      <form ref={formRef} onSubmit={enviar} noValidate className="space-y-5" aria-busy={enviando}>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="sr-only">Dados do cliente</legend>
          <CamposCliente dados={dados} onAlterar={alterar} erros={erros} autoFocus bloquearTipo={cliente.movimentacao_aberta} />
          {cliente.vaga_cativa_id && dados.tipo === 'HORISTA' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">A vaga cativa precisa ser removida por administrador ou gerente antes da mudança para horista.</p>}
        </fieldset>
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={fechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar alterações'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
