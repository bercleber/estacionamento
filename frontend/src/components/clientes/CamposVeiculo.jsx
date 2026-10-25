import Campo from '../ui/Campo.jsx';

export default function CamposVeiculo({ dados, onAlterar, autoFocus = false }) {
  return (
    <>
      <Campo label="Placa" name="placa" value={dados.placa} onChange={onAlterar} maxLength={10}
        autoComplete="off" autoCapitalize="characters" spellCheck={false} required autoFocus={autoFocus} />
      <p className="text-sm text-slate-500">Formatos aceitos: ABC1234 ou ABC1D23.</p>
      <Campo label="Modelo (opcional)" name="modelo" value={dados.modelo} onChange={onAlterar} maxLength={100} />
      <Campo label="Cor (opcional)" name="cor" value={dados.cor} onChange={onAlterar} maxLength={40} />
    </>
  );
}
