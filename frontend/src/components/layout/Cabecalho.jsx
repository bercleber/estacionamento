import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { nomesPerfis } from '../../utils/perfis.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import FormularioSenha from '../auth/FormularioSenha.jsx';

export default function Cabecalho() {
  const { usuario, sair } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  async function encerrar() {
    setSaindo(true);
    setErro('');
    try {
      await sair();
    } catch {
      setErro('Não foi possível encerrar a sessão. Tente novamente.');
    } finally {
      setSaindo(false);
    }
  }

  return (
    <>
      <header className="space-y-3 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="break-words text-sm font-medium">{usuario.nome}</p>
            <p className="text-xs text-slate-500">{nomesPerfis[usuario.perfil]}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Botao variante="secundario" onClick={() => { setErro(''); setAlterandoSenha(true); }} disabled={saindo}>
              Alterar senha
            </Botao>
            <Botao onClick={encerrar} disabled={saindo}>{saindo ? 'Saindo…' : 'Sair'}</Botao>
          </div>
        </div>
        <Mensagem>{erro}</Mensagem>
      </header>
      {alterandoSenha && <FormularioSenha onFechar={() => setAlterandoSenha(false)} />}
    </>
  );
}
