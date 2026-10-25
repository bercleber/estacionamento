const desenhos = {
  adicionar: <path d="M12 5v14M5 12h14" />,
  editar: <><path d="m15 5 4 4M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15l-1 5Z" /></>,
  atualizar: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 6a8 8 0 0 1 13.5 3M4.4 15A8 8 0 0 0 18 18" /></>,
  historico: <><path d="M3 4v5h5M3.5 9a9 9 0 1 1 .5 7" /><path d="M12 7v5l3 2" /></>,
  voltar: <path d="M19 12H5m5-5-5 5 5 5" />,
  buscar: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  veiculo: <><path d="m5 8 2-5h10l2 5M3 9h18v9H3zM5 18v3M19 18v3M6 13h2M16 13h2" /></>,
  endereco: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 11h18M7 15h2M15 15h2" /></>,
  inicio: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  movimentacoes: <path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4" />,
  vagas: <><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M10 17V7h3a3 3 0 0 1 0 6h-3" /></>,
  tarifas: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h3" /></>,
  clientes: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3M16 5a3 3 0 0 1 0 6M18 14a4 4 0 0 1 3 4v3" /></>,
  usuarios: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  fechar: <path d="m6 6 12 12M6 18 18 6" />,
  sair: <><path d="M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M9 12h12m-4-4 4 4-4 4" /></>,
  configuracoes: <><path d="M9.5 2.5h5L15 5l1.5.9 2.4-.8 2.5 4.3-1.9 1.7v1.8l1.9 1.7-2.5 4.3-2.4-.8-1.5.9-.5 2.5h-5L9 19l-1.5-.9-2.4.8-2.5-4.3 1.9-1.7v-1.8L2.6 9.4l2.5-4.3 2.4.8L9 5l.5-2.5Z" /><circle cx="12" cy="12" r="3" /></>,
  cadeado: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  seta: <path d="M5 12h14m-5-5 5 5-5 5" />,
  sucesso: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  alerta: <><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 17h.01" /></>,
};

export default function Icone({ nome, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`}>
      {desenhos[nome]}
    </svg>
  );
}
