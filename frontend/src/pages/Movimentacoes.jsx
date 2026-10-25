import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import RegistrarEntrada from '../components/movimentacoes/RegistrarEntrada.jsx';
import RegistrarSaida from '../components/movimentacoes/RegistrarSaida.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarEmAberto } from '../services/movimentacoes.service.js';

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [entradaAberta, setEntradaAberta] = useState(false);
  const [saidaSelecionada, setSaidaSelecionada] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    listarEmAberto({ signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setMovimentacoes(dados); })
      .catch(() => { if (!controller.signal.aborted) setErro('Não foi possível carregar os veículos estacionados. Tente novamente.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  return (
    <section aria-labelledby="titulo-movimentacoes" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="titulo-movimentacoes" className="text-2xl font-semibold tracking-tight">Movimentações</h1>
          <p className="mt-2 text-sm text-slate-600">Veículos atualmente estacionados, com as entradas mais recentes primeiro.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/movimentacoes/historico" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Histórico</Link>
          <Botao variante="secundario" disabled={carregando} onClick={() => setAtualizacao((atual) => atual + 1)}>Atualizar</Botao>
          <Botao onClick={() => { setSucesso(''); setSaidaSelecionada(null); setEntradaAberta(true); }}>Registrar entrada</Botao>
        </div>
      </div>
      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}
      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando veículos estacionados…</p> : !erro && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[60rem] text-left text-sm">
            <caption className="sr-only">Movimentações com entrada registrada e saída pendente</caption>
            <thead className="border-b border-slate-200 bg-slate-100/60 text-slate-600">
              <tr>{['Veículo', 'Cliente', 'Vaga', 'Entrada', 'Operador', 'Ações'].map((titulo) => <th key={titulo} scope="col" className="px-5 py-4 font-medium">{titulo}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimentacoes.map((movimentacao) => (
                <tr key={movimentacao.id}>
                  <td className="max-w-xs px-5 py-4">
                    <p className="font-mono font-semibold tracking-wider">{movimentacao.placa_registrada}</p>
                    <p className="mt-1 break-words text-slate-600">{movimentacao.modelo ?? 'Modelo não informado'}</p>
                    <p className="mt-1 break-words text-slate-500">{movimentacao.cor ?? 'Cor não informada'}</p>
                  </td>
                  <td className="max-w-xs px-5 py-4">
                    <p className="break-words font-medium">{movimentacao.cliente_nome}</p>
                    <p className="mt-1 text-slate-600">{movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</p>
                  </td>
                  <td className="px-5 py-4 font-medium">{movimentacao.vaga_numero}</td>
                  <td className="whitespace-nowrap px-5 py-4"><time dateTime={movimentacao.entrada_em}>{dataHora.format(new Date(movimentacao.entrada_em))}</time></td>
                  <td className="max-w-xs break-words px-5 py-4">{movimentacao.usuario_entrada_nome}</td>
                  <td className="px-5 py-4"><Botao variante="secundario" aria-label={`Registrar saída de ${movimentacao.placa_registrada}`}
                    onClick={() => { setSucesso(''); setEntradaAberta(false); setSaidaSelecionada(movimentacao); }}>Registrar saída</Botao></td>
                </tr>
              ))}
              {movimentacoes.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Nenhum veículo estacionado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {entradaAberta && <RegistrarEntrada onFechar={() => setEntradaAberta(false)} onRegistrada={(movimentacao) => {
        setEntradaAberta(false);
        setSucesso(`Entrada do veículo ${movimentacao.placa_registrada} registrada na vaga ${movimentacao.vaga_numero}.`);
        setAtualizacao((atual) => atual + 1);
      }} />}
      {saidaSelecionada && <RegistrarSaida key={saidaSelecionada.id} movimentacao={saidaSelecionada}
        onFechar={() => { setSaidaSelecionada(null); setAtualizacao((atual) => atual + 1); }}
        onRegistrada={(saida) => {
          setSaidaSelecionada(null);
          setSucesso(`Saída do veículo ${saida.placa_registrada} registrada. Valor final: ${moeda.format(saida.valor_total)}.`);
          setAtualizacao((atual) => atual + 1);
        }} />}
    </section>
  );
}
