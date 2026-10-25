import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { nomesPerfis } from '../../utils/perfis.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import FormularioSenha from '../auth/FormularioSenha.jsx';
import IconePerfil from './IconePerfil.jsx';

export default function Cabecalho() {
  const { usuario, sair } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [erro, setErro] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [configuracoesAbertas, setConfiguracoesAbertas] = useState(false);
  const configuracoesRef = useRef(null);
  const botaoConfiguracoesRef = useRef(null);

  useEffect(() => {
    if (!configuracoesAbertas) return;
    function fecharAoClicarFora(event) {
      if (!configuracoesRef.current?.contains(event.target)) setConfiguracoesAbertas(false);
    }
    document.addEventListener('pointerdown', fecharAoClicarFora);
    return () => document.removeEventListener('pointerdown', fecharAoClicarFora);
  }, [configuracoesAbertas]);

  async function encerrar() {
    setConfiguracoesAbertas(false);
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
          <div className="flex min-w-0 max-w-full items-center gap-3">
            <IconePerfil perfil={usuario.perfil} />
            <div className="min-w-0">
              <p className="break-words text-sm font-medium">{usuario.nome}</p>
              <p className="text-xs text-slate-500">{nomesPerfis[usuario.perfil]}</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <div ref={configuracoesRef} className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setConfiguracoesAbertas(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && configuracoesAbertas) {
                  event.preventDefault();
                  event.stopPropagation();
                  setConfiguracoesAbertas(false);
                  botaoConfiguracoesRef.current?.focus();
                }
              }}>
              <button ref={botaoConfiguracoesRef} type="button" disabled={saindo}
                aria-label="Configurações do usuário" title="Configurações do usuário"
                aria-expanded={configuracoesAbertas} aria-controls="configuracoes-usuario"
                onClick={() => setConfiguracoesAbertas((abertas) => !abertas)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className="h-5 w-5">
                  <path d="M9.5 2.5h5L15 5l1.5.9 2.4-.8 2.5 4.3-1.9 1.7v1.8l1.9 1.7-2.5 4.3-2.4-.8-1.5.9-.5 2.5h-5L9 19l-1.5-.9-2.4.8-2.5-4.3 1.9-1.7v-1.8L2.6 9.4l2.5-4.3 2.4.8L9 5l.5-2.5Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              {configuracoesAbertas && (
                <div id="configuracoes-usuario" className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  <button type="button" disabled={saindo}
                    onClick={() => {
                      setConfiguracoesAbertas(false);
                      setErro('');
                      botaoConfiguracoesRef.current?.focus();
                      setAlterandoSenha(true);
                    }}
                    className="flex min-h-11 w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-60">
                    Alterar senha
                  </button>
                </div>
              )}
            </div>
            <Botao onClick={encerrar} disabled={saindo}>{saindo ? 'Saindo…' : 'Sair'}</Botao>
          </div>
        </div>
        <Mensagem>{erro}</Mensagem>
      </header>
      {alterandoSenha && <FormularioSenha onFechar={() => setAlterandoSenha(false)} />}
    </>
  );
}
