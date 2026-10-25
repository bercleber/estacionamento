const estilos = {
  primario: 'vp-button-primary',
  secundario: 'vp-button-secondary',
  perigo: 'vp-button-danger',
};

export default function Botao({ children, type = 'button', variante = 'primario', className = '', ...props }) {
  return (
    <button
      type={type}
      className={`vp-button ${estilos[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
