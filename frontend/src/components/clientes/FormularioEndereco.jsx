import { useState } from 'react';
import Botao from '../ui/Botao.jsx';
import Campo from '../ui/Campo.jsx';
import Select from '../ui/Select.jsx';

const estados = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export default function FormularioEndereco({ endereco = null, enviando, onCancelar, onEnviar }) {
  const [dados, setDados] = useState(() => ({
    logradouro: endereco?.logradouro ?? '', numero: endereco?.numero ?? '',
    complemento: endereco?.complemento ?? '', bairro: endereco?.bairro ?? '',
    cidade: endereco?.cidade ?? '', estado: endereco?.estado ?? '', cep: endereco?.cep ?? '',
  }));

  function alterar(event) {
    const { name, value } = event.target;
    setDados((atuais) => ({ ...atuais, [name]: value }));
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); if (!enviando) onEnviar(dados); }} className="space-y-5" aria-busy={enviando}>
      <fieldset disabled={enviando} className="space-y-5">
        <legend className="sr-only">Dados do endereço</legend>
        <Campo label="Logradouro" name="logradouro" value={dados.logradouro} onChange={alterar} maxLength={150} autoComplete="address-line1" required autoFocus />
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Número (opcional)" name="numero" value={dados.numero} onChange={alterar} maxLength={20} />
          <Campo label="Complemento (opcional)" name="complemento" value={dados.complemento} onChange={alterar} maxLength={100} autoComplete="address-line2" />
        </div>
        <Campo label="Bairro (opcional)" name="bairro" value={dados.bairro} onChange={alterar} maxLength={100} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Campo label="Cidade" name="cidade" value={dados.cidade} onChange={alterar} maxLength={100} autoComplete="address-level2" required />
          <Select label="UF" name="estado" value={dados.estado} onChange={alterar} autoComplete="address-level1" required>
            <option value="">Selecione</option>
            {estados.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
          </Select>
        </div>
        <Campo label="CEP (opcional)" name="cep" value={dados.cep} onChange={alterar} maxLength={9} inputMode="numeric" autoComplete="postal-code" />
      </fieldset>
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        <Botao variante="secundario" onClick={onCancelar} disabled={enviando}>Cancelar</Botao>
        <Botao type="submit" disabled={enviando}>{enviando ? 'Salvando…' : endereco ? 'Salvar alterações' : 'Adicionar endereço'}</Botao>
      </div>
    </form>
  );
}
