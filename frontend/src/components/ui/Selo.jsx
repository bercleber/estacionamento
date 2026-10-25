const estilos = {
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  aviso: 'border-amber-200 bg-amber-50 text-amber-900',
  informacao: 'border-blue-200 bg-blue-50 text-blue-800',
  neutro: 'border-slate-200 bg-slate-100 text-slate-600',
};

export default function Selo({ tom = 'neutro', children }) {
  return <span className={`vp-badge ${estilos[tom]}`}>{children}</span>;
}
