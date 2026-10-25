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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="titulo-tarifas" className="text-2xl font-semibold tracking-tight">Tarifas</h1>
          <p className="mt-2 text-sm text-slate-600">Consulte os valores por hora e por mês do estacionamento.</p>
        </div>
        {podeGerenciar && !carregando && !erro && (
          <Botao onClick={() => { setSucesso(''); setFormularioAberto(true); }}>
            {tarifa ? 'Alterar tarifas' : 'Cadastrar tarifas'}
          </Botao>
        )}
      </div>

      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}

      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando tarifas…</p> : !erro && (
        tarifa ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <dt className="text-sm font-medium text-slate-600">Valor por hora</dt>
              <dd className="mt-3 break-words text-2xl font-semibold tracking-tight">{moeda.format(tarifa.valor_hora)}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <dt className="text-sm font-medium text-slate-600">Valor mensal</dt>
              <dd className="mt-3 break-words text-2xl font-semibold tracking-tight">{moeda.format(tarifa.valor_mes)}</dd>
            </div>
          </dl>
        ) : <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Nenhuma tarifa cadastrada.</p>
      )}

      {podeGerenciar && formularioAberto && (
        <FormularioTarifas tarifa={tarifa} onFechar={() => setFormularioAberto(false)} onSalvo={concluir} />
      )}
    </section>
  );
}
