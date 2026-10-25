import Selo from '../ui/Selo.jsx';
import Carregando from '../ui/Carregando.jsx';
import { useEffect, useState } from 'react';
import { consultarMovimentacao } from '../../services/movimentacoes.service.js';
import { formatarDataHora, formatarDuracao } from '../../utils/historico.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DetalhesMovimentacao({ id, onFechar }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    consultarMovimentacao(id, { signal: controller.signal })
      .then((resposta) => { if (!controller.signal.aborted) setDados(resposta); })
      .catch((error) => {
        if (!controller.signal.aborted) setErro([400, 404].includes(error.status) ? error.message : 'Não foi possível consultar os detalhes. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [id, atualizacao]);

  const aberta = dados?.situacao === 'ABERTA';
  return (
    <Modal titulo={`Detalhes da movimentação #${id}`} onFechar={onFechar} ampla>
      <div className="space-y-5">
        {carregando ? <Carregando>Carregando detalhes…</Carregando> : erro ? <Mensagem>{erro}</Mensagem> : dados && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="vp-plate text-xl">{dados.placa_registrada}</h3>
              <Selo tom={aberta ? 'aviso' : 'neutro'}>{aberta ? 'Aberta' : 'Encerrada'}</Selo>
            </div>
            <dl className="vp-record-details sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="text-muted">Cliente</dt><dd className="mt-1 break-words font-medium">{dados.cliente_nome}</dd></div>
              <div><dt className="text-muted">Modelo</dt><dd className="mt-1 break-words">{dados.modelo ?? 'Não informado'}</dd></div>
              <div><dt className="text-muted">Cor</dt><dd className="mt-1 break-words">{dados.cor ?? 'Não informada'}</dd></div>
              <div><dt className="text-muted">Tipo registrado na entrada</dt><dd className="mt-1">{dados.tipo === 'HORISTA' ? 'Horista' : 'Mensalista'}</dd></div>
              <div><dt className="text-muted">Vaga</dt><dd className="mt-1">{dados.vaga_numero}</dd></div>
              <div><dt className="text-muted">Entrada</dt><dd className="mt-1">{formatarDataHora(dados.entrada_em)}</dd></div>
              <div><dt className="text-muted">Saída</dt><dd className="mt-1">{formatarDataHora(dados.saida_em)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted">{aberta ? 'Tempo estacionado até a consulta' : 'Tempo estacionado'}</dt><dd className="mt-1">{formatarDuracao(dados.tempo_total_segundos)}</dd></div>
              <div><dt className="text-muted">Operador da entrada</dt><dd className="mt-1 break-words">{dados.usuario_entrada_nome}</dd></div>
              <div><dt className="text-muted">Operador da saída</dt><dd className="mt-1 break-words">{aberta ? 'Pendente' : dados.usuario_saida_nome ?? 'Não informado'}</dd></div>
              <div><dt className="text-muted">Tarifa por hora registrada</dt><dd className="mt-1">{dados.valor_hora_aplicado === null ? (dados.tipo === 'MENSALISTA' ? 'Não se aplica' : 'Não informada') : moeda.format(dados.valor_hora_aplicado)}</dd></div>
              <div className="vp-inset sm:col-span-2"><dt className="text-muted">Valor final registrado</dt><dd className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{aberta ? 'Pendente' : dados.valor_total === null ? 'Não informado' : moeda.format(dados.valor_total)}</dd></div>
            </dl>
            {aberta && <p className="text-sm text-muted">Movimentação em aberto. O valor será calculado ao registrar a saída.</p>}
            <p className="text-xs text-muted">Consulta em {formatarDataHora(dados.consultado_em)}. Horários de São Paulo.</p>
          </>
        )}
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar}>Fechar</Botao>
          <Botao variante="secundario" disabled={carregando} onClick={() => setAtualizacao((atual) => atual + 1)}>{erro ? 'Tentar novamente' : 'Atualizar consulta'}</Botao>
        </div>
      </div>
    </Modal>
  );
}
