import { createContext, useEffect, useState } from 'react';
import { entrar, sair, observarSessao, obterUsuario, restaurarSessao, atualizarUsuario, limparSessao, alterarSenha } from '../services/auth.service.js';
import Botao from '../components/ui/Botao.jsx';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(obterUsuario);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    const cancelar = observarSessao((atual) => { if (ativo) setUsuario(atual); });
    restaurarSessao()
      .catch(() => { if (ativo) setErro(true); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; cancelar(); };
  }, [tentativa]);

  function tentarNovamente() {
    setCarregando(true);
    setErro(false);
    setTentativa((atual) => atual + 1);
  }

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, atualizarUsuario, limparSessao, alterarSenha }}>
      {carregando ? (
        <div className="grid min-h-dvh place-items-center p-6" role="status">
          Verificando sua sessão…
        </div>
      ) : erro ? (
        <main className="grid min-h-dvh place-items-center p-6">
          <div className="max-w-sm space-y-4 text-center">
            <p role="alert">Não foi possível conectar ao sistema. Tente novamente.</p>
            <Botao onClick={tentarNovamente}>Tentar novamente</Botao>
          </div>
        </main>
      ) : children}
    </AuthContext.Provider>
  );
}
