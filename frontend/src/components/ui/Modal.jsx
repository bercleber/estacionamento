import { useEffect, useId, useRef } from 'react';

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
      className={`m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] ${ampla ? 'max-w-3xl' : 'max-w-xl'} overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50`}
    >
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 p-5 sm:px-6">
        <h2 id={tituloId} className="text-lg font-semibold">{titulo}</h2>
        <button
          type="button"
          onClick={onFechar}
          disabled={bloqueada}
          className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Fechar
        </button>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </dialog>
  );
}
