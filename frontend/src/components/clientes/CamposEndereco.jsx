import Campo from '../ui/Campo.jsx';
import Select from '../ui/Select.jsx';

const estados = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export default function CamposEndereco({ dados, onAlterar, erros = {}, autoFocus = false }) {
  return (
    <>
      <Campo label="CEP (opcional)" name="cep" value={dados.cep} onChange={onAlterar} erro={erros.cep}
        maxLength={9} inputMode="numeric" autoComplete="postal-code" autoFocus={autoFocus} />
      <Campo label="Logradouro" name="logradouro" value={dados.logradouro} onChange={onAlterar} erro={erros.logradouro}
        maxLength={150} autoComplete="address-line1" required />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo label="Número (opcional)" name="numero" value={dados.numero} onChange={onAlterar} maxLength={20} />
        <Campo label="Complemento (opcional)" name="complemento" value={dados.complemento} onChange={onAlterar} maxLength={100} autoComplete="address-line2" />
      </div>
      <Campo label="Bairro (opcional)" name="bairro" value={dados.bairro} onChange={onAlterar} maxLength={100} />
      <div className="grid gap-5 sm:grid-cols-[1fr_7rem]">
        <Campo label="Cidade" name="cidade" value={dados.cidade} onChange={onAlterar} erro={erros.cidade}
          maxLength={100} autoComplete="address-level2" required />
        <Select label="UF" name="estado" value={dados.estado} onChange={onAlterar} erro={erros.estado} autoComplete="address-level1" required>
          <option value="">Selecione</option>
          {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </Select>
      </div>
    </>
  );
}
