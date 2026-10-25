import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Botao from '../components/ui/Botao.jsx';
import Campo from '../components/ui/Campo.jsx';
import Select from '../components/ui/Select.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarClientes } from '../services/clientes.service.js';
import { formatarCpf, formatarTelefone } from '../utils/clientes.js';

const linkBotao = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100';

function Situacao({ ativo }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{ativo ? 'Ativo' : 'Inativo'}</span>;
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 id="titulo-clientes" className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-slate-600">Encontre um cliente para consultar seus dados, veículos e endereços.</p></div>
        <Link to="/clientes/novo" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Novo cliente</Link>
      </div>
      <form onSubmit={buscar} className="grid items-end gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_10rem_10rem_auto]" role="search" aria-label="Buscar clientes">
        <Campo label="Buscar por nome, CPF ou placa" name="busca" type="search" value={filtros.busca} onChange={alterar} maxLength={150} />
        <Select label="Tipo" name="tipo" value={filtros.tipo} onChange={alterar}>
          <option value="">Todos</option><option value="HORISTA">Horistas</option><option value="MENSALISTA">Mensalistas</option>
        </Select>
        <Select label="Situação" name="situacao" value={filtros.situacao} onChange={alterar}>
          <option value="">Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option>
        </Select>
        <div className="flex flex-wrap gap-2">
          <Botao type="submit">Buscar</Botao>
          <Botao variante="secundario" onClick={() => { setFiltros({ busca: '', tipo: '', situacao: '' }); setParams({}); }}>Limpar</Botao>
        </div>
      </form>
      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando clientes…</p> : erro ? (
        <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>
      ) : clientes.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="font-medium">{filtrando ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}</p>
          <p className="text-sm text-slate-600">{filtrando ? 'Tente outro nome, CPF ou placa, ou limpe os filtros.' : 'Use “Novo cliente” para começar o cadastro com o primeiro veículo.'}</p>
        </div>
      ) : (
        <>
          <p role="status" className="text-sm text-slate-600">{clientes.length} {clientes.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}</p>
          <div className="hidden rounded-xl border border-slate-200 bg-white lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Clientes encontrados</caption>
              <thead className="border-b border-slate-200 bg-slate-100/60 text-slate-600"><tr>
                {['Cliente', 'Telefone', 'Tipo', 'Situação', 'Ações'].map((titulo) => <th key={titulo} scope="col" className="px-4 py-4 font-medium">{titulo}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">{clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="max-w-xs break-words px-4 py-4"><p className="font-semibold">{cliente.nome}</p><p className="mt-1 text-xs text-slate-500">{cliente.cpf ? formatarCpf(cliente.cpf) : 'CPF não informado'}</p></td>
                  <td className="px-4 py-4">{cliente.telefone ? formatarTelefone(cliente.telefone) : '—'}</td>
                  <td className="px-4 py-4">{cliente.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</td>
                  <td className="px-4 py-4"><Situacao ativo={cliente.ativo} /></td>
                  <td className="px-4 py-4"><Link to={`/clientes/${cliente.id}`} aria-label={`Ver cliente ${cliente.nome}`} className={linkBotao}>Ver cliente</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ul className="grid gap-4 lg:hidden">{clientes.map((cliente) => (
            <li key={cliente.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{cliente.nome}</h2><p className="mt-1 text-sm text-slate-500">{cliente.cpf ? formatarCpf(cliente.cpf) : 'CPF não informado'}</p></div><Situacao ativo={cliente.ativo} /></div>
              <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Telefone</dt><dd className="mt-1 break-words">{cliente.telefone ? formatarTelefone(cliente.telefone) : '—'}</dd></div><div><dt className="text-slate-500">Tipo</dt><dd className="mt-1">{cliente.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</dd></div></dl>
              <Link to={`/clientes/${cliente.id}`} aria-label={`Ver cliente ${cliente.nome}`} className={`${linkBotao} w-full`}>Ver cliente</Link>
            </li>
          ))}</ul>
        </>
      )}
    </section>
  );
}
