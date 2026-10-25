import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listarHistorico } from '../services/movimentacoes.service.js';
import { listarClientes } from '../services/clientes.service.js';
import { formatarDataHora, periodoMesAtual } from '../utils/historico.js';
import DetalhesMovimentacao from '../components/movimentacoes/DetalhesMovimentacao.jsx';
import Botao from '../components/ui/Botao.jsx';
import Campo from '../components/ui/Campo.jsx';
import Select from '../components/ui/Select.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const filtrosVazios = { data_inicio: '', data_fim: '', placa: '', cliente_id: '', situacao: '' };

export default function HistoricoMovimentacoes() {
  const [filtros, setFiltros] = useState(() => ({ ...filtrosVazios, ...periodoMesAtual() }));
  const [consulta, setConsulta] = useState(() => ({ filtros: { ...filtros }, pagina: 1 }));
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroFiltros, setErroFiltros] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const [detalheId, setDetalheId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [erroClientes, setErroClientes] = useState('');
  const [atualizacaoClientes, setAtualizacaoClientes] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let reajustandoPagina = false;
    setCarregando(true);
    setErro('');
    listarHistorico({ ...consulta.filtros, pagina: consulta.pagina }, { signal: controller.signal })
      .then((resposta) => {
        if (controller.signal.aborted) return;
        const ultimaPagina = Math.max(1, resposta.total_paginas);
        if (consulta.pagina > ultimaPagina) {
          reajustandoPagina = true;
          setConsulta((atual) => ({ ...atual, pagina: ultimaPagina }));
          return;
        }
        setDados(resposta);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErro(error.status === 400 ? error.message : 'Não foi possível carregar o histórico. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted && !reajustandoPagina) setCarregando(false); });
    return () => controller.abort();
  }, [consulta, atualizacao]);

  useEffect(() => {
    const controller = new AbortController();
    setCarregandoClientes(true);
    setErroClientes('');
    listarClientes({ signal: controller.signal })
      .then((resposta) => { if (!controller.signal.aborted) setClientes(resposta); })
      .catch(() => { if (!controller.signal.aborted) setErroClientes('Não foi possível carregar os clientes para o filtro.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregandoClientes(false); });
    return () => controller.abort();
  }, [atualizacaoClientes]);

  function alterar(event) {
    const { name, value } = event.target;
    setFiltros((atuais) => ({ ...atuais, [name]: value }));
    setErroFiltros('');
  }

  function aplicar(event) {
    event.preventDefault();
    if (filtros.data_inicio && filtros.data_fim && filtros.data_inicio > filtros.data_fim) {
      setErroFiltros('A data inicial não pode ser posterior à data final.');
      return;
    }
    setErroFiltros('');
    setConsulta({ filtros: { ...filtros, placa: filtros.placa.trim() }, pagina: 1 });
  }

  function limpar() {
    setFiltros({ ...filtrosVazios });
    setErroFiltros('');
    setConsulta({ filtros: { ...filtrosVazios }, pagina: 1 });
  }

  return (
    <section aria-labelledby="titulo-historico" className="space-y-6">
      <div>
        <Link to="/movimentacoes" className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-slate-600 underline underline-offset-4">Voltar para veículos estacionados</Link>
        <h1 id="titulo-historico" className="mt-2 text-2xl font-semibold tracking-tight">Histórico de movimentações</h1>
        <p className="mt-2 text-sm text-slate-600">Consulte entradas, saídas e valores registrados. O período considera a data de entrada e os horários de São Paulo.</p>
      </div>

      <form onSubmit={aplicar} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <fieldset className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <legend className="sr-only">Filtros do histórico</legend>
          <Campo label="Entrada a partir de" name="data_inicio" type="date" value={filtros.data_inicio} onChange={alterar} min="1000-01-01" max="9999-12-31" />
          <Campo label="Entrada até" name="data_fim" type="date" value={filtros.data_fim} onChange={alterar} min="1000-01-01" max="9999-12-31" />
          <Campo label="Placa registrada" name="placa" value={filtros.placa} onChange={alterar} maxLength={10} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          <Select label="Cliente" name="cliente_id" value={filtros.cliente_id} onChange={alterar} disabled={carregandoClientes || Boolean(erroClientes)}>
            <option value="">{carregandoClientes ? 'Carregando clientes…' : 'Todos os clientes'}</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}{cliente.ativo ? '' : ' (inativo)'}</option>)}
          </Select>
          <Select label="Situação" name="situacao" value={filtros.situacao} onChange={alterar}>
            <option value="">Todas</option>
            <option value="ABERTA">Abertas</option>
            <option value="ENCERRADA">Encerradas</option>
          </Select>
        </fieldset>
        {erroClientes && <div className="space-y-3"><Mensagem>{erroClientes}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacaoClientes((atual) => atual + 1)}>Recarregar clientes</Botao></div>}
        <Mensagem>{erroFiltros}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={limpar} disabled={carregando}>Limpar filtros</Botao>
          <Botao type="submit" disabled={carregando}>Aplicar filtros</Botao>
        </div>
      </form>

      {erro && <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>}
      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando histórico…</p> : !erro && dados && (
        <>
          <p role="status" className="text-sm text-slate-600">{dados.total} {dados.total === 1 ? 'movimentação encontrada' : 'movimentações encontradas'}.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <caption className="sr-only">Movimentações conforme os filtros aplicados, da entrada mais recente para a mais antiga</caption>
              <thead className="border-b border-slate-200 bg-slate-100/60 text-slate-600">
                <tr>{['Placa', 'Cliente / tipo', 'Vaga', 'Entrada', 'Saída', 'Situação', 'Valor final', 'Ações'].map((titulo) => <th key={titulo} scope="col" className="px-5 py-4 font-medium">{titulo}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados.itens.map((movimentacao) => (
                  <tr key={movimentacao.id}>
                    <td className="px-5 py-4 font-mono font-semibold tracking-wider">{movimentacao.placa_registrada}</td>
                    <td className="max-w-xs px-5 py-4"><p className="break-words font-medium">{movimentacao.cliente_nome}</p><p className="mt-1 text-slate-600">{movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</p></td>
                    <td className="px-5 py-4">{movimentacao.vaga_numero}</td>
                    <td className="whitespace-nowrap px-5 py-4">{formatarDataHora(movimentacao.entrada_em)}</td>
                    <td className="whitespace-nowrap px-5 py-4">{formatarDataHora(movimentacao.saida_em)}</td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${movimentacao.situacao === 'ABERTA' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{movimentacao.situacao === 'ABERTA' ? 'Aberta' : 'Encerrada'}</span></td>
                    <td className="whitespace-nowrap px-5 py-4">{movimentacao.situacao === 'ABERTA' ? 'Pendente' : movimentacao.valor_total === null ? 'Não informado' : moeda.format(movimentacao.valor_total)}</td>
                    <td className="px-5 py-4"><Botao variante="secundario" onClick={() => setDetalheId(movimentacao.id)} aria-label={`Detalhes da movimentação ${movimentacao.id}, placa ${movimentacao.placa_registrada}`}>Detalhes</Botao></td>
                  </tr>
                ))}
                {dados.itens.length === 0 && <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">Nenhuma movimentação encontrada para os filtros aplicados.</td></tr>}
              </tbody>
            </table>
          </div>
          {dados.total_paginas > 0 && <nav aria-label="Paginação do histórico" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Página {dados.pagina} de {dados.total_paginas} — {dados.por_pagina} registros por página</p>
            <div className="flex gap-3">
              <Botao variante="secundario" disabled={dados.pagina <= 1} onClick={() => setConsulta((atual) => ({ ...atual, pagina: Math.max(1, atual.pagina - 1) }))}>Anterior</Botao>
              <Botao variante="secundario" disabled={dados.pagina >= dados.total_paginas} onClick={() => setConsulta((atual) => ({ ...atual, pagina: Math.min(dados.total_paginas, atual.pagina + 1) }))}>Próxima</Botao>
            </div>
          </nav>}
        </>
      )}

      {detalheId !== null && <DetalhesMovimentacao key={detalheId} id={detalheId} onFechar={() => { setDetalheId(null); setAtualizacao((atual) => atual + 1); }} />}
    </section>
  );
}
