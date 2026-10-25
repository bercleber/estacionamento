import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { consultarPainel } from '../services/painel.service.js';

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo',
});
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');

function Indicador({ titulo, valor, descricao }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <dt className="text-sm font-medium text-slate-600">{titulo}</dt>
      <dd className="mt-3 break-words text-3xl font-semibold tracking-tight tabular-nums">{valor}</dd>
      {descricao && <dd className="mt-2 text-sm text-slate-500">{descricao}</dd>}
    </div>
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
    { caminho: '/movimentacoes', titulo: 'Movimentações', descricao: 'Registrar entradas e saídas e consultar veículos estacionados.' },
    { caminho: '/movimentacoes/historico', titulo: 'Histórico', descricao: 'Consultar movimentações e seus detalhes.' },
    { caminho: '/clientes', titulo: 'Clientes', descricao: 'Cadastrar clientes e gerenciar seus veículos e endereços.' },
  ];
  if (gerenciar) atalhos.push(
    { caminho: '/vagas', titulo: 'Vagas', descricao: 'Consultar e gerenciar as vagas do estacionamento.' },
    { caminho: '/tarifas', titulo: 'Tarifas', descricao: 'Consultar e alterar os valores por hora e por mês.' },
  );
  if (administrar) atalhos.push({ caminho: '/usuarios', titulo: 'Usuários', descricao: 'Gerenciar os usuários e seus perfis de acesso.' });

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
    <section aria-labelledby="titulo-inicio" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="titulo-inicio" className="text-2xl font-semibold tracking-tight">Início</h1>
          <p className="mt-2 text-sm text-slate-600">Acompanhe a situação do estacionamento e os movimentos de hoje.</p>
        </div>
        <Botao variante="secundario" disabled={carregando} onClick={() => setAtualizacao((atual) => atual + 1)}>Atualizar</Botao>
      </div>

      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}
      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando indicadores…</p> : !erro && painel && (
        <div className="space-y-6">
          <p className="text-sm text-slate-500">
            Última consulta: <time dateTime={painel.consultado_em}>{dataHora.format(new Date(painel.consultado_em))}</time>.
            {' '}Horários e indicadores do dia seguem o fuso de São Paulo.
          </p>
          <section aria-labelledby="titulo-operacao" className="space-y-3">
            <h2 id="titulo-operacao" className="text-lg font-semibold">Operação</h2>
            <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Indicador titulo="Vagas comuns livres" valor={inteiro.format(painel.operacao.vagas_livres)} descricao="Ativas, desocupadas e sem reserva cativa." />
              <Indicador titulo="Vagas ocupadas" valor={inteiro.format(painel.operacao.vagas_ocupadas)} descricao="Inclui vagas cativas com veículo estacionado." />
              <Indicador titulo="Vagas cativas desocupadas" valor={inteiro.format(painel.operacao.vagas_cativas_desocupadas)} descricao="Reservadas para os clientes vinculados." />
              <Indicador titulo="Entradas de hoje" valor={inteiro.format(painel.operacao.entradas_hoje)} />
              <Indicador titulo="Saídas de hoje" valor={inteiro.format(painel.operacao.saidas_hoje)} />
            </dl>
          </section>
          {gerenciar && painel.gestao && (
            <section aria-labelledby="titulo-gestao" className="space-y-3">
              <h2 id="titulo-gestao" className="text-lg font-semibold">Gestão</h2>
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Indicador titulo="Vagas inativas" valor={inteiro.format(painel.gestao.vagas_inativas)} />
                <Indicador titulo="Clientes horistas ativos" valor={inteiro.format(painel.gestao.clientes_ativos.horistas)} />
                <Indicador titulo="Clientes mensalistas ativos" valor={inteiro.format(painel.gestao.clientes_ativos.mensalistas)} />
                <Indicador titulo="Valor cobrado hoje" valor={moeda.format(painel.gestao.valor_cobrado_hoje)} descricao="Valores gravados nas saídas de horistas de hoje. O sistema não controla recebimentos." />
              </dl>
            </section>
          )}
          {administrar && painel.administracao && (
            <section aria-labelledby="titulo-administracao" className="space-y-3">
              <h2 id="titulo-administracao" className="text-lg font-semibold">Administração</h2>
              <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Indicador titulo="Usuários ativos" valor={inteiro.format(painel.administracao.usuarios_ativos)} />
                <Indicador titulo="Usuários inativos" valor={inteiro.format(painel.administracao.usuarios_inativos)} />
              </dl>
            </section>
          )}
        </div>
      )}

      <nav aria-labelledby="titulo-atalhos" className="space-y-3">
        <h2 id="titulo-atalhos" className="text-lg font-semibold">Acesso rápido</h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {atalhos.map(({ caminho, titulo, descricao }) => (
            <li key={caminho}>
              <Link to={caminho} className="block h-full rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">
                <span className="font-semibold">{titulo}<span aria-hidden="true" className="ml-2">→</span></span>
                <span className="mt-2 block text-sm text-slate-600">{descricao}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
