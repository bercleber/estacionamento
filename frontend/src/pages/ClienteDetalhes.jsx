import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { consultarCliente } from '../services/clientes.service.js';
import { useAuth } from '../hooks/useAuth.js';
import FormularioCliente from '../components/clientes/FormularioCliente.jsx';
import ConfirmarSituacaoCliente from '../components/clientes/ConfirmarSituacaoCliente.jsx';
import EnderecosCliente from '../components/clientes/EnderecosCliente.jsx';
import VagaCativaCliente from '../components/clientes/VagaCativaCliente.jsx';
import VeiculosCliente from '../components/clientes/VeiculosCliente.jsx';
import FormularioVeiculo from '../components/clientes/FormularioVeiculo.jsx';
import ConfirmarSituacaoVeiculo from '../components/clientes/ConfirmarSituacaoVeiculo.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';

export default function ClienteDetalhes() {
  const { id } = useParams();
  const { state } = useLocation();
  const { usuario } = useAuth();
  const podeGerenciar = ['ADMINISTRADOR', 'GERENTE'].includes(usuario.perfil);
  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(state?.cadastroConcluido ? 'Cliente e veículo cadastrados com sucesso.' : '');
  const [modal, setModal] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    setModal(null);
    consultarCliente(id, { signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setCliente(dados); })
      .catch((error) => {
        if (!controller.signal.aborted) setErro([400, 404].includes(error.status) ? error.message : 'Não foi possível carregar o cliente. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [id, atualizacao]);

  function abrir(tipo, veiculo = null) { setSucesso(''); setModal({ tipo, veiculo }); }
  function concluir(mensagem) {
    setModal(null);
    setSucesso(mensagem);
    setAtualizacao((atual) => atual + 1);
  }

  return (
    <section aria-label="Ficha do cliente" className="space-y-6">
      <Link to="/clientes" className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-slate-600 underline underline-offset-4">Voltar para clientes</Link>
      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando cliente…</p> : erro ? (
        <div className="space-y-3">
          <h1 id="titulo-ficha-cliente" className="text-2xl font-semibold">Ficha do cliente</h1>
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      ) : cliente && (
        <>
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Ficha do cliente</p>
                <h1 id="titulo-ficha-cliente" className="mt-1 break-words text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{cliente.tipo === 'MENSALISTA' ? 'Mensalista' : 'Horista'}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${cliente.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-500">CPF</dt><dd className="mt-1">{cliente.cpf?.replace(/^([0-9]{3})([0-9]{3})([0-9]{3})([0-9]{2})$/, '$1.$2.$3-$4') ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Telefone</dt><dd className="mt-1 break-words">{cliente.telefone ?? '—'}</dd></div>
              <div><dt className="text-slate-500">Vaga cativa</dt><dd className="mt-1">{cliente.vaga_cativa_numero ?? 'Sem vínculo'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Botao variante="secundario" onClick={() => abrir('cliente')}>Editar cliente</Botao>
              <Botao variante="secundario" onClick={() => abrir('enderecos')}>Endereços</Botao>
              {podeGerenciar && (
                <>
                  {(cliente.tipo === 'MENSALISTA' || cliente.vaga_cativa_id !== null) && <Botao variante="secundario" onClick={() => abrir('vaga')}>Vaga cativa</Botao>}
                  <Botao variante="secundario" onClick={() => abrir('situacao')}>{cliente.ativo ? 'Inativar cliente' : 'Ativar cliente'}</Botao>
                </>
              )}
            </div>
          </div>
          <Mensagem tipo="sucesso">{sucesso}</Mensagem>
          <VeiculosCliente cliente={cliente} podeGerenciar={podeGerenciar}
            onNovo={() => abrir('veiculo')} onEditar={(veiculo) => abrir('veiculo', veiculo)} onSituacao={(veiculo) => abrir('veiculo-situacao', veiculo)} />

          {modal?.tipo === 'cliente' && <FormularioCliente cliente={cliente} onFechar={() => setModal(null)} onSalvo={() => concluir('Cliente atualizado com sucesso.')} />}
          {modal?.tipo === 'enderecos' && <EnderecosCliente cliente={cliente} onFechar={() => setModal(null)} />}
          {podeGerenciar && modal?.tipo === 'situacao' && <ConfirmarSituacaoCliente cliente={cliente} onFechar={() => setModal(null)}
            onConfirmado={(salvo) => concluir(salvo.ativo ? 'Cliente ativado com sucesso.' : 'Cliente inativado com sucesso.')} />}
          {podeGerenciar && modal?.tipo === 'vaga' && <VagaCativaCliente cliente={cliente} onFechar={() => setModal(null)} onSalvo={() => concluir('Vaga cativa atualizada com sucesso.')} />}
          {modal?.tipo === 'veiculo' && <FormularioVeiculo cliente={cliente} veiculo={modal.veiculo} onFechar={() => setModal(null)}
            onSalvo={() => concluir(modal.veiculo ? 'Veículo atualizado com sucesso.' : 'Veículo adicionado com sucesso.')} />}
          {podeGerenciar && modal?.tipo === 'veiculo-situacao' && <ConfirmarSituacaoVeiculo cliente={cliente} veiculo={modal.veiculo} onFechar={() => setModal(null)}
            onConfirmado={(salvo) => concluir(salvo.ativo ? 'Veículo ativado com sucesso.' : 'Veículo inativado com sucesso.')} />}
        </>
      )}
    </section>
  );
}
