import TituloPagina from '../components/ui/TituloPagina.jsx';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';
import Selo from '../components/ui/Selo.jsx';
import Carregando from '../components/ui/Carregando.jsx';
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

  function abrirSaida(movimentacao) {
    setSucesso('');
    setEntradaAberta(false);
    setSaidaSelecionada(movimentacao);
  }

  return (
    <section aria-labelledby="titulo-movimentacoes" className="space-y-6">
      <TituloPagina id="titulo-movimentacoes" icone="movimentacoes" titulo="Movimentações"
        descricao="Veículos estacionados, com as entradas mais recentes primeiro.">
        <Link to="/movimentacoes/historico" className="vp-button vp-button-secondary"><Icone nome="historico" />Histórico</Link>
        <Botao variante="secundario" disabled={carregando} onClick={() => setAtualizacao((atual) => atual + 1)}><Icone nome="atualizar" />Atualizar</Botao>
        <Botao onClick={() => { setSucesso(''); setSaidaSelecionada(null); setEntradaAberta(true); }}><Icone nome="adicionar" />Registrar entrada</Botao>
      </TituloPagina>
      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>}
      {carregando ? <Carregando>Carregando veículos estacionados…</Carregando> : !erro && (
        movimentacoes.length === 0 ? <EstadoVazio icone="veiculo" titulo="Nenhum veículo estacionado" descricao="Use “Registrar entrada” para iniciar uma permanência." /> : (
          <>
            <p role="status" className="text-sm font-medium text-muted">{movimentacoes.length} {movimentacoes.length === 1 ? 'veículo estacionado' : 'veículos estacionados'}</p>
            <div className="vp-panel hidden overflow-hidden xl:block">
              <div className="overflow-x-auto">
                <table className="vp-table min-w-[52rem]">
                  <caption className="sr-only">Movimentações com entrada registrada e saída pendente</caption>
                  <thead><tr>{['Veículo', 'Cliente', 'Vaga', 'Entrada', 'Operador', 'Ações'].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr></thead>
                  <tbody>{movimentacoes.map((movimentacao) => (
                    <tr key={movimentacao.id}>
                      <td className="max-w-[13rem]"><span className="vp-plate">{movimentacao.placa_registrada}</span><p className="mt-2 break-words text-muted">{movimentacao.modelo ?? 'Modelo não informado'}</p><p className="mt-1 break-words text-xs text-muted">{movimentacao.cor ?? 'Cor não informada'}</p></td>
                      <td className="max-w-[13rem]"><p className="break-words font-semibold">{movimentacao.cliente_nome}</p><p className="mt-1 text-muted">{movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</p></td>
                      <td className="font-bold tabular-nums">{movimentacao.vaga_numero}</td>
                      <td className="whitespace-nowrap tabular-nums"><time dateTime={movimentacao.entrada_em}>{dataHora.format(new Date(movimentacao.entrada_em))}</time></td>
                      <td className="max-w-[10rem] break-words text-muted">{movimentacao.usuario_entrada_nome}</td>
                      <td><Botao variante="secundario" aria-label={`Registrar saída de ${movimentacao.placa_registrada}`} onClick={() => abrirSaida(movimentacao)}>Registrar saída</Botao></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:hidden">{movimentacoes.map((movimentacao) => (
              <li key={movimentacao.id} className="vp-panel flex min-w-0 flex-col gap-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="vp-plate text-lg">{movimentacao.placa_registrada}</span><Selo tom="aviso">Estacionado</Selo></div>
                <div><h2 className="break-words font-bold">{movimentacao.cliente_nome}</h2><p className="mt-1 break-words text-sm text-muted">{movimentacao.modelo ?? 'Modelo não informado'} · {movimentacao.cor ?? 'Cor não informada'}</p></div>
                <dl className="vp-record-details grid-cols-2">
                  <div><dt>Vaga</dt><dd>{movimentacao.vaga_numero}</dd></div>
                  <div><dt>Tipo</dt><dd>{movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</dd></div>
                  <div className="col-span-2"><dt>Entrada</dt><dd><time dateTime={movimentacao.entrada_em}>{dataHora.format(new Date(movimentacao.entrada_em))}</time></dd></div>
                  <div className="col-span-2"><dt>Operador</dt><dd>{movimentacao.usuario_entrada_nome}</dd></div>
                </dl>
                <Botao variante="secundario" className="mt-auto w-full" aria-label={`Registrar saída de ${movimentacao.placa_registrada}`} onClick={() => abrirSaida(movimentacao)}>Registrar saída<Icone nome="seta" /></Botao>
              </li>
            ))}</ul>
          </>
        )
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
