import TituloPagina from '../components/ui/TituloPagina.jsx';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';
import Selo from '../components/ui/Selo.jsx';
import Carregando from '../components/ui/Carregando.jsx';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Botao from '../components/ui/Botao.jsx';
import Campo from '../components/ui/Campo.jsx';
import Select from '../components/ui/Select.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarClientes } from '../services/clientes.service.js';
import { formatarCpf, formatarTelefone } from '../utils/clientes.js';

const linkBotao = 'vp-button vp-button-secondary';

function Situacao({ ativo }) {
  return <Selo tom={ativo ? 'sucesso' : 'neutro'}>{ativo ? 'Ativo' : 'Inativo'}</Selo>;
}

export default function Clientes() {
  const [params, setParams] = useSearchParams();
  const busca = params.get('busca') ?? '';
  const tipo = ['HORISTA', 'MENSALISTA'].includes(params.get('tipo')) ? params.get('tipo') : '';
  const situacao = ['ATIVO', 'INATIVO'].includes(params.get('situacao')) ? params.get('situacao') : '';
  const [filtros, setFiltros] = useState({ busca, tipo, situacao });
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const filtrando = Boolean(busca || tipo || situacao);

  useEffect(() => { setFiltros({ busca, tipo, situacao }); }, [busca, tipo, situacao]);
  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    listarClientes({ busca, tipo, situacao, signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setClientes(dados); })
      .catch(() => { if (!controller.signal.aborted) setErro('Não foi possível carregar os clientes. Tente novamente.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [busca, tipo, situacao, atualizacao]);

  function alterar(event) {
    const { name, value } = event.target;
    setFiltros((atuais) => ({ ...atuais, [name]: value }));
  }
  function buscar(event) {
    event.preventDefault();
    setParams(Object.fromEntries(Object.entries(filtros).map(([chave, valor]) => [chave, valor.trim()]).filter(([, valor]) => valor)));
    setAtualizacao((atual) => atual + 1);
  }

  return (
    <section aria-labelledby="titulo-clientes" className="space-y-6">
      <TituloPagina id="titulo-clientes" icone="clientes" titulo="Clientes" descricao="Encontre um cliente para consultar seus dados, veículos e endereços.">
        <Link to="/clientes/novo" className="vp-button vp-button-primary"><Icone nome="adicionar" />Novo cliente</Link>
      </TituloPagina>
      <form onSubmit={buscar} className="vp-panel grid items-end gap-4 p-5 sm:grid-cols-2 2xl:grid-cols-[minmax(12rem,1fr)_10rem_10rem_auto]" role="search" aria-label="Buscar clientes">
        <Campo label="Buscar por nome, CPF ou placa" name="busca" type="search" value={filtros.busca} onChange={alterar} maxLength={150} />
        <Select label="Tipo" name="tipo" value={filtros.tipo} onChange={alterar}>
          <option value="">Todos</option><option value="HORISTA">Horistas</option><option value="MENSALISTA">Mensalistas</option>
        </Select>
        <Select label="Situação" name="situacao" value={filtros.situacao} onChange={alterar}>
          <option value="">Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option>
        </Select>
        <div className="flex flex-wrap gap-2">
          <Botao type="submit"><Icone nome="buscar" />Buscar</Botao>
          <Botao variante="secundario" onClick={() => { setFiltros({ busca: '', tipo: '', situacao: '' }); setParams({}); }}>Limpar</Botao>
        </div>
      </form>
      {carregando ? <Carregando>Carregando clientes…</Carregando> : erro ? (
        <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>
      ) : clientes.length === 0 ? (
        <EstadoVazio icone={filtrando ? 'buscar' : 'clientes'} titulo={filtrando ? 'Nenhum cliente encontrado para esta busca' : 'Nenhum cliente cadastrado'}
          descricao={filtrando ? 'Tente outro nome, CPF ou placa, ou limpe os filtros.' : 'Use “Novo cliente” para começar o cadastro com o primeiro veículo.'} />
      ) : (
        <>
          <Carregando>{clientes.length} {clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}</Carregando>
          <div className="vp-panel hidden xl:block">
            <table className="vp-table">
              <caption className="sr-only">Clientes encontrados</caption>
              <thead ><tr>
                {['Cliente', 'Telefone', 'Tipo', 'Situação', 'Ações'].map((titulo) => <th key={titulo} scope="col" className="px-4 py-4 font-medium">{titulo}</th>)}
              </tr></thead>
              <tbody >{clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="max-w-xs break-words px-4 py-4"><p className="font-semibold">{cliente.nome}</p><p className="mt-1 text-xs text-muted">{cliente.cpf ? formatarCpf(cliente.cpf) : 'CPF não informado'}</p></td>
                  <td className="px-4 py-4">{cliente.telefone ? formatarTelefone(cliente.telefone) : '—'}</td>
                  <td className="px-4 py-4">{cliente.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</td>
                  <td className="px-4 py-4"><Situacao ativo={cliente.ativo} /></td>
                  <td className="px-4 py-4"><Link to={`/clientes/${cliente.id}`} aria-label={`Ver cliente ${cliente.nome}`} className={linkBotao}>Ver cliente</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 xl:hidden">{clientes.map((cliente) => (
            <li key={cliente.id} className="vp-panel flex min-w-0 flex-col gap-4 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{cliente.nome}</h2><p className="mt-1 text-sm text-muted">{cliente.cpf ? formatarCpf(cliente.cpf) : 'CPF não informado'}</p></div><Situacao ativo={cliente.ativo} /></div>
              <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Telefone</dt><dd className="mt-1 break-words">{cliente.telefone ? formatarTelefone(cliente.telefone) : '—'}</dd></div><div><dt className="text-muted">Tipo</dt><dd className="mt-1">{cliente.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</dd></div></dl>
              <Link to={`/clientes/${cliente.id}`} aria-label={`Ver cliente ${cliente.nome}`} className={`${linkBotao} mt-auto w-full`}>Ver cliente</Link>
            </li>
          ))}</ul>
        </>
      )}
    </section>
  );
}
