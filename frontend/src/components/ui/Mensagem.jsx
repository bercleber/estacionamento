const estilos = {
  erro: 'border-red-200 bg-red-50 text-red-800',
  sucesso: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export default function Mensagem({ children, tipo = 'erro' }) {
  if (!children) return null;
  return (
    <p role={tipo === 'erro' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${estilos[tipo]}`}>
      {children}
    </p>
  );
}
