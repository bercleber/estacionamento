import TituloPagina from '../components/ui/TituloPagina.jsx';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';
import Carregando from '../components/ui/Carregando.jsx';
import { useEffect, useState } from 'react';
import FormularioTarifas from '../components/tarifas/FormularioTarifas.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { consultarTarifas } from '../services/tarifas.service.js';
import { useAuth } from '../hooks/useAuth.js';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Tarifas() {
  const { usuario } = useAuth();
  const podeGerenciar = ['ADMINISTRADOR', 'GERENTE'].includes(usuario.perfil);
  const [tarifa, setTarifa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    consultarTarifas({ signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setTarifa(dados); })
      .catch(() => {
        if (!controller.signal.aborted) setErro('Não foi possível carregar as tarifas. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function concluir(salva) {
    setSucesso(tarifa ? 'Tarifas atualizadas com sucesso.' : 'Tarifas cadastradas com sucesso.');
    setTarifa(salva);
    setFormularioAberto(false);
  }

  return (
    <section aria-labelledby="titulo-tarifas" className="space-y-6">
      <TituloPagina id="titulo-tarifas" icone="tarifas" titulo="Tarifas" descricao="Consulte os valores por hora e por mês do estacionamento.">
        {podeGerenciar && !carregando && !erro && <Botao onClick={() => { setSucesso(''); setFormularioAberto(true); }}><Icone nome={tarifa ? 'editar' : 'adicionar'} />{tarifa ? 'Alterar tarifas' : 'Cadastrar tarifas'}</Botao>}
      </TituloPagina>

      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}

      {carregando ? <Carregando>Carregando tarifas…</Carregando> : !erro && (
        tarifa ? (
          <dl className="grid gap-5 md:grid-cols-2">
            <div className="vp-panel border-t-4 border-t-blue-500 p-6 sm:p-8">
              <dt className="flex items-center gap-3 text-sm font-bold text-muted"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icone nome="relogio" /></span>Valor por hora</dt>
              <dd className="mt-6 break-words text-4xl font-extrabold tracking-tight text-ink tabular-nums">{moeda.format(tarifa.valor_hora)}</dd>
              <dd className="mt-3 text-sm text-muted">Tarifa para permanências de clientes horistas.</dd>
            </div>
            <div className="vp-panel border-t-4 border-t-teal-500 p-6 sm:p-8">
              <dt className="flex items-center gap-3 text-sm font-bold text-muted"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icone nome="calendario" /></span>Valor mensal</dt>
              <dd className="mt-6 break-words text-4xl font-extrabold tracking-tight text-ink tabular-nums">{moeda.format(tarifa.valor_mes)}</dd>
              <dd className="mt-3 text-sm text-muted">Tarifa mensal de referência para mensalistas.</dd>
            </div>
          </dl>
        ) : <EstadoVazio icone="tarifas" titulo="Nenhuma tarifa cadastrada" descricao={podeGerenciar ? 'Cadastre os valores para começar a utilizar as tarifas do estacionamento.' : 'Os valores aparecerão aqui após o cadastro.'} />
      )}

      {podeGerenciar && formularioAberto && (
        <FormularioTarifas tarifa={tarifa} onFechar={() => setFormularioAberto(false)} onSalvo={concluir} />
      )}
    </section>
  );
}
