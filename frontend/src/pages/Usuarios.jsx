import { useEffect, useState } from 'react';
import FormularioUsuario from '../components/usuarios/FormularioUsuario.jsx';
import ConfirmarSituacaoUsuario from '../components/usuarios/ConfirmarSituacaoUsuario.jsx';
import Botao from '../components/ui/Botao.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import { listarUsuarios } from '../services/usuarios.service.js';
import { nomesPerfis } from '../utils/perfis.js';
import { useAuth } from '../hooks/useAuth.js';

export default function Usuarios() {
  const { usuario: usuarioAtual, atualizarUsuario, limparSessao } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [formulario, setFormulario] = useState(null);
  const [usuarioSituacao, setUsuarioSituacao] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    listarUsuarios({ signal: controller.signal })
      .then((dados) => { if (!controller.signal.aborted) setUsuarios(dados); })
      .catch((error) => {
        if (!controller.signal.aborted) setErro(error.status === 403
          ? error.message : 'Não foi possível carregar os usuários. Tente novamente.');
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false); });
    return () => controller.abort();
  }, [atualizacao]);

  function abrirFormulario(usuario = null) {
    setSucesso('');
    setFormulario({ usuario });
  }

  function operacaoConcluida(salvo, mensagem) {
    setFormulario(null);
    setUsuarioSituacao(null);
    if (salvo.id === usuarioAtual.id) {
      if (!salvo.ativo || salvo.perfil !== usuarioAtual.perfil) {
        limparSessao();
        return;
      }
      atualizarUsuario(salvo);
    }
    setSucesso(mensagem);
    setAtualizacao((atual) => atual + 1);
  }

  return (
    <section aria-labelledby="titulo-usuarios" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="titulo-usuarios" className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="mt-2 text-sm text-slate-600">Gerencie os usuários e seus acessos ao sistema.</p>
        </div>
        <Botao onClick={() => abrirFormulario()}>Novo usuário</Botao>
      </div>

      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && (
        <div className="space-y-3">
          <Mensagem>{erro}</Mensagem>
          <Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao>
        </div>
      )}

      {carregando ? <p role="status" className="text-sm text-slate-600">Carregando usuários…</p> : !erro && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Usuários cadastrados no sistema</caption>
            <thead className="border-b border-slate-200 bg-slate-100/60 text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium">Nome</th>
                <th scope="col" className="px-5 py-4 font-medium">Login</th>
                <th scope="col" className="px-5 py-4 font-medium">Perfil</th>
                <th scope="col" className="px-5 py-4 font-medium">Situação</th>
                <th scope="col" className="px-5 py-4 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="max-w-xs break-words px-5 py-4 font-medium">{usuario.nome}</td>
                  <td className="max-w-xs break-all px-5 py-4 text-slate-600">{usuario.login}</td>
                  <td className="px-5 py-4">{nomesPerfis[usuario.perfil]}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${usuario.ativo
                      ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Botao variante="secundario" onClick={() => abrirFormulario(usuario)} aria-label={`Editar usuário ${usuario.nome}`}>
                        Editar
                      </Botao>
                      <Botao
                        variante="secundario"
                        onClick={() => { setSucesso(''); setUsuarioSituacao(usuario); }}
                        aria-label={`${usuario.ativo ? 'Inativar' : 'Ativar'} usuário ${usuario.nome}`}
                      >
                        {usuario.ativo ? 'Inativar' : 'Ativar'}
                      </Botao>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Nenhum usuário cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {formulario && (
        <FormularioUsuario
          key={formulario.usuario?.id ?? 'novo'}
          usuario={formulario.usuario}
          onFechar={() => setFormulario(null)}
          onSalvo={(salvo) => operacaoConcluida(salvo, formulario.usuario
            ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.')}
        />
      )}
      {usuarioSituacao && (
        <ConfirmarSituacaoUsuario
          usuario={usuarioSituacao}
          onFechar={() => setUsuarioSituacao(null)}
          onConfirmado={(salvo) => operacaoConcluida(salvo,
            salvo.ativo ? 'Usuário ativado com sucesso.' : 'Usuário inativado com sucesso.')}
        />
      )}
    </section>
  );
}
