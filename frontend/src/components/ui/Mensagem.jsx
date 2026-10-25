import Icone from './Icone.jsx';

const estilos = {
  erro: 'border-red-200 bg-red-50 text-red-800',
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export default function Mensagem({ children, tipo = 'erro' }) {
  if (!children) return null;
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${estilos[tipo]}`}>
      <Icone nome={tipo === 'erro' ? 'alerta' : 'sucesso'} className="mt-0.5 h-5 w-5" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}
