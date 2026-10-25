const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo',
});

export function formatarDataHora(valor) {
  return valor === null ? 'Pendente' : formatoDataHora.format(new Date(valor));
}

export function formatarDuracao(segundos) {
  if (segundos === null) return 'Indisponível';
  return `${Math.floor(segundos / 3600)}h ${Math.floor((segundos % 3600) / 60)}min ${segundos % 60}s`;
}

export function periodoMesAtual() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  const ano = partes.find((parte) => parte.type === 'year').value;
  const mes = partes.find((parte) => parte.type === 'month').value;
  const ultimoDia = new Date(Date.UTC(Number(ano), Number(mes), 0)).getUTCDate();
  return { data_inicio: `${ano}-${mes}-01`, data_fim: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}` };
}
