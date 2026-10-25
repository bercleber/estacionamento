import Icone from '../ui/Icone.jsx';
import Carregando from '../ui/Carregando.jsx';
import { useEffect, useState } from 'react';
import { consultarPreviaSaida, registrarSaida } from '../../services/movimentacoes.service.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

function formatarDuracao(segundos) {
  return `${Math.floor(segundos / 3600)}h ${Math.floor((segundos % 3600) / 60)}min ${segundos % 60}s`;
}

export default function RegistrarSaida({ movimentacao, onFechar, onRegistrada }) {
  const [previa, setPrevia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [encerrada, setEncerrada] = useState(false);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setPrevia(null);
    setErro('');
    setEncerrada(false);
    consultarPreviaSaida(movimentacao.id, { signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setPrevia(dados); })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setErro([400, 404, 409].includes(error.status) ? error.message : 'Não foi possível consultar a prévia. Tente novamente.');
        setEncerrada(error.status === 404 || error.codigo === 'SAIDA_JA_REGISTRADA');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [movimentacao.id, atualizacao]);

  async function confirmar(event) {
    event.preventDefault();
    if (!previa || carregando || enviando || encerrada) return;
    setEnviando(true);
    setErro('');
    try { onRegistrada(await registrarSaida(movimentacao.id)); }
    catch (error) {
      setErro([400, 404, 409].includes(error.status) ? error.message : 'Não foi possível registrar a saída. Tente novamente.');
      if ([404, 409].includes(error.status)) setPrevia(null);
      setEncerrada(error.status === 404 || error.codigo === 'SAIDA_JA_REGISTRADA');
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo="Registrar saída" onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={confirmar} className="space-y-5" aria-busy={carregando || enviando}>
        <div><p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Veículo</p><span className="vp-plate text-xl">{movimentacao.placa_registrada}</span></div>
        <Mensagem>{erro}</Mensagem>
        {carregando ? <Carregando>Calculando prévia da saída…</Carregando> : previa && (
          <>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-teal-50 p-5 sm:p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-900"><Icone nome="tarifas" />Valor previsto</p>
              <p className="mt-3 break-words text-4xl font-extrabold tracking-tight text-ink tabular-nums">{moeda.format(previa.valor_total)}</p>
              <p className="mt-2 text-sm text-muted">{previa.movimentacao.tipo === 'MENSALISTA'
                ? 'Mensalista: sem cobrança por hora.'
                : 'Hora iniciada, com tolerância de 5 minutos na virada de cada hora. Até 5 minutos, a permanência é gratuita.'}</p>
            </div>
            <dl className="vp-record-details sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-muted">Cliente</dt><dd className="mt-1 break-words font-medium">{previa.movimentacao.cliente_nome}</dd></div>
              <div><dt className="text-muted">Modelo</dt><dd className="mt-1 break-words">{previa.movimentacao.modelo ?? '—'}</dd></div>
              <div><dt className="text-muted">Cor</dt><dd className="mt-1 break-words">{previa.movimentacao.cor ?? '—'}</dd></div>
              <div><dt className="text-muted">Vaga</dt><dd className="mt-1">{previa.movimentacao.vaga_numero}</dd></div>
              <div><dt className="text-muted">Tipo registrado na entrada</dt><dd className="mt-1">{previa.movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</dd></div>
              <div><dt className="text-muted">Entrada</dt><dd className="mt-1">{dataHora.format(new Date(previa.movimentacao.entrada_em))}</dd></div>
              <div><dt className="text-muted">Saída prevista</dt><dd className="mt-1">{dataHora.format(new Date(previa.saida_prevista_em))}</dd></div>
              <div><dt className="text-muted">Tempo estacionado</dt><dd className="mt-1">{formatarDuracao(previa.tempo_total_segundos)}</dd></div>
              <div><dt className="text-muted">Horas cobradas</dt><dd className="mt-1">{previa.horas_cobradas}</dd></div>
              {previa.movimentacao.tipo === 'HORISTA' && <div className="sm:col-span-2"><dt className="text-muted">Tarifa registrada na entrada</dt><dd className="mt-1">{moeda.format(previa.movimentacao.valor_hora_aplicado)} por hora</dd></div>}
            </dl>

            <p className="text-sm text-muted">O horário e o valor final serão recalculados ao confirmar. A cobrança pode mudar se a permanência ultrapassar uma faixa.</p>
          </>
        )}
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>{encerrada ? 'Fechar' : 'Cancelar'}</Botao>
          {!encerrada && <Botao variante="secundario" disabled={carregando || enviando}
            onClick={() => setAtualizacao((atual) => atual + 1)}>Atualizar prévia</Botao>}
          {!encerrada && <Botao type="submit" disabled={!previa || carregando || enviando}>{enviando ? 'Registrando…' : 'Confirmar saída'}</Botao>}
        </div>
      </form>
    </Modal>
  );
}
