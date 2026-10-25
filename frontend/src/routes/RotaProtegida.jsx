import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

export default function RotaProtegida({ perfis }) {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: location.pathname + location.search + location.hash }} />;
  }

  if (perfis && !perfis.includes(usuario.perfil)) {
    return (
      <section className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Acesso não permitido</h1>
        <p>Seu perfil não permite acessar esta página.</p>
        <Link to="/" className="text-primary underline">Voltar ao início</Link>
      </section>
    );
  }

  return <Outlet />;
}
