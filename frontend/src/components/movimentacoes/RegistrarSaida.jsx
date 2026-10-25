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
        <p className="font-mono text-lg font-semibold tracking-wider">{movimentacao.placa_registrada}</p>
        <Mensagem>{erro}</Mensagem>
        {carregando ? <p role="status" className="text-sm text-slate-600">Calculando prévia da saída…</p> : previa && (
          <>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-slate-500">Cliente</dt><dd className="mt-1 break-words font-medium">{previa.movimentacao.cliente_nome}</dd></div>
              <div><dt className="text-slate-500">Modelo</dt><dd className="mt-1 break-words">{previa.movimentacao.modelo ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Cor</dt><dd className="mt-1 break-words">{previa.movimentacao.cor ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Vaga</dt><dd className="mt-1">{previa.movimentacao.vaga_numero}</dd></div>
              <div><dt className="text-slate-500">Tipo registrado na entrada</dt><dd className="mt-1">{previa.movimentacao.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</dd></div>
              <div><dt className="text-slate-500">Entrada</dt><dd className="mt-1">{dataHora.format(new Date(previa.movimentacao.entrada_em))}</dd></div>
              <div><dt className="text-slate-500">Saída prevista</dt><dd className="mt-1">{dataHora.format(new Date(previa.saida_prevista_em))}</dd></div>
              <div><dt className="text-slate-500">Tempo estacionado</dt><dd className="mt-1">{formatarDuracao(previa.tempo_total_segundos)}</dd></div>
              <div><dt className="text-slate-500">Horas cobradas</dt><dd className="mt-1">{previa.horas_cobradas}</dd></div>
              {previa.movimentacao.tipo === 'HORISTA' && <div className="sm:col-span-2"><dt className="text-slate-500">Tarifa registrada na entrada</dt><dd className="mt-1">{moeda.format(previa.movimentacao.valor_hora_aplicado)} por hora</dd></div>}
            </dl>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Valor previsto</p>
              <p className="mt-1 text-2xl font-semibold">{moeda.format(previa.valor_total)}</p>
              <p className="mt-2 text-sm text-slate-600">{previa.movimentacao.tipo === 'MENSALISTA'
                ? 'Mensalista: sem cobrança por hora.'
                : 'Hora iniciada, com tolerância de 5 minutos na virada de cada hora. Até 5 minutos, a permanência é gratuita.'}</p>
            </div>
            <p className="text-sm text-slate-600">O horário e o valor final serão recalculados ao confirmar. A cobrança pode mudar se a permanência ultrapassar uma faixa.</p>
          </>
        )}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>{encerrada ? 'Fechar' : 'Cancelar'}</Botao>
          {!encerrada && <Botao variante="secundario" disabled={carregando || enviando}
            onClick={() => setAtualizacao((atual) => atual + 1)}>Atualizar prévia</Botao>}
          {!encerrada && <Botao type="submit" disabled={!previa || carregando || enviando}>{enviando ? 'Registrando…' : 'Confirmar saída'}</Botao>}
        </div>
      </form>
    </Modal>
  );
}
