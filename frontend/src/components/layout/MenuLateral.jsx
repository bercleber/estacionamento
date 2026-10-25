import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import Icone from '../ui/Icone.jsx';
import Marca from '../ui/Marca.jsx';

function Navegacao({ onNavegar }) {
  const { usuario } = useAuth();
  const grupos = [
    { nome: 'Operação', links: [
      { caminho: '/', nome: 'Painel inicial', icone: 'inicio' },
      { caminho: '/movimentacoes', nome: 'Movimentações', icone: 'movimentacoes' },
      { caminho: '/vagas', nome: 'Vagas', icone: 'vagas' },
    ] },
    { nome: 'Cadastros', links: [
      { caminho: '/clientes', nome: 'Clientes', icone: 'clientes' },
      { caminho: '/tarifas', nome: 'Tarifas', icone: 'tarifas' },
    ] },
  ];
  if (usuario.perfil === 'ADMINISTRADOR') grupos.push({
    nome: 'Administração', links: [{ caminho: '/usuarios', nome: 'Usuários', icone: 'usuarios' }],
  });

  return (
    <nav aria-label="Navegação principal" className="space-y-7">
      {grupos.map((grupo) => (
        <div key={grupo.nome}>
          <p className="mb-2 px-3 text-xs font-bold tracking-wider text-muted uppercase">{grupo.nome}</p>
          <ul className="space-y-1.5">
            {grupo.links.map(({ caminho, nome, icone }) => (
              <li key={caminho}>
                <NavLink to={caminho} end={caminho === '/'} onClick={onNavegar}
                  className={({ isActive }) => `vp-nav-link flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-primary text-white shadow-md shadow-blue-700/15' : 'text-muted hover:bg-white hover:text-ink'
                  }`}>
                  <Icone nome={icone} />{nome}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function MenuLateral({ aberto, onFechar }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const dialog = dialogRef.current;
    const anterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    const desktop = window.matchMedia('(min-width: 64rem)');
    if (desktop.matches) {
      onFechar();
      return;
    }
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    function aoRedimensionar(event) { if (event.matches) onFechar(); }
    desktop.addEventListener('change', aoRedimensionar);
    return () => {
      desktop.removeEventListener('change', aoRedimensionar);
      dialog.close();
      document.body.style.overflow = overflowAnterior;
      if (anterior?.isConnected) anterior.focus();
    };
  }, [aberto, onFechar]);

  return (
    <>
      <aside className="vp-glass sticky top-5 hidden h-[calc(100dvh_-_2.5rem)] flex-col overflow-y-auto rounded-3xl p-4 lg:flex">
        <div className="px-2 pt-2 pb-9"><Marca compacta /><p className="mt-3 text-xs font-medium text-muted">Gestão do estacionamento</p></div>
        <Navegacao />
        <p className="mt-auto px-3 pt-8 pb-2 text-xs text-muted">Tudo em seu lugar.</p>
      </aside>
      <dialog ref={dialogRef} id="navegacao-mobile" aria-labelledby="titulo-navegacao-mobile"
        onCancel={(event) => { event.preventDefault(); onFechar(); }}
        onClick={(event) => { if (event.target === event.currentTarget) onFechar(); }}
        className="vp-drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-[min(20rem,calc(100%_-_1rem))] max-w-none overflow-y-auto rounded-r-3xl border-0 bg-[#f8faff] p-0 text-ink shadow-2xl lg:hidden">
        <div className="min-h-full p-5">
          <div className="mb-8 flex items-center justify-between gap-3">
            <span id="titulo-navegacao-mobile"><Marca compacta /></span>
            <button type="button" onClick={onFechar} aria-label="Fechar navegação" className="vp-button vp-button-secondary h-11 w-11 p-0"><Icone nome="fechar" /></button>
          </div>
          <Navegacao onNavegar={onFechar} />
        </div>
      </dialog>
    </>
  );
}
