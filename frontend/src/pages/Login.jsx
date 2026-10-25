import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';
import Botao from '../components/ui/Botao.jsx';
import Campo from '../components/ui/Campo.jsx';
import Mensagem from '../components/ui/Mensagem.jsx';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const location = useLocation();
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const destino = location.state?.de;
  const voltarPara = typeof destino === 'string' && destino.startsWith('/')
    && !destino.startsWith('//') && !destino.startsWith('/login') ? destino : '/';

  if (usuario) return <Navigate to={voltarPara} replace />;

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
    <main className="grid min-h-dvh place-items-center p-5">
      <section aria-labelledby="titulo-login" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-slate-500">Estacionamento</p>
        <h1 id="titulo-login" className="mt-2 text-2xl font-semibold tracking-tight">Acesse sua conta</h1>
        <p className="mt-2 text-sm text-slate-600">Informe seu login e sua senha para continuar.</p>
        {location.state?.senhaAlterada && (
          <div className="mt-5"><Mensagem tipo="sucesso">Senha alterada com sucesso. Entre novamente.</Mensagem></div>
        )}
        <form onSubmit={enviar} className="mt-7 space-y-5" aria-busy={enviando}>
          <Campo label="Login" name="login" autoComplete="username" required maxLength={100}
            value={login} onChange={(event) => setLogin(event.target.value)} disabled={enviando} />
          <Campo label="Senha" name="senha" type="password" autoComplete="current-password" required maxLength={128}
            value={senha} onChange={(event) => setSenha(event.target.value)} disabled={enviando} />
          <Mensagem>{erro}</Mensagem>
          <Botao type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Entrando…' : 'Entrar'}
          </Botao>
        </form>
      </section>
    </main>
  );
}
