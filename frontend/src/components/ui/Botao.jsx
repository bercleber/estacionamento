const estilos = {
  primario: 'bg-primary text-white hover:bg-slate-700',
  secundario: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
};

export default function Botao({ children, type = 'button', variante = 'primario', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
