import { useState } from 'react';
import { salvarTarifas } from '../../services/tarifas.service.js';
import Botao from '../ui/Botao.jsx';
import Campo from '../ui/Campo.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

function normalizarValor(valor) {
  const normalizado = valor.trim().replace(',', '.');
  if (!/^[0-9]{1,8}(?:\.[0-9]{1,2})?$/.test(normalizado)) return null;
  const [inteiro, centavos = ''] = normalizado.split('.');
  return `${inteiro.replace(/^0+(?=\d)/, '')}.${centavos.padEnd(2, '0')}`;
}

export default function FormularioTarifas({ tarifa = null, onFechar, onSalvo }) {
  const [valorHora, setValorHora] = useState(() => tarifa?.valor_hora.replace('.', ',') ?? '');
  const [valorMes, setValorMes] = useState(() => tarifa?.valor_mes.replace('.', ',') ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setErro('');
    const valor_hora = normalizarValor(valorHora);
    const valor_mes = normalizarValor(valorMes);
    if (valor_hora === null || valor_mes === null) {
      setErro('Informe os dois valores entre R$ 0,00 e R$ 99.999.999,99, com até duas casas decimais.');
      return;
    }

    setEnviando(true);
    try {
      onSalvo(await salvarTarifas({ valor_hora, valor_mes }));
    } catch (error) {
      setErro([400, 403].includes(error.status)
        ? error.message : 'Não foi possível salvar as tarifas. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={tarifa ? 'Alterar tarifas' : 'Cadastrar tarifas'} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
        <fieldset disabled={enviando} className="grid gap-5 sm:grid-cols-2">
          <legend className="sr-only">Valores das tarifas</legend>
          <Campo label="Valor por hora (R$)" name="valor_hora" value={valorHora}
            onChange={(event) => setValorHora(event.target.value)} inputMode="decimal"
            maxLength={11} autoComplete="off" spellCheck={false} required autoFocus />
          <Campo label="Valor mensal (R$)" name="valor_mes" value={valorMes}
            onChange={(event) => setValorMes(event.target.value)} inputMode="decimal"
            maxLength={11} autoComplete="off" spellCheck={false} required />
        </fieldset>
        <p className="text-sm text-muted">Use até duas casas decimais e não inclua separadores de milhar. Exemplo: 250,00.</p>
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : tarifa ? 'Salvar alterações' : 'Cadastrar tarifas'}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
