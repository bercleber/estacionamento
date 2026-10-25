import Icone from './Icone.jsx';

export default function EstadoVazio({ titulo, descricao, icone = 'buscar', children }) {
  return (
    <div className="vp-panel flex flex-col items-center px-5 py-10 text-center sm:py-12">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary"><Icone nome={icone} className="h-6 w-6" /></span>
      <p className="font-bold text-ink">{titulo}</p>
      {descricao && <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{descricao}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
