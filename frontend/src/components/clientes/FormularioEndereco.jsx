import { useRef, useState } from 'react';
import { cadastrarEndereco, editarEndereco } from '../../services/clientes.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';
import CamposEndereco from './CamposEndereco.jsx';
import useAlteracoesPendentes from '../../hooks/useAlteracoesPendentes.js';
import { enderecoVazio, formatarCep, validarDadosEndereco, erroDoCampo, focarPrimeiroErro } from '../../utils/clientes.js';

export default function FormularioEndereco({ cliente, endereco = null, onFechar, onSalvo }) {
  const [inicial] = useState(() => Object.fromEntries(Object.keys(enderecoVazio).map((campo) => [campo, campo === 'cep' ? formatarCep(endereco?.cep ?? '') : endereco?.[campo] ?? ''])));
  const [dados, setDados] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erros, setErros] = useState({});
  const formRef = useRef(null);
  const { permitirSaida, podeFechar } = useAlteracoesPendentes(JSON.stringify(dados) !== JSON.stringify(inicial));
  function fechar() { if (podeFechar()) onFechar(); }

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atuais) => ({ ...atuais, [name]: name === 'cep' ? formatarCep(value) : value }));
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  }
  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    const encontrados = validarDadosEndereco(dados);
    setErros(encontrados);
    setErro('');
    if (Object.keys(encontrados).length) { focarPrimeiroErro(formRef.current); return; }
    setEnviando(true);
    try {
      const salvo = endereco ? await editarEndereco(cliente.id, endereco.id, dados) : await cadastrarEndereco(cliente.id, dados);
      permitirSaida();
      onSalvo(salvo);
    } catch (error) {
      setErros(erroDoCampo(error));
      setErro([400, 403, 404, 409].includes(error.status) ? error.message : 'Não foi possível salvar o endereço. Tente novamente.');
      focarPrimeiroErro(formRef.current);
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={endereco ? 'Editar endereço' : 'Adicionar endereço'} onFechar={fechar} bloqueada={enviando}>
      <form ref={formRef} onSubmit={enviar} noValidate className="space-y-5" aria-busy={enviando}>
        <p className="break-words text-sm text-muted">Cliente: <strong>{cliente.nome}</strong></p>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="sr-only">Dados do endereço</legend>
          <CamposEndereco dados={dados} onAlterar={alterar} erros={erros} autoFocus />
        </fieldset>
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={fechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : endereco ? 'Salvar alterações' : 'Adicionar endereço'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
