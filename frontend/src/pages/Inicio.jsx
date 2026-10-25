import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Botao from '../components/ui/Botao.jsx';
import Carregando from '../components/ui/Carregando.jsx';
import Icone from '../components/ui/Icone.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import Selo from '../components/ui/Selo.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { consultarPainel } from '../services/painel.service.js';

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo',
});
const data = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo',
});
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const percentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

function Indicador({ titulo, valor, descricao, icone, destaque = false, tom = 'azul' }) {
  const tons = {
    azul: 'bg-blue-50 text-blue-700',
    ambar: 'bg-amber-50 text-amber-800',
    verde: 'bg-teal-50 text-teal-700',
  };
  return (
    <div className={`${destaque ? 'vp-dashboard-highlight' : 'vp-panel'} flex min-w-0 flex-col p-5 sm:p-6`}>
      <dt className="flex items-start justify-between gap-3">
        <span className={`text-sm font-semibold leading-relaxed ${destaque ? 'text-white' : 'text-muted'}`}>{titulo}</span>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${destaque ? 'bg-white/15 text-white' : tons[tom]}`}><Icone nome={icone} /></span>
      </dt>
      <dd className="mt-5 break-words text-4xl font-extrabold tracking-tight tabular-nums">{valor}</dd>
      <dd className={`mt-2 text-xs leading-relaxed ${destaque ? 'text-blue-50' : 'text-muted'}`}>{descricao}</dd>
    </div>
  );
}

function Ocupacao({ operacao, gestao }) {
  const total = operacao.vagas_livres + operacao.vagas_ocupadas + operacao.vagas_cativas_desocupadas;
  const ocupacao = total ? operacao.vagas_ocupadas / total : 0;
  const fimLivres = total ? (operacao.vagas_ocupadas + operacao.vagas_livres) / total * 100 : 0;
  const grupos = [
    { titulo: 'Ocupadas', valor: operacao.vagas_ocupadas, cor: 'bg-amber-400' },
    { titulo: 'Comuns livres', valor: operacao.vagas_livres, cor: 'bg-teal-500' },
    { titulo: 'Cativas desocupadas', valor: operacao.vagas_cativas_desocupadas, cor: 'bg-blue-500' },
  ];
  return (
    <section aria-labelledby="titulo-ocupacao" className="vp-panel min-w-0 p-5 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="titulo-ocupacao" className="text-lg font-bold tracking-tight">Ocupação do estacionamento</h2><p className="mt-1 text-sm text-muted">Distribuição das vagas ativas nesta consulta.</p></div>
        <Selo tom="informacao">{inteiro.format(total)} {total === 1 ? 'vaga ativa' : 'vagas ativas'}</Selo>
      </header>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
        <div role="img" aria-label={total ? `${percentual.format(ocupacao)} das vagas ativas estão ocupadas.` : 'Nenhuma vaga ativa cadastrada.'}
          className="vp-dashboard-ring" style={total ? { background: `conic-gradient(#fbbf24 0% ${ocupacao * 100}%, #14b8a6 ${ocupacao * 100}% ${fimLivres}%, #3b82f6 ${fimLivres}% 100%)` } : undefined}>
          <div aria-hidden="true" className="flex h-[calc(100%_-_2rem)] w-[calc(100%_-_2rem)] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-4xl font-extrabold tracking-tight tabular-nums">{total ? percentual.format(ocupacao) : '—'}</span>
            <span className="mt-1 text-xs font-semibold text-muted">{total ? 'de ocupação' : 'Sem vagas ativas'}</span>
          </div>
        </div>
        <dl className="min-w-0 flex-1 basis-48 space-y-4">
          {grupos.map((grupo) => <div key={grupo.titulo} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <dt className="flex min-w-0 items-center gap-2 text-sm text-muted"><span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${grupo.cor}`} />{grupo.titulo}</dt>
            <dd className="text-lg font-bold tabular-nums">{inteiro.format(grupo.valor)}</dd>
          </div>)}
        </dl>
      </div>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {gestao ? <p className="text-xs text-muted">{inteiro.format(gestao.vagas_inativas)} {gestao.vagas_inativas === 1 ? 'vaga inativa fora do gráfico.' : 'vagas inativas fora do gráfico.'}</p> : <p className="text-xs text-muted">Vagas cativas ficam reservadas aos clientes vinculados.</p>}
        <Link to="/vagas" className="vp-button vp-button-secondary text-xs">Ver vagas<Icone nome="seta" className="h-4 w-4" /></Link>
      </footer>
    </section>
  );
}

function ClientesAtivos({ clientes }) {
  const total = clientes.horistas + clientes.mensalistas;
  const grupos = [
    { titulo: 'Horistas', valor: clientes.horistas, cor: 'bg-blue-500' },
    { titulo: 'Mensalistas', valor: clientes.mensalistas, cor: 'bg-teal-500' },
  ];
  return (
    <section aria-labelledby="titulo-clientes-ativos" className="vp-panel flex min-w-0 flex-col p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3"><h3 id="titulo-clientes-ativos" className="font-bold">Clientes ativos</h3><Icone nome="clientes" className="h-5 w-5 text-primary" /></div>
      <p className="mt-5 text-3xl font-extrabold tabular-nums">{inteiro.format(total)}</p>
      <div aria-hidden="true" className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">{grupos.map((grupo) => <span key={grupo.titulo} className={grupo.cor} style={{ width: `${total ? grupo.valor / total * 100 : 0}%` }} />)}</div>
      <dl className="mt-4 space-y-3">{grupos.map((grupo) => <div key={grupo.titulo} className="flex items-center justify-between gap-3 text-sm"><dt className="flex items-center gap-2 text-muted"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${grupo.cor}`} />{grupo.titulo}</dt><dd className="font-bold tabular-nums">{inteiro.format(grupo.valor)}</dd></div>)}</dl>
      {total === 0 && <p className="mt-3 text-xs text-muted">Nenhum cliente ativo.</p>}
      <Link to="/clientes" className="vp-button vp-button-secondary mt-5 w-full">Ver clientes<Icone nome="seta" className="h-4 w-4" /></Link>
    </section>
  );
}

