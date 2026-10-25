import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { consultarCliente, definirEnderecoPrincipal } from '../services/clientes.service.js';
import { useAuth } from '../hooks/useAuth.js';
import FormularioCliente from '../components/clientes/FormularioCliente.jsx';
import ConfirmarSituacaoCliente from '../components/clientes/ConfirmarSituacaoCliente.jsx';
import EnderecosCliente from '../components/clientes/EnderecosCliente.jsx';
import FormularioEndereco from '../components/clientes/FormularioEndereco.jsx';
import ConfirmarRemocaoEndereco from '../components/clientes/ConfirmarRemocaoEndereco.jsx';
import VagaCativaCliente from '../components/clientes/VagaCativaCliente.jsx';
import VeiculosCliente from '../components/clientes/VeiculosCliente.jsx';
import FormularioVeiculo from '../components/clientes/FormularioVeiculo.jsx';
import ConfirmarSituacaoVeiculo from '../components/clientes/ConfirmarSituacaoVeiculo.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import MaisAcoes from '../components/ui/MaisAcoes.jsx';
import { formatarCpf, formatarTelefone } from '../utils/clientes.js';

export default function ClienteDetalhes() {
  const { id } = useParams();
  const { state } = useLocation();
  const { usuario } = useAuth();
  const podeGerenciar = ['ADMINISTRADOR', 'GERENTE'].includes(usuario.perfil);
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState(state?.cadastroConcluido ? { grupo: 'cliente', texto: 'Cliente e veículo cadastrados com sucesso.', tipo: 'sucesso' } : null);
  const [modal, setModal] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const atual = cliente?.id === Number(id) ? cliente : null;

  useEffect(() => {
    setModal(null);
    setAviso(state?.cadastroConcluido ? { grupo: 'cliente', texto: 'Cliente e veículo cadastrados com sucesso.', tipo: 'sucesso' } : null);
  }, [id, state]);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    consultarCliente(id, { signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setCliente(dados); })
      .catch((error) => {
        if (!controller.signal.aborted) setErro([400, 404].includes(error.status) ? error.message : 'Não foi possível carregar o cliente. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [id, atualizacao]);

  function abrir(tipo, item = null) { setAviso(null); setModal({ tipo, item }); }
  function concluir(grupo, texto) {
    setModal(null);
    setAviso({ grupo, texto, tipo: 'sucesso' });
    setAtualizacao((valor) => valor + 1);
  }
  async function tornarPrincipal(endereco) {
    if (enviando) return;
    setEnviando(true);
    setAviso(null);
    try { await definirEnderecoPrincipal(atual.id, endereco.id); concluir('enderecos', 'Endereço principal atualizado.'); }
    catch (error) { setAviso({ grupo: 'enderecos', texto: [400, 403, 404, 409].includes(error.status) ? error.message : 'Não foi possível atualizar o endereço principal. Tente novamente.', tipo: 'erro' }); }
    finally { setEnviando(false); }
  }
  function mensagem(grupo) { return aviso?.grupo === grupo ? <Mensagem tipo={aviso.tipo}>{aviso.texto}</Mensagem> : null; }
  const bloqueioInativacao = atual?.movimentacao_aberta ? 'Registre a saída dos veículos estacionados antes de inativar o cliente.'
    : atual?.vaga_cativa_id ? 'Remova o vínculo da vaga cativa antes de inativar o cliente.' : '';

  return (
    <section aria-label="Ficha do cliente" className="space-y-6">
      <Link to="/clientes" className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-slate-600 underline underline-offset-4">Voltar para clientes</Link>
      {carregando && !atual ? <p role="status" className="text-sm text-slate-600">Carregando cliente…</p> : erro ? (
        <div className="space-y-3"><h1 className="text-2xl font-semibold">Ficha do cliente</h1><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((valor) => valor + 1)}>Tentar novamente</Botao></div>
      ) : atual && (
        <>
          <section aria-labelledby="titulo-ficha-cliente" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0"><p className="text-sm text-slate-500">Ficha do cliente</p><h1 id="titulo-ficha-cliente" className="mt-1 break-words text-2xl font-semibold tracking-tight">{atual.nome}</h1>
                <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{atual.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</span><span className={`rounded-full px-3 py-1 text-xs font-medium ${atual.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{atual.ativo ? 'Ativo' : 'Inativo'}</span></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Botao variante="secundario" onClick={() => abrir('cliente')}>Editar dados</Botao>
                {podeGerenciar && <MaisAcoes ariaLabel="Mais ações do cliente">
                  <Botao variante="secundario" className="w-full" disabled={carregando || (atual.ativo && Boolean(bloqueioInativacao))} onClick={() => abrir('situacao')}>{atual.ativo ? 'Inativar cliente' : 'Ativar cliente'}</Botao>
                  {atual.ativo && bloqueioInativacao && <p className="px-1 text-xs text-slate-600">{bloqueioInativacao}</p>}
                </MaisAcoes>}
              </div>
            </div>
            <dl className="grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-500">CPF</dt><dd className="mt-1">{atual.cpf ? formatarCpf(atual.cpf) : 'Não informado'}</dd></div>
              <div><dt className="text-slate-500">Telefone</dt><dd className="mt-1 break-words">{atual.telefone ? formatarTelefone(atual.telefone) : 'Não informado'}</dd></div>
              {(atual.tipo === 'MENSALISTA' || atual.vaga_cativa_id !== null) && <div>
                <dt className="text-slate-500">Vaga cativa</dt><dd className="mt-1">{atual.vaga_cativa_numero ? `Vaga ${atual.vaga_cativa_numero}` : 'Sem vínculo'}</dd>
                {podeGerenciar && <><Botao variante="secundario" className="mt-2" disabled={carregando || atual.movimentacao_aberta || (!atual.ativo && atual.vaga_cativa_id === null)} onClick={() => abrir('vaga')}>Gerenciar vaga</Botao>
                  {atual.movimentacao_aberta ? <p className="mt-2 text-xs text-amber-800">Registre as saídas antes de alterar a vaga cativa.</p> : !atual.ativo && atual.vaga_cativa_id === null && <p className="mt-2 text-xs text-slate-600">Ative o cliente para atribuir uma vaga cativa.</p>}</>}
              </div>}
            </dl>
            {mensagem('cliente')}
          </section>
          <div className="space-y-4">{mensagem('veiculos')}<VeiculosCliente cliente={atual} podeGerenciar={podeGerenciar}
            onNovo={() => abrir('veiculo')} onEditar={(item) => abrir('veiculo', item)} onSituacao={(item) => abrir('veiculo-situacao', item)} /></div>
          <div className="space-y-4">{mensagem('enderecos')}<EnderecosCliente cliente={atual} enviando={enviando || carregando}
            onNovo={() => abrir('endereco')} onEditar={(item) => abrir('endereco', item)} onPrincipal={tornarPrincipal} onRemover={(item) => abrir('remover-endereco', item)} /></div>

          {modal?.tipo === 'cliente' && <FormularioCliente cliente={atual} onFechar={() => setModal(null)} onSalvo={() => concluir('cliente', 'Dados do cliente atualizados com sucesso.')} />}
          {modal?.tipo === 'endereco' && <FormularioEndereco cliente={atual} endereco={modal.item} onFechar={() => setModal(null)} onSalvo={() => concluir('enderecos', modal.item ? 'Endereço atualizado com sucesso.' : 'Endereço adicionado com sucesso.')} />}
          {modal?.tipo === 'remover-endereco' && <ConfirmarRemocaoEndereco cliente={atual} endereco={modal.item} onFechar={() => setModal(null)} onConfirmado={() => concluir('enderecos', 'Endereço removido com sucesso.')} />}
          {podeGerenciar && modal?.tipo === 'situacao' && <ConfirmarSituacaoCliente cliente={atual} onFechar={() => setModal(null)} onConfirmado={(salvo) => concluir('cliente', salvo.ativo ? 'Cliente ativado com sucesso.' : 'Cliente inativado com sucesso.')} />}
          {podeGerenciar && modal?.tipo === 'vaga' && <VagaCativaCliente cliente={atual} onFechar={() => setModal(null)} onSalvo={() => concluir('cliente', 'Vaga cativa atualizada com sucesso.')} />}
          {modal?.tipo === 'veiculo' && <FormularioVeiculo cliente={atual} veiculo={modal.item} onFechar={() => setModal(null)} onSalvo={() => concluir('veiculos', modal.item ? 'Veículo atualizado com sucesso.' : 'Veículo adicionado com sucesso.')} />}
          {podeGerenciar && modal?.tipo === 'veiculo-situacao' && <ConfirmarSituacaoVeiculo cliente={atual} veiculo={modal.item} onFechar={() => setModal(null)} onConfirmado={(salvo) => concluir('veiculos', salvo.ativo ? 'Veículo ativado com sucesso.' : 'Veículo inativado com sucesso.')} />}
        </>
      )}
    </section>
  );
}
