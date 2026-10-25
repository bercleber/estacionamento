import { httpError } from './http-error.js';

const fuso = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Sao_Paulo', timeZoneName: 'longOffset',
});

function deslocamentoEmMs(instante) {
  const nome = fuso.formatToParts(new Date(instante)).find((parte) => parte.type === 'timeZoneName').value;
  const [, sinal, horas, minutos, segundos = '0'] = nome.match(/^GMT([+-])([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?$/);
  return (sinal === '+' ? 1 : -1) * (Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos)) * 1000;
}

export function validarData(data) {
  if (typeof data !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data)) {
    throw httpError(400, 'Informe as datas no formato YYYY-MM-DD.', 'PERIODO_INVALIDO');
  }
  const instante = Date.parse(`${data}T00:00:00Z`);
  if (!Number.isFinite(instante) || new Date(instante).toISOString().slice(0, 10) !== data || data < '1000-01-01') {
    throw httpError(400, 'Informe uma data válida.', 'PERIODO_INVALIDO');
  }
  return instante;
}

export function inicioDia(data) {
  const base = validarData(data);
  const primeiroDeslocamento = deslocamentoEmMs(base);
  const segundoDeslocamento = deslocamentoEmMs(base - primeiroDeslocamento);
  // Também cobre dias em que o antigo horário de verão de São Paulo suprimia a meia-noite.
  return new Date(base - Math.min(primeiroDeslocamento, segundoDeslocamento));
}