export default function Inicio() {
  const { usuario } = useAuth();
  const [consulta, setConsulta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const gerenciar = ['GERENTE', 'ADMINISTRADOR'].includes(usuario.perfil);
  const administrar = usuario.perfil === 'ADMINISTRADOR';
  // Dados de um perfil anterior não são reaproveitados durante uma nova consulta.
  const painel = consulta?.usuarioId === usuario.id && consulta.perfil === usuario.perfil ? consulta.dados : null;
  const atalhos = [
    { caminho: '/movimentacoes', titulo: 'Movimentações', descricao: 'Entradas, saídas e veículos estacionados', icone: 'movimentacoes' },
    { caminho: '/movimentacoes/historico', titulo: 'Histórico', descricao: 'Permanências e valores registrados', icone: 'historico' },
    { caminho: '/clientes', titulo: 'Clientes', descricao: 'Dados, veículos e endereços', icone: 'clientes' },
  ];
  if (gerenciar) atalhos.push(
    { caminho: '/vagas', titulo: 'Vagas', descricao: 'Disponibilidade e gerenciamento', icone: 'vagas' },
    { caminho: '/tarifas', titulo: 'Tarifas', descricao: 'Valores por hora e por mês', icone: 'tarifas' },
  );
  if (administrar) atalhos.push({ caminho: '/usuarios', titulo: 'Usuários', descricao: 'Contas e perfis de acesso', icone: 'usuarios' });

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    consultarPainel({ signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setConsulta({ usuarioId: usuario.id, perfil: usuario.perfil, dados }); })
      .catch(() => { if (!controller.signal.aborted) setErro('Não foi possível carregar os indicadores. Tente novamente.'); })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao, usuario.id, usuario.perfil]);

  return (
    <section aria-labelledby="titulo-inicio" className="space-y-6 sm:space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="mb-2 break-words text-sm font-semibold text-muted">Olá, {usuario.nome}.</p>
          <h1 id="titulo-inicio" className="text-3xl font-extrabold tracking-tight text-ink">Painel inicial</h1>
          <p className="mt-2 text-sm text-muted">Seu estacionamento em uma visão geral.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao variante="secundario" disabled={carregando} onClick={() => setAtualizacao((atual) => atual + 1)}><Icone nome="atualizar" />{carregando ? 'Atualizando…' : 'Atualizar'}</Botao>
          <Link to="/movimentacoes" className="vp-button vp-button-primary">Ver movimentações<Icone nome="seta" /></Link>
        </div>
      </header>

      {erro && <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>}
      {carregando && !painel && <Carregando>Carregando indicadores do painel…</Carregando>}
      {!erro && painel && <div className="space-y-6 sm:space-y-7" aria-busy={carregando}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p className="flex items-center gap-2 font-semibold"><Icone nome="calendario" className="h-4 w-4" /><time dateTime={painel.data_referencia}>{data.format(new Date(`${painel.data_referencia}T12:00:00-03:00`))}</time></p>
          <p role="status">{carregando ? 'Atualizando indicadores…' : <>Última consulta: <time dateTime={painel.consultado_em}>{dataHora.format(new Date(painel.consultado_em))}</time></>}</p>
        </div>

        <section aria-labelledby="titulo-visao-geral">
          <h2 id="titulo-visao-geral" className="sr-only">Indicadores da operação</h2>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador titulo="Vagas comuns livres" valor={inteiro.format(painel.operacao.vagas_livres)} descricao="Disponíveis e sem reserva cativa" icone="vagas" destaque />
            <Indicador titulo="Vagas ocupadas" valor={inteiro.format(painel.operacao.vagas_ocupadas)} descricao="Inclui as vagas cativas ocupadas" icone="veiculo" tom="ambar" />
            <Indicador titulo="Entradas de hoje" valor={inteiro.format(painel.operacao.entradas_hoje)} descricao="Entradas registradas no dia" icone="movimentacoes" />
            <Indicador titulo="Saídas de hoje" valor={inteiro.format(painel.operacao.saidas_hoje)} descricao="Saídas registradas no dia" icone="sair" tom="verde" />
          </dl>
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Ocupacao operacao={painel.operacao} gestao={gerenciar ? painel.gestao : undefined} />
          <nav aria-labelledby="titulo-atalhos" className="vp-panel min-w-0 p-5 sm:p-6">
            <h2 id="titulo-atalhos" className="text-lg font-bold tracking-tight">Acesso rápido</h2>
            <p className="mt-1 text-sm text-muted">Continue sua rotina.</p>
            <ul className="mt-4 divide-y divide-slate-100">{atalhos.map(({ caminho, titulo, descricao, icone }) => <li key={caminho}>
              <Link to={caminho} className="vp-dashboard-shortcut flex min-w-0 items-center gap-3 rounded-xl px-2 py-3 hover:bg-blue-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary"><Icone nome={icone} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{titulo}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted">{descricao}</span></span>
                <Icone nome="seta" className="h-4 w-4 text-muted" />
              </Link>
            </li>)}</ul>
          </nav>
        </div>

        {gerenciar && painel.gestao && <section aria-labelledby="titulo-gestao" className="space-y-4">
          <div><h2 id="titulo-gestao" className="text-lg font-bold tracking-tight">Gestão de hoje</h2><p className="mt-1 text-sm text-muted">Clientes ativos e valores registrados nas saídas.</p></div>
          <div className={`grid gap-5 md:grid-cols-2 ${administrar && painel.administracao ? '2xl:grid-cols-3' : ''}`}>
            <section aria-labelledby="titulo-cobranca" className="vp-panel flex min-w-0 flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><h3 id="titulo-cobranca" className="font-bold">Valor cobrado hoje</h3><Icone nome="tarifas" className="h-5 w-5 text-teal-700" /></div>
              <p className="mt-5 break-words text-3xl font-extrabold tracking-tight tabular-nums">{moeda.format(painel.gestao.valor_cobrado_hoje)}</p>
              <div className="mt-3 self-start"><Selo tom="sucesso">Saídas de horistas</Selo></div>
              <p className="mt-4 mb-6 text-sm leading-relaxed text-muted">Soma dos valores gravados nas saídas de hoje. O sistema não controla recebimentos.</p>
              <Link to="/movimentacoes/historico" className="vp-button vp-button-secondary mt-auto w-full self-end">Consultar histórico<Icone nome="seta" className="h-4 w-4" /></Link>
            </section>
            <ClientesAtivos clientes={painel.gestao.clientes_ativos} />
            {administrar && painel.administracao && <section aria-labelledby="titulo-administracao" className="vp-panel flex min-w-0 flex-col p-5 sm:p-6 md:col-span-2 2xl:col-span-1">
              <div className="flex items-center justify-between gap-3"><h3 id="titulo-administracao" className="font-bold">Acessos ao sistema</h3><Icone nome="usuarios" className="h-5 w-5 text-primary" /></div>
              <p className="mt-2 text-sm text-muted">Situação dos usuários cadastrados.</p>
              <dl className="my-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><dt className="text-xs font-semibold text-emerald-900">Ativos</dt><dd className="mt-2 text-3xl font-extrabold tabular-nums">{inteiro.format(painel.administracao.usuarios_ativos)}</dd></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><dt className="text-xs font-semibold text-muted">Inativos</dt><dd className="mt-2 text-3xl font-extrabold tabular-nums">{inteiro.format(painel.administracao.usuarios_inativos)}</dd></div>
              </dl>
              <Link to="/usuarios" className="vp-button vp-button-secondary mt-auto w-full">Gerenciar usuários<Icone nome="seta" className="h-4 w-4" /></Link>
            </section>}
          </div>
        </section>}
        <p className="text-xs leading-relaxed text-muted">Os indicadores do dia seguem o horário de São Paulo. Use “Atualizar” para consultar os dados novamente.</p>
      </div>}
    </section>
  );
}
