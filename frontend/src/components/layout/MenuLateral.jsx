import { NavLink } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';

export default function MenuLateral() {
  const { usuario } = useAuth();
  const links = [
    { caminho: '/', nome: 'Início' },
    { caminho: '/movimentacoes', nome: 'Movimentações' },
    { caminho: '/vagas', nome: 'Vagas' },
    { caminho: '/tarifas', nome: 'Tarifas' },
    { caminho: '/clientes', nome: 'Clientes' },
  ];
  if (usuario.perfil === 'ADMINISTRADOR') links.push({ caminho: '/usuarios', nome: 'Usuários' });

  return (
    <aside className="border-b border-slate-200 bg-white p-5 md:min-h-dvh md:border-r md:border-b-0">
      <p className="text-lg font-semibold tracking-tight">Estacionamento</p>
      <nav aria-label="Navegação principal" className="mt-5 space-y-1">
        {links.map(({ caminho, nome }) => (
          <NavLink
            key={caminho}
            to={caminho}
            end={caminho === '/'}
            className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {nome}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
