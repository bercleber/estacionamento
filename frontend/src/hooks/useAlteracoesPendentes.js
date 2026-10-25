import { useCallback, useEffect, useRef } from 'react';
import { useBeforeUnload, useBlocker } from 'react-router';

export default function useAlteracoesPendentes(alterado) {
  const permitido = useRef(false);
  const blocker = useBlocker(() => alterado && !permitido.current);
  useBeforeUnload(useCallback((event) => {
    if (alterado && !permitido.current) { event.preventDefault(); event.returnValue = ''; }
  }, [alterado]));

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Há alterações não salvas. Deseja descartá-las e sair?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);

  function permitirSaida() { permitido.current = true; }
  function podeFechar() {
    return !alterado || permitido.current || window.confirm('Há alterações não salvas. Deseja descartá-las e sair?');
  }
  return { permitirSaida, podeFechar };
}
