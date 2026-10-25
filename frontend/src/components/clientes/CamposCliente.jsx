import Campo from '../ui/Campo.jsx';
import Select from '../ui/Select.jsx';

export default function CamposCliente({ dados, onAlterar, erros = {}, autoFocus = false, bloquearTipo = false }) {
  return (
    <>
      <Campo label="Nome" name="nome" value={dados.nome} onChange={onAlterar} erro={erros.nome}
        maxLength={150} autoComplete="name" required autoFocus={autoFocus} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="CPF (opcional)" name="cpf" value={dados.cpf} onChange={onAlterar} erro={erros.cpf}
          maxLength={14} inputMode="numeric" autoComplete="off" />
        <Campo label="Telefone (opcional)" name="telefone" value={dados.telefone} onChange={onAlterar}
          type="tel" maxLength={20} autoComplete="tel" />
      </div>
      <Select label="Tipo" name="tipo" value={dados.tipo} onChange={onAlterar} disabled={bloquearTipo} required>
        <option value="HORISTA">Horista</option>
        <option value="MENSALISTA">Mensalista</option>
      </Select>
      {bloquearTipo && <p className="text-sm text-amber-800">Registre a saída dos veículos estacionados antes de alterar o tipo do cliente.</p>}
    </>
  );
}
