import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { nomesPerfis } from '../../utils/perfis.js';
import Botao from '../ui/Botao.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import FormularioSenha from '../auth/FormularioSenha.jsx';
import IconePerfil from './IconePerfil.jsx';
import Icone from '../ui/Icone.jsx';

export default function Cabecalho({ menuAberto, onAbrirMenu }) {
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
      <header className="vp-glass relative z-20 space-y-3 rounded-3xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 max-w-full basis-full items-center gap-3 sm:basis-0 sm:flex-1">
            <button type="button" onClick={onAbrirMenu} aria-label="Abrir navegação"
              aria-expanded={menuAberto} aria-controls="navegacao-mobile"
              className="vp-button vp-button-secondary h-11 w-11 shrink-0 p-0 lg:hidden">
              <Icone nome="menu" />
            </button>
            <IconePerfil perfil={usuario.perfil} />
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-ink">{usuario.nome}</p>
              <p className="mt-0.5 text-xs font-medium text-muted">{nomesPerfis[usuario.perfil]}</p>
            </div>
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
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
                className="vp-button vp-button-secondary h-11 w-11 p-0">
                <Icone nome="configuracoes" />
              </button>
              {configuracoesAbertas && (
                <div id="configuracoes-usuario" className="vp-menu absolute right-0 z-20 mt-3 w-52">
                  <button type="button" disabled={saindo}
                    onClick={() => {
                      setConfiguracoesAbertas(false);
                      setErro('');
                      botaoConfiguracoesRef.current?.focus();
                      setAlterandoSenha(true);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-blue-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-60">
                    <Icone nome="cadeado" />Alterar senha
                  </button>
                </div>
              )}
            </div>
            <Botao variante="secundario" onClick={encerrar} disabled={saindo}><Icone nome="sair" />{saindo ? 'Saindo…' : 'Sair'}</Botao>
          </div>
        </div>
        <Mensagem>{erro}</Mensagem>
      </header>
      {alterandoSenha && <FormularioSenha onFechar={() => setAlterandoSenha(false)} />}
    </>
  );
}
