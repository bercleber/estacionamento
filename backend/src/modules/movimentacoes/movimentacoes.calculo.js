import { httpError } from '../../utils/http-error.js';

const TOLERANCIA_SEGUNDOS = 5 * 60;
const HORA_SEGUNDOS = 60 * 60;
const VALOR_MAXIMO_CENTAVOS = 9999999999n;

export function calcularCobranca({ tipo, valor_hora_aplicado: valorHora, tempo_total_segundos: duracao }) {
  const segundos = Number(duracao);
  if (duracao === null || duracao === undefined || !Number.isSafeInteger(segundos) || segundos < 0) {
    throw httpError(409, 'O horário de entrada é incompatível com o horário atual. Confira o registro antes de encerrar.', 'TEMPO_ESTACIONADO_INVALIDO');
  }
  if (tipo === 'MENSALISTA') {
    return { tempo_total_segundos: segundos, horas_cobradas: 0, valor_total: '0.00' };
  }
  if (tipo !== 'HORISTA' || typeof valorHora !== 'string' || !/^[0-9]{1,8}\.[0-9]{2}$/.test(valorHora)) {
    throw httpError(409, 'A tarifa registrada na entrada é inválida. Não é possível calcular a cobrança.', 'TARIFA_ENTRADA_INVALIDA');
  }
  // A faixa de cada hora termina cinco minutos depois da hora cheia.
  const horas = Math.ceil(Math.max(0, segundos - TOLERANCIA_SEGUNDOS) / HORA_SEGUNDOS);
  const [reais, centavos] = valorHora.split('.');
  const total = (BigInt(reais) * 100n + BigInt(centavos)) * BigInt(horas);
  if (total > VALOR_MAXIMO_CENTAVOS) {
    throw httpError(409, 'A cobrança excede o valor máximo suportado pelo cadastro de movimentações.', 'VALOR_COBRANCA_EXCEDIDO');
  }
  return {
    tempo_total_segundos: segundos,
    horas_cobradas: horas,
    valor_total: `${total / 100n}.${String(total % 100n).padStart(2, '0')}`,
  };
}
