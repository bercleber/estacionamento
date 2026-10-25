import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import FormularioCliente from '../components/clientes/FormularioCliente.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarClientes } from '../services/clientes.service.js';

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    listarClientes({ signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setClientes(dados); })
      .catch(() => { if (!controller.signal.aborted) setErro('Não foi possível carregar os clientes. Tente novamente.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  return (
    <section aria-labelledby="titulo-clientes" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="titulo-clientes" className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-slate-600">Acesse a ficha do cliente para gerenciar seus dados, veículos e endereços.</p>
        </div>
        <Botao onClick={() => setFormularioAberto(true)}>Novo cliente</Botao>
      </div>

      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}

      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando clientes…</p> : !erro && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">Clientes cadastrados, incluindo inativos</caption>
            <thead className="border-b border-slate-200 bg-slate-100/60 text-slate-600">
              <tr>
                {['Nome', 'CPF', 'Telefone', 'Tipo', 'Vaga cativa', 'Situação', 'Ações'].map((titulo) => (
                  <th key={titulo} scope="col" className="px-5 py-4 font-medium">{titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="max-w-xs break-words px-5 py-4 font-medium">{cliente.nome}</td>
                  <td className="whitespace-nowrap px-5 py-4">{cliente.cpf?.replace(/^([0-9]{3})([0-9]{3})([0-9]{3})([0-9]{2})$/, '$1.$2.$3-$4') ?? '—'}</td>
                  <td className="px-5 py-4">{cliente.telefone ?? '—'}</td>
                  <td className="px-5 py-4">{cliente.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</td>
                  <td className="px-5 py-4">{cliente.vaga_cativa_numero ?? '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cliente.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link to={`/clientes/${cliente.id}`} aria-label={`Abrir ficha de ${cliente.nome}`}
                      className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Abrir ficha</Link>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-500">Nenhum cliente cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {formularioAberto && <FormularioCliente onFechar={() => setFormularioAberto(false)}
        onSalvo={(salvo) => {
          setFormularioAberto(false);
          navigate(`/clientes/${salvo.id}`, { state: { cadastroConcluido: true } });
        }} />}
    </section>
  );
}
