import { useCallback, useState } from 'react';
import { Outlet } from 'react-router';
import Cabecalho from './Cabecalho.jsx';
import MenuLateral from './MenuLateral.jsx';

export default function LayoutPrincipal() {
  const [menuAberto, setMenuAberto] = useState(false);
  const fecharMenu = useCallback(() => setMenuAberto(false), []);

  return (
    <div className="mx-auto min-h-dvh max-w-[100rem] p-3 sm:p-5 lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:gap-5">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-white focus:p-3">
        Ir para o conteúdo
      </a>
      <MenuLateral aberto={menuAberto} onFechar={fecharMenu} />
      <div className="min-w-0">
        <Cabecalho menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto(true)} />
        <main id="conteudo" tabIndex={-1} className="mx-auto max-w-6xl px-1 py-7 sm:px-3 sm:py-8 lg:px-4 lg:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
