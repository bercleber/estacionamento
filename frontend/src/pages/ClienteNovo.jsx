import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { cadastrarCliente } from '../services/clientes.service.js';
import CamposCliente from '../components/clientes/CamposCliente.jsx';
import CamposVeiculo from '../components/clientes/CamposVeiculo.jsx';
import CamposEndereco from '../components/clientes/CamposEndereco.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import useAlteracoesPendentes from '../hooks/useAlteracoesPendentes.js';
import { enderecoVazio, formatarCpf, formatarTelefone, formatarCep, validarDadosCliente, validarDadosVeiculo, validarDadosEndereco, erroDoCampo, focarPrimeiroErro } from '../utils/clientes.js';

const inicial = { nome: '', cpf: '', telefone: '', tipo: 'HORISTA' };
const veiculoVazio = { placa: '', modelo: '', cor: '' };

export default function ClienteNovo() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [dados, setDados] = useState(inicial);
  const [veiculo, setVeiculo] = useState(veiculoVazio);
  const [endereco, setEndereco] = useState(enderecoVazio);
  const [comEndereco, setComEndereco] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erros, setErros] = useState({});
  const alterado = JSON.stringify(dados) !== JSON.stringify(inicial)
    || JSON.stringify(veiculo) !== JSON.stringify(veiculoVazio)
    || JSON.stringify(endereco) !== JSON.stringify(enderecoVazio);
  const { permitirSaida } = useAlteracoesPendentes(alterado);

  function alterar(event, grupo) {
    const { name, value } = event.target;
    const formatar = { cpf: formatarCpf, telefone: formatarTelefone, cep: formatarCep }[name];
    const valor = formatar ? formatar(value) : value;
    ({ cliente: setDados, veiculo: setVeiculo, endereco: setEndereco }[grupo])((atuais) => ({ ...atuais, [name]: valor }));
    setErros((atuais) => ({ ...atuais, [name]: undefined }));
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    const encontrados = { ...validarDadosCliente(dados), ...validarDadosVeiculo(veiculo), ...(comEndereco ? validarDadosEndereco(endereco) : {}) };
    setErros(encontrados);
    setErro('');
    if (Object.keys(encontrados).length) { focarPrimeiroErro(formRef.current); return; }
    setEnviando(true);
    try {
      const salvo = await cadastrarCliente({ ...dados, veiculo, ...(comEndereco ? { endereco } : {}) });
      permitirSaida();
      navigate(`/clientes/${salvo.id}`, { replace: true, state: { cadastroConcluido: true } });
    } catch (error) {
      setErros(erroDoCampo(error));
      setErro([400, 403, 409].includes(error.status) ? error.message : 'Não foi possível cadastrar o cliente. Tente novamente.');
      focarPrimeiroErro(formRef.current);
    } finally { setEnviando(false); }
  }

  return (
    <section aria-labelledby="titulo-novo-cliente" className="mx-auto max-w-4xl space-y-6">
      <Link to="/clientes" className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 underline underline-offset-4">Voltar para clientes</Link>
      <div>
        <h1 id="titulo-novo-cliente" className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
        <p className="mt-2 text-sm text-slate-600">Cadastre os dados do cliente e seu primeiro veículo. Os campos opcionais estão identificados.</p>
      </div>
      <form ref={formRef} onSubmit={enviar} noValidate className="space-y-6" aria-busy={enviando}>
        <fieldset disabled={enviando} className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="px-2 text-lg font-semibold">Dados do cliente</legend>
          <CamposCliente dados={dados} onAlterar={(event) => alterar(event, 'cliente')} erros={erros} autoFocus />
        </fieldset>
        <fieldset disabled={enviando} className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <legend className="px-2 text-lg font-semibold">Primeiro veículo</legend>
          <p className="text-sm text-slate-600">Obrigatório para cadastrar o cliente. Outros veículos podem ser adicionados depois, na ficha.</p>
          <CamposVeiculo dados={veiculo} onAlterar={(event) => alterar(event, 'veiculo')} erros={erros} />
        </fieldset>
        <section aria-labelledby="titulo-endereco-cadastro" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="titulo-endereco-cadastro" className="text-lg font-semibold">Endereço <span className="text-sm font-normal text-slate-500">(opcional)</span></h2>
              <p className="mt-1 text-sm text-slate-600">Você também pode adicioná-lo depois, na ficha do cliente.</p></div>
            <Botao variante="secundario" disabled={enviando} aria-expanded={comEndereco} aria-controls="campos-endereco-cadastro" onClick={() => {
              if (comEndereco && Object.values(endereco).some(Boolean) && !window.confirm('Deseja retirar este endereço do cadastro? Os dados preenchidos serão descartados.')) return;
              setComEndereco((atual) => !atual);
              if (comEndereco) { setEndereco(enderecoVazio); setErros({}); }
            }}>{comEndereco ? 'Remover endereço do cadastro' : 'Adicionar endereço'}</Botao>
          </div>
          {comEndereco && <fieldset id="campos-endereco-cadastro" disabled={enviando} className="space-y-5">
            <legend className="sr-only">Dados do endereço</legend>
            <CamposEndereco dados={endereco} onAlterar={(event) => alterar(event, 'endereco')} erros={erros} />
          </fieldset>}
        </section>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" disabled={enviando} onClick={() => navigate('/clientes')}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Cadastrando…' : 'Cadastrar cliente'}</Botao>
        </div>
      </form>
    </section>
  );
}
