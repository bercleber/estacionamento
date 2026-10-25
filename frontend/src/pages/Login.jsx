import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import Botao from '../components/ui/Botao.jsx';
import Campo from '../components/ui/Campo.jsx';
import CampoSenha from '../components/ui/CampoSenha.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';
import Marca from '../components/ui/Marca.jsx';
import Icone from '../components/ui/Icone.jsx';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const location = useLocation();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (usuario) return <Navigate to="/" replace />;

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try {
      await entrar(login, senha);
      setSenha('');
    } catch (error) {
      setErro(error.status === 401 || error.status === 429
        ? error.message : 'Não foi possível entrar no sistema. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="vp-login flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
      <section aria-labelledby="titulo-login" className="vp-glass w-full max-w-md rounded-[1.75rem] p-6 sm:p-10">
        <Marca />
        <div className="mt-9">
          <h1 id="titulo-login" className="text-3xl font-bold tracking-tight text-ink">Acesse sua conta</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">Entre para gerenciar seu estacionamento.</p>
        </div>
        {location.state?.senhaAlterada && (
          <div className="mt-5"><Mensagem tipo="sucesso">Senha alterada com sucesso. Entre novamente.</Mensagem></div>
        )}
        <form onSubmit={enviar} className="mt-8 space-y-5" aria-busy={enviando}>
          <Campo label="Login" name="login" autoComplete="username" required maxLength={100}
            value={login} onChange={(event) => setLogin(event.target.value)} disabled={enviando} />
          <CampoSenha label="Senha" id="login-senha" name="senha"
            autoComplete="current-password" required maxLength={128}
            value={senha} onChange={(event) => setSenha(event.target.value)} disabled={enviando} />
          <Mensagem>{erro}</Mensagem>
          <Botao type="submit" disabled={enviando} className="min-h-12 w-full">
            {enviando ? 'Entrando…' : 'Entrar'}<Icone nome="seta" />
          </Botao>
        </form>
      </section>
      <p className="text-center text-sm font-medium text-muted">VParking. Tudo em seu lugar.</p>
    </main>
  );
}
