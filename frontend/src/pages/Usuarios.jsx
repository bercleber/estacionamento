import TituloPagina from '../components/ui/TituloPagina.jsx';
import EstadoVazio from '../components/ui/EstadoVazio.jsx';
import Icone from '../components/ui/Icone.jsx';
import Selo from '../components/ui/Selo.jsx';
import MaisAcoes from '../components/ui/MaisAcoes.jsx';
import Carregando from '../components/ui/Carregando.jsx';
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

  function acoesUsuario(usuario) {
    return <div className="flex flex-wrap gap-2">
      <Botao variante="secundario" onClick={() => abrirFormulario(usuario)} aria-label={`Editar usuário ${usuario.nome}`}><Icone nome="editar" />Editar</Botao>
      <MaisAcoes ariaLabel={`Mais ações do usuário ${usuario.nome}`}>
        <Botao variante="secundario" className="w-full" onClick={() => { setSucesso(''); setUsuarioSituacao(usuario); }} aria-label={`${usuario.ativo ? 'Inativar' : 'Ativar'} usuário ${usuario.nome}`}>{usuario.ativo ? 'Inativar' : 'Ativar'} usuário</Botao>
      </MaisAcoes>
    </div>;
  }

  return (
    <section aria-labelledby="titulo-usuarios" className="space-y-6">
      <TituloPagina id="titulo-usuarios" icone="usuarios" titulo="Usuários" descricao="Gerencie os usuários e seus acessos ao sistema.">
        <Botao onClick={() => abrirFormulario()}><Icone nome="adicionar" />Novo usuário</Botao>
      </TituloPagina>
      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      {erro && <div className="space-y-3"><Mensagem>{erro}</Mensagem><Botao variante="secundario" onClick={() => setAtualizacao((atual) => atual + 1)}>Tentar novamente</Botao></div>}
      {carregando ? <Carregando>Carregando usuários…</Carregando> : !erro && (
        usuarios.length === 0 ? <EstadoVazio icone="usuarios" titulo="Nenhum usuário cadastrado" descricao="Use “Novo usuário” para cadastrar um acesso ao sistema." /> : (
          <>
            <p role="status" className="text-sm font-medium text-muted">{usuarios.length} {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}</p>
            <div className="vp-panel hidden xl:block">
              <table className="vp-table">
                <caption className="sr-only">Usuários cadastrados no sistema</caption>
                <thead><tr>{['Usuário', 'Perfil', 'Situação', 'Ações'].map((titulo) => <th key={titulo} scope="col">{titulo}</th>)}</tr></thead>
                <tbody>{usuarios.map((usuario) => <tr key={usuario.id}>
                  <td className="max-w-xs"><p className="break-words font-bold">{usuario.nome}</p><p className="mt-1 break-all text-muted">{usuario.login}</p></td>
                  <td><Selo tom="informacao">{nomesPerfis[usuario.perfil]}</Selo></td>
                  <td><Selo tom={usuario.ativo ? 'sucesso' : 'neutro'}>{usuario.ativo ? 'Ativo' : 'Inativo'}</Selo></td>
                  <td>{acoesUsuario(usuario)}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:hidden">{usuarios.map((usuario) => <li key={usuario.id} className="vp-panel flex min-w-0 flex-col gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 break-words font-bold">{usuario.nome}</h2><Selo tom={usuario.ativo ? 'sucesso' : 'neutro'}>{usuario.ativo ? 'Ativo' : 'Inativo'}</Selo></div>
              <dl className="vp-record-details"><div><dt>Login</dt><dd className="break-all">{usuario.login}</dd></div><div><dt>Perfil</dt><dd>{nomesPerfis[usuario.perfil]}</dd></div></dl>
              <div className="mt-auto border-t border-slate-100 pt-4">{acoesUsuario(usuario)}</div>
            </li>)}</ul>
          </>
        )
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
