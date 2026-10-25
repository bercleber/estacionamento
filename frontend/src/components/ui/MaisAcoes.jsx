import { useEffect, useRef } from 'react';

export default function MaisAcoes({ label = 'Mais ações', ariaLabel, children }) {
  const ref = useRef(null);
  const menuRef = useRef(null);
  function posicionar() {
    if (!ref.current?.open) return;
    const caixa = ref.current.getBoundingClientRect();
    const largura = menuRef.current.offsetWidth;
    const esquerda = Math.max(16, Math.min(caixa.right - largura, window.innerWidth - largura - 16));
    menuRef.current.style.left = `${esquerda - caixa.left}px`;
  }
  useEffect(() => {
    function fechar(event) {
      if (!ref.current?.contains(event.target)) ref.current?.removeAttribute('open');
    }
    document.addEventListener('pointerdown', fechar);
    window.addEventListener('resize', posicionar);
    return () => {
      document.removeEventListener('pointerdown', fechar);
      window.removeEventListener('resize', posicionar);
    };
  }, []);

  return (
    <details ref={ref} className="relative" onToggle={posicionar} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open');
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        event.currentTarget.removeAttribute('open');
        event.currentTarget.querySelector('summary').focus();
        event.stopPropagation();
      }
    }}>
      <summary aria-label={ariaLabel} className="vp-button vp-button-secondary list-none">{label} <span aria-hidden="true">⋯</span></summary>
      <div ref={menuRef} className="vp-menu absolute z-20 mt-2 w-52 space-y-1" onClick={(event) => {
        if (event.target.closest('button')) {
          ref.current.querySelector('summary').focus();
          ref.current.removeAttribute('open');
        }
      }}>{children}</div>
    </details>
  );
}
