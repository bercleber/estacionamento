import { useEffect, useId, useRef } from 'react';
import Icone from './Icone.jsx';

export default function Modal({ titulo, onFechar, bloqueada = false, ampla = false, children }) {
  const ref = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const anterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflowAnterior;
      if (anterior?.isConnected) anterior.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onCancel={(event) => {
        event.preventDefault();
        if (!bloqueada) onFechar();
      }}
      className={`vp-dialog m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] ${ampla ? 'max-w-3xl' : 'max-w-xl'} overflow-y-auto`}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:px-6">
        <h2 id={tituloId} className="text-lg font-bold tracking-tight">{titulo}</h2>
        <button
          type="button"
          onClick={onFechar}
          disabled={bloqueada}
          className="vp-button vp-button-secondary h-11 w-11 shrink-0 p-0"
          aria-label="Fechar janela"
          title="Fechar janela"
        >
          <Icone nome="fechar" />
        </button>
      </header>
      <div className="vp-dialog-body">{children}</div>
    </dialog>
  );
}
