import { Outlet } from 'react-router';
import Cabecalho from './Cabecalho.jsx';
import MenuLateral from './MenuLateral.jsx';

export default function LayoutPrincipal() {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-white focus:p-3">
        Ir para o conteúdo
      </a>
      <MenuLateral />
      <div className="min-w-0">
        <Cabecalho />
        <main id="conteudo" className="mx-auto max-w-6xl p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
