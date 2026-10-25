import Campo from '../ui/Campo.jsx';

export default function CamposVeiculo({ dados, onAlterar, autoFocus = false, erros = {}, bloquearPlaca = false }) {
  return (
    <>
      <Campo label="Placa" name="placa" value={dados.placa} onChange={(event) => {
        event.target.value = event.target.value.toUpperCase();
        onAlterar(event);
      }} maxLength={10} erro={erros.placa} ajuda="Formatos aceitos: ABC1234 ou ABC1D23."
        autoComplete="off" autoCapitalize="characters" spellCheck={false} required autoFocus={autoFocus} disabled={bloquearPlaca} />
      {bloquearPlaca && <p className="text-sm text-amber-800">Registre a saída do veículo antes de alterar sua placa.</p>}
      <Campo label="Modelo (opcional)" name="modelo" value={dados.modelo} onChange={onAlterar} maxLength={100} />
      <Campo label="Cor (opcional)" name="cor" value={dados.cor} onChange={onAlterar} maxLength={40} />
    </>
  );
}
