import Icone from '../ui/Icone.jsx';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { consultarEntrada, registrarEntrada } from '../../services/movimentacoes.service.js';
import Botao from '../ui/Botao.jsx';
import Campo from '../ui/Campo.jsx';
import Select from '../ui/Select.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function RegistrarEntrada({ onFechar, onRegistrada }) {
  const [placa, setPlaca] = useState('');
  const [consulta, setConsulta] = useState(null);
  const [vagaId, setVagaId] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [naoCadastrado, setNaoCadastrado] = useState(false);
  const buscaRef = useRef(null);

  useEffect(() => () => buscaRef.current?.abort(), []);

  async function buscar(event) {
    event.preventDefault();
    if (buscando || enviando) return;
    const controller = new AbortController();
    buscaRef.current?.abort();
    buscaRef.current = controller;
    setBuscando(true);
    setConsulta(null);
    setVagaId('');
    setErro('');
    setNaoCadastrado(false);
    try {
      const dados = await consultarEntrada(placa, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setConsulta(dados);
      setVagaId(dados.vagas_permitidas.length === 1 ? String(dados.vagas_permitidas[0].id) : '');
    } catch (error) {
      if (!controller.signal.aborted) {
        setErro([400, 404, 409].includes(error.status) ? error.message : 'Não foi possível consultar a placa. Tente novamente.');
        setNaoCadastrado(error.codigo === 'VEICULO_NAO_ENCONTRADO');
      }
    } finally {
      if (!controller.signal.aborted) setBuscando(false);
    }
  }

  async function confirmar(event) {
    event.preventDefault();
    if (enviando || buscando || !consulta) return;
    if (!vagaId) { setErro('Selecione uma vaga disponível.'); return; }
    setEnviando(true);
    setErro('');
    try {
      onRegistrada(await registrarEntrada({ veiculo_id: consulta.veiculo.id, vaga_id: Number(vagaId) }));
    } catch (error) {
      setErro([400, 404, 409].includes(error.status) ? error.message : 'Não foi possível registrar a entrada. Tente novamente.');
      if ([404, 409].includes(error.status)) {
        setConsulta(null);
        setVagaId('');
      }
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo="Registrar entrada" onFechar={onFechar} bloqueada={enviando}>
      <div className="space-y-5">
        <form onSubmit={buscar} className="space-y-4" aria-busy={buscando}>
          <Campo label="Placa do veículo" name="placa" className="font-mono uppercase tracking-wider" value={placa} maxLength={10}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} required autoFocus disabled={buscando || enviando}
            onChange={(event) => {
              setPlaca(event.target.value);
              setConsulta(null);
              setVagaId('');
              setErro('');
              setNaoCadastrado(false);
            }} />
          <Botao type="submit" variante="secundario" disabled={buscando || enviando}><Icone nome="buscar" />{buscando ? 'Consultando…' : 'Buscar placa'}</Botao>
        </form>

        <Mensagem>{erro}</Mensagem>
        {naoCadastrado && <Link to="/clientes" onClick={onFechar} className="vp-button vp-button-secondary">Ir para clientes para cadastrar o veículo</Link>}

        {consulta && (
          <form onSubmit={confirmar} className="space-y-5 border-t border-slate-200 pt-5" aria-busy={enviando}>
            <div className="vp-inset space-y-4">
              <p className="vp-plate text-lg">{consulta.veiculo.placa}</p>
              <dl className="vp-record-details sm:grid-cols-2">
                <div className="sm:col-span-2"><dt className="text-muted">Cliente</dt><dd className="mt-1 break-words font-medium">{consulta.cliente.nome}</dd></div>
                <div><dt className="text-muted">Modelo</dt><dd className="mt-1 break-words">{consulta.veiculo.modelo ?? '—'}</dd></div>
                <div><dt className="text-muted">Cor</dt><dd className="mt-1 break-words">{consulta.veiculo.cor ?? '—'}</dd></div>
              </dl>
              <p className="text-sm text-muted">{consulta.cliente.tipo === 'HORISTA'
                ? `Horista — tarifa atual de ${moeda.format(consulta.valor_hora)} por hora. O valor é fixado na confirmação.`
                : 'Mensalista — sem cobrança por hora.'}</p>
            </div>

            {consulta.vagas_permitidas.length === 0 ? (
              <Mensagem>{consulta.cliente.vaga_cativa_id !== null
                ? 'A vaga cativa do cliente está ocupada ou indisponível. Consulte novamente após sua liberação.'
                : 'Não há vagas comuns livres no momento. Consulte novamente após a liberação de uma vaga.'}</Mensagem>
            ) : (
              <Select label="Vaga" name="vaga_id" value={vagaId} onChange={(event) => setVagaId(event.target.value)} disabled={enviando} required>
                <option value="">Selecione uma vaga</option>
                {consulta.vagas_permitidas.map((vaga) => <option key={vaga.id} value={vaga.id}>Vaga {vaga.numero}</option>)}
              </Select>
            )}
            {consulta.cliente.tipo === 'MENSALISTA' && consulta.cliente.vaga_cativa_id !== null
              && <p className="text-sm text-muted">Este cliente deve utilizar sua própria vaga cativa.</p>}
            <div className="vp-form-actions">
              <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
              <Botao type="submit" disabled={enviando || consulta.vagas_permitidas.length === 0}>{enviando ? 'Registrando…' : 'Confirmar entrada'}</Botao>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
