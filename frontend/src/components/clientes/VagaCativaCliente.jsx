import Carregando from '../ui/Carregando.jsx';
import { useEffect, useState } from 'react';
import { alterarVagaCativa, consultarCliente } from '../../services/clientes.service.js';
import { listarVagas } from '../../services/vagas.service.js';
import Botao from '../ui/Botao.jsx';
import Select from '../ui/Select.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';
import useAlteracoesPendentes from '../../hooks/useAlteracoesPendentes.js';

export default function VagaCativaCliente({ cliente, onFechar, onSalvo }) {
  const [atual, setAtual] = useState(cliente);
  const [vagas, setVagas] = useState([]);
  const [vagaId, setVagaId] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroCarga, setErroCarga] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const { permitirSaida, podeFechar } = useAlteracoesPendentes(!carregando && vagaId !== (atual.vaga_cativa_id === null ? '' : String(atual.vaga_cativa_id)));
  function fechar() { if (podeFechar()) onFechar(); }

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErroCarga('');
    Promise.all([consultarCliente(cliente.id, { signal: controller.signal }), listarVagas({ signal: controller.signal })])
      .then(([dados, opcoes]) => {
        if (controller.signal.aborted) return;
        setAtual(dados);
        setVagas(opcoes);
        setVagaId(dados.vaga_cativa_id === null ? '' : String(dados.vaga_cativa_id));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setErroCarga(error.status === 404 ? error.message : 'Não foi possível carregar o cliente e as vagas. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [cliente.id, atualizacao]);

  const elegivel = atual.ativo && atual.tipo === 'MENSALISTA';
  const opcoes = vagas.filter((vaga) => vaga.id === atual.vaga_cativa_id || (elegivel && vaga.disponibilidade === 'LIVRE'));

  async function enviar(event) {
    event.preventDefault();
    if (enviando || carregando || erroCarga) return;
    setEnviando(true);
    setErro('');
    try {
      const salvo = await alterarVagaCativa(cliente.id, vagaId === '' ? null : Number(vagaId));
      permitirSaida();
      onSalvo(salvo);
    }
    catch (error) {
      setErro([400, 403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível atualizar a vaga cativa. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo="Vaga cativa" onFechar={fechar} bloqueada={enviando}>
      <div className="space-y-5">
        <p className="break-words text-sm text-muted">Cliente: <strong>{atual.nome}</strong></p>
        {carregando ? <Carregando>Carregando vagas…</Carregando> : erroCarga ? (
          <div className="space-y-3">
            <Mensagem>{erroCarga}</Mensagem>
            <Botao variante="secundario" onClick={() => setAtualizacao((valor) => valor + 1)}>Tentar novamente</Botao>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
            <Select label="Vaga cativa" value={vagaId} onChange={(event) => setVagaId(event.target.value)} disabled={enviando} autoFocus>
              <option value="">Sem vaga cativa</option>
              {opcoes.map((vaga) => <option key={vaga.id} value={vaga.id}>Vaga {vaga.numero}{vaga.id === atual.vaga_cativa_id ? ' (atual)' : ''}</option>)}
            </Select>
            <p className="text-sm text-muted">
              {elegivel
                ? 'São oferecidas vagas livres e a vaga atual. Para remover o vínculo, selecione “Sem vaga cativa”. O cliente precisa estar sem movimentação em aberto.'
                : 'Somente mensalistas ativos podem receber uma vaga cativa. Um vínculo existente pode ser removido se não houver movimentação em aberto.'}
            </p>
            {elegivel && !vagas.some((vaga) => vaga.disponibilidade === 'LIVRE') && <p className="text-sm text-muted">Não há novas vagas livres para atribuição.</p>}
            <Mensagem>{erro}</Mensagem>
            <div className="vp-form-actions">
              <Botao variante="secundario" onClick={fechar} disabled={enviando}>Cancelar</Botao>
              <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar vínculo'}</Botao>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
