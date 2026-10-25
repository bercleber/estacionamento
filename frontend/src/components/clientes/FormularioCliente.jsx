import { useState } from 'react';
import { cadastrarCliente, editarCliente } from '../../services/clientes.service.js';
import Botao from '../ui/Botao.jsx';
import Campo from '../ui/Campo.jsx';
import Select from '../ui/Select.jsx';
import Mensagem from '../ui/Mensagem.jsx';
import Modal from '../ui/Modal.jsx';
import CamposVeiculo from './CamposVeiculo.jsx';

export default function FormularioCliente({ cliente = null, onFechar, onSalvo }) {
  const [dados, setDados] = useState(() => ({
    nome: cliente?.nome ?? '', cpf: cliente?.cpf ?? '',
    telefone: cliente?.telefone ?? '', tipo: cliente?.tipo ?? 'HORISTA',
  }));
  const [enviando, setEnviando] = useState(false);
  const [veiculo, setVeiculo] = useState({ placa: '', modelo: '', cor: '' });
  const [erro, setErro] = useState('');

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atuais) => ({ ...atuais, [name]: value }));
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setErro('');
    if (!dados.nome.trim()) { setErro('Preencha o nome do cliente.'); return; }
    if (!cliente && !veiculo.placa.trim()) { setErro('Informe a placa do primeiro veículo.'); return; }
    setEnviando(true);
    try {
      const valores = {
        nome: dados.nome.trim(), cpf: dados.cpf.trim() || null,
        telefone: dados.telefone.trim() || null, tipo: dados.tipo,
      };
      onSalvo(cliente ? await editarCliente(cliente.id, valores) : await cadastrarCliente({ ...valores, veiculo: {
        placa: veiculo.placa, modelo: veiculo.modelo.trim() || null, cor: veiculo.cor.trim() || null,
      } }));
    } catch (error) {
      setErro([400, 403, 404, 409].includes(error.status)
        ? error.message : 'Não foi possível salvar o cliente. Tente novamente.');
    } finally { setEnviando(false); }
  }

  return (
    <Modal titulo={cliente ? 'Editar cliente' : 'Novo cliente e veículo'} onFechar={onFechar} bloqueada={enviando} ampla={!cliente}>
      <form onSubmit={enviar} className="space-y-5" aria-busy={enviando}>
        <div className={cliente ? '' : 'grid gap-6 md:grid-cols-2'}>
        <fieldset disabled={enviando} className="space-y-5">
          <legend className="mb-4 font-semibold">Dados do cliente</legend>
          <Campo label="Nome" name="nome" value={dados.nome} onChange={alterar} maxLength={150} autoComplete="name" required autoFocus />
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo label="CPF (opcional)" name="cpf" value={dados.cpf} onChange={alterar} maxLength={14} inputMode="numeric" autoComplete="off" />
            <Campo label="Telefone (opcional)" name="telefone" type="tel" value={dados.telefone} onChange={alterar} maxLength={20} autoComplete="tel" />
          </div>
          <Select label="Tipo" name="tipo" value={dados.tipo} onChange={alterar} required>
            <option value="HORISTA">Horista</option>
            <option value="MENSALISTA">Mensalista</option>
          </Select>
          {cliente?.vaga_cativa_id && dados.tipo === 'HORISTA' && (
            <p className="text-sm text-amber-800">A vaga cativa precisa ser removida por administrador ou gerente antes da mudança para horista.</p>
          )}
        </fieldset>
        {!cliente && (
          <fieldset disabled={enviando} className="space-y-5">
            <legend className="mb-4 font-semibold">Primeiro veículo</legend>
            <p className="text-sm text-slate-600">O primeiro veículo é obrigatório. Você poderá adicionar outros na ficha do cliente.</p>
            <CamposVeiculo dados={veiculo} onAlterar={(event) => {
              const { name, value } = event.target;
              setVeiculo((atuais) => ({ ...atuais, [name]: value }));
            }} />
          </fieldset>
        )}
        </div>
        <Mensagem>{erro}</Mensagem>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
          <Botao variante="secundario" onClick={onFechar} disabled={enviando}>Cancelar</Botao>
          <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : cliente ? 'Salvar alterações' : 'Cadastrar cliente e veículo'}</Botao>
        </div>
      </form>
    </Modal>
  );
}
