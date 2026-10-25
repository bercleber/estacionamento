import { useEffect, useState } from 'react';
import { consultarCliente, cadastrarEndereco, editarEndereco, definirEnderecoPrincipal, removerEndereco } from '../../services/clientes.service.js';
import FormularioEndereco from './FormularioEndereco.jsx';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function EnderecosCliente({ cliente, onFechar }) {
  const [enderecos, setEnderecos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [erroCarga, setErroCarga] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [exclusao, setExclusao] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErroCarga('');
    consultarCliente(cliente.id, { signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setEnderecos(dados.enderecos); })
      .catch((error) => {
        if (!controller.signal.aborted) setErroCarga(error.status === 404 ? error.message : 'Não foi possível carregar os endereços. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [cliente.id, atualizacao]);

  async function executar(operacao, mensagem) {
    if (enviando) return;
    setEnviando(true);
    setErro('');
    setSucesso('');
    try {
      await operacao();
      setFormulario(null);
      setExclusao(null);
      setSucesso(mensagem);
      setAtualizacao((atual) => atual + 1);
    } catch (error) {
      setErro([400, 403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível concluir a operação. Tente novamente.');
    } finally { setEnviando(false); }
  }

  function voltar() { setFormulario(null); setExclusao(null); setErro(''); }

  return (
    <Modal titulo={formulario ? (formulario.endereco ? 'Editar endereço' : 'Novo endereço') : exclusao ? 'Remover endereço' : 'Endereços do cliente'} onFechar={onFechar} bloqueada={enviando}>
      <div className="space-y-5" aria-busy={enviando}>
        <p className="break-words text-sm text-slate-600">Cliente: <strong>{cliente.nome}</strong></p>
        <Mensagem>{erro}</Mensagem>
        <Mensagem tipo="sucesso">{sucesso}</Mensagem>
        {formulario ? (
          <FormularioEndereco
            key={formulario.endereco?.id ?? 'novo'} endereco={formulario.endereco} enviando={enviando} onCancelar={voltar}
            onEnviar={(dados) => executar(() => formulario.endereco
              ? editarEndereco(cliente.id, formulario.endereco.id, dados) : cadastrarEndereco(cliente.id, dados),
            formulario.endereco ? 'Endereço atualizado com sucesso.' : 'Endereço adicionado com sucesso.')}
          />
        ) : exclusao ? (
          <div className="space-y-5">
            <p>Deseja remover o endereço <strong className="break-words">{exclusao.logradouro}{exclusao.numero ? `, ${exclusao.numero}` : ''}</strong>?</p>
            {exclusao.principal && <p className="text-sm text-slate-600">Se houver outro endereço, o mais antigo passará a ser o principal.</p>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
              <Botao variante="secundario" onClick={voltar} disabled={enviando} autoFocus>Cancelar</Botao>
              <Botao onClick={() => executar(() => removerEndereco(cliente.id, exclusao.id), 'Endereço removido com sucesso.')} disabled={enviando}>
                {enviando ? 'Removendo…' : 'Remover endereço'}
              </Botao>
            </div>
          </div>
        ) : carregando ? <p role="status" className="text-sm text-slate-600">Carregando endereços…</p> : erroCarga ? (
          <div className="space-y-3">
            <Mensagem>{erroCarga}</Mensagem>
            <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
          </div>
        ) : (
          <>
            <Botao onClick={() => { setErro(''); setSucesso(''); setFormulario({ endereco: null }); }} disabled={enviando}>Adicionar endereço</Botao>
            {enderecos.length === 0 ? <p className="text-sm text-slate-600">Nenhum endereço cadastrado.</p> : (
              <ul className="space-y-4">
                {enderecos.map((endereco) => (
                  <li key={endereco.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                    {endereco.principal && <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Principal</span>}
                    <div className="space-y-1 break-words text-sm">
                      <p className="font-medium">{endereco.logradouro}{endereco.numero ? `, ${endereco.numero}` : ''}</p>
                      {endereco.complemento && <p>{endereco.complemento}</p>}
                      <p>{endereco.bairro ? `${endereco.bairro} — ` : ''}{endereco.cidade} / {endereco.estado}</p>
                      {endereco.cep && <p>CEP: {endereco.cep.replace(/^([0-9]{5})([0-9]{3})$/, '$1-$2')}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Botao variante="secundario" disabled={enviando} aria-label={`Editar endereço ${endereco.logradouro}`}
                        onClick={() => { setErro(''); setSucesso(''); setFormulario({ endereco }); }}>Editar</Botao>
                      {!endereco.principal && <Botao variante="secundario" disabled={enviando}
                        aria-label={`Definir ${endereco.logradouro} como endereço principal`}
                        onClick={() => executar(() => definirEnderecoPrincipal(cliente.id, endereco.id), 'Endereço principal atualizado.')}>Tornar principal</Botao>}
                      <Botao variante="secundario" disabled={enviando} aria-label={`Remover endereço ${endereco.logradouro}`}
                        onClick={() => { setErro(''); setSucesso(''); setExclusao(endereco); }}>Remover</Botao>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
