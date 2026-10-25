import Icone from './Icone.jsx';

export default function TituloPagina({ id, icone, titulo, descricao, children }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 max-w-full items-start gap-4">
        <span className="vp-glass hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-primary sm:flex"><Icone nome={icone} className="h-6 w-6" /></span>
        <div className="min-w-0">
          <h1 id={id} className="break-words text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{titulo}</h1>
          {descricao && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{descricao}</p>}
        </div>
      </div>
      {children && <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3">{children}</div>}
    </header>
  );
}
