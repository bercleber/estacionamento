import TituloPagina from '../components/ui/TituloPagina.jsx';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';
import Selo from '../components/ui/Selo.jsx';
import Carregando from '../components/ui/Carregando.jsx';
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
      <Link to="/movimentacoes" className="vp-button vp-button-secondary"><Icone nome="voltar" />Voltar para veículos estacionados</Link>
      <TituloPagina id="titulo-historico" icone="historico" titulo="Histórico de movimentações"
        descricao="Consulte entradas, saídas e valores registrados. O período considera a data de entrada e os horários de São Paulo." />

      <form onSubmit={aplicar} className="vp-panel space-y-5 p-5 sm:p-7">
        <fieldset className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <legend className="mb-4 text-sm font-bold text-ink">Filtros do histórico</legend>
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
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={limpar} disabled={carregando}>Limpar filtros</Botao>
          <Botao type="submit" disabled={carregando}><Icone nome="buscar" />Aplicar filtros</Botao>
        </div>
      </form>

      {erro && <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>}
      {carregando ? <Carregando>Carregando histórico…</Carregando> : !erro && dados && (
        <>
          <Carregando>{dados.total} {dados.total === 1 ? 'movimentação encontrada' : 'movimentações encontradas'}.</Carregando>
          {dados.itens.length === 0 ? <EstadoVazio icone="historico" titulo="Nenhuma movimentação encontrada" descricao="Ajuste o período ou os demais filtros para tentar novamente." /> : (
            <>
              <div className="vp-panel hidden overflow-hidden 2xl:block">
                <div className="overflow-x-auto">
                  <table className="vp-table min-w-[62rem]">
                    <caption className="sr-only">Movimentações conforme os filtros aplicados, da entrada mais recente para a mais antiga</caption>
                    <thead><tr>{['Placa', 'Cliente / tipo', 'Vaga', 'Entrada', 'Saída', 'Situação', 'Valor final', 'Ações'].map((titulo) => <th key={titulo} scope="col" className={titulo === 'Valor final' ? 'text-right' : ''}>{titulo}</th>)}</tr></thead>
                    <tbody>{dados.itens.map((movimentacao) => (
                      <tr key={movimentacao.id}>
                        <td><span className="vp-plate">{movimentacao.placa_registrada}</span></td>
                        <td className="max-w-[12rem]"><p className="break-words font-semibold">{movimentacao.cliente_nome}</p><p className="mt-1 text-muted">{movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</p></td>
                        <td className="font-semibold">{movimentacao.vaga_numero}</td>
                        <td className="whitespace-nowrap tabular-nums">{formatarDataHora(movimentacao.entrada_em)}</td>
                        <td className="whitespace-nowrap tabular-nums">{formatarDataHora(movimentacao.saida_em)}</td>
                        <td><Selo tom={movimentacao.situacao === 'ABERTA' ? 'aviso' : 'neutro'}>{movimentacao.situacao === 'ABERTA' ? 'Aberta' : 'Encerrada'}</Selo></td>
                        <td className="whitespace-nowrap text-right font-semibold tabular-nums">{movimentacao.situacao === 'ABERTA' ? 'Pendente' : movimentacao.valor_total === null ? 'Não informado' : moeda.format(movimentacao.valor_total)}</td>
                        <td><Botao variante="secundario" onClick={() => setDetalheId(movimentacao.id)} aria-label={`Detalhes da movimentação ${movimentacao.id}, placa ${movimentacao.placa_registrada}`}>Detalhes</Botao></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <ul className="grid gap-4 md:grid-cols-2 2xl:hidden">{dados.itens.map((movimentacao) => (
                <li key={movimentacao.id} className="vp-panel flex min-w-0 flex-col gap-5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="vp-plate">{movimentacao.placa_registrada}</span><Selo tom={movimentacao.situacao === 'ABERTA' ? 'aviso' : 'neutro'}>{movimentacao.situacao === 'ABERTA' ? 'Aberta' : 'Encerrada'}</Selo></div>
                  <h2 className="break-words font-bold">{movimentacao.cliente_nome}</h2>
                  <dl className="vp-record-details grid-cols-2">
                    <div><dt>Vaga</dt><dd>{movimentacao.vaga_numero}</dd></div>
                    <div><dt>Tipo</dt><dd>{movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</dd></div>
                    <div className="col-span-2"><dt>Entrada</dt><dd>{formatarDataHora(movimentacao.entrada_em)}</dd></div>
                    <div className="col-span-2"><dt>Saída</dt><dd>{formatarDataHora(movimentacao.saida_em)}</dd></div>
                    <div className="col-span-2 rounded-xl bg-blue-50/60 p-3"><dt>Valor final</dt><dd className="tabular-nums">{movimentacao.situacao === 'ABERTA' ? 'Pendente' : movimentacao.valor_total === null ? 'Não informado' : moeda.format(movimentacao.valor_total)}</dd></div>
                  </dl>
                  <Botao variante="secundario" className="mt-auto w-full" onClick={() => setDetalheId(movimentacao.id)} aria-label={`Detalhes da movimentação ${movimentacao.id}, placa ${movimentacao.placa_registrada}`}>Ver detalhes<Icone nome="seta" /></Botao>
                </li>
              ))}</ul>
            </>
          )}
          {dados.total_paginas > 0 && <nav aria-label="Paginação do histórico" className="vp-panel flex flex-wrap items-center justify-between gap-4 p-4 sm:px-5">
            <p className="text-sm text-muted">Página {dados.pagina} de {dados.total_paginas} — {dados.por_pagina} registros por página</p>
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
