import { useState } from 'react';
import { cadastrarVaga, editarVaga } from '../../services/vagas.service.js';
import Botao from '../ui/Botao.jsx';
import Campo from '../ui/Campo.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';

export default function FormularioVaga({ vaga = null, onFechar, onSalvo }) {
  const [numero, setNumero] = useState(vaga?.numero ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setErro('');
    const normalizado = numero.trim().toUpperCase();
    if (!normalizado || [...normalizado].length > 10) {
      setErro('Informe um número de vaga com até 10 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      const salvo = vaga
        ? await editarVaga(vaga.id, { numero: normalizado })
        : await cadastrarVaga({ numero: normalizado });
      onSalvo(salvo);
    } catch (error) {
      setErro([400, 403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível salvar a vaga. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={vaga ? 'Editar vaga' : 'Nova vaga'} onFechar={onFechar} bloqueada={enviando}>
      <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
        <Campo label="Número da vaga" name="numero" value={numero} onChange={(event) => setNumero(event.target.value)}
          maxLength={10} autoComplete="off" autoCapitalize="characters" spellCheck={false}
          disabled={enviando} required autoFocus />
        <p className="text-sm text-muted">Até 10 caracteres. Exemplos: 01, A01 ou B-02.</p>
        <Mensagem>{erro}</Mensagem>
        <div className="vp-form-actions">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando…' : vaga ? 'Salvar alterações' : 'Cadastrar vaga'}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
