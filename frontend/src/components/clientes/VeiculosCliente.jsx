import Botao from '../ui/Botao.jsx';

export default function VeiculosCliente({ cliente, podeGerenciar, onNovo, onEditar, onSituacao }) {
  return (
    <section aria-labelledby="titulo-veiculos-cliente" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="titulo-veiculos-cliente" className="text-lg font-semibold">Veículos</h2>
          <p className="mt-1 text-sm text-slate-600">Veículos vinculados a este cliente.</p>
        </div>
        <Botao onClick={onNovo} disabled={!cliente.ativo}>Adicionar veículo</Botao>
      </div>
      {!cliente.ativo && <p className="text-sm text-slate-600">Ative o cliente para cadastrar ou ativar veículos.</p>}
      {cliente.veiculos.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Nenhum veículo cadastrado para este cliente.</p> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cliente.veiculos.map((veiculo) => (
            <li key={veiculo.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-mono text-lg font-semibold tracking-wider">{veiculo.placa}</h3>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${veiculo.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {veiculo.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-500">Modelo</dt><dd className="mt-1 break-words">{veiculo.modelo ?? '—'}</dd></div>
                <div><dt className="text-slate-500">Cor</dt><dd className="mt-1 break-words">{veiculo.cor ?? '—'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Botao variante="secundario" onClick={() => onEditar(veiculo)} aria-label={`Editar veículo ${veiculo.placa}`}>Editar</Botao>
                {podeGerenciar && <Botao variante="secundario" onClick={() => onSituacao(veiculo)}
                  disabled={!veiculo.ativo && !cliente.ativo} aria-label={`${veiculo.ativo ? 'Inativar' : 'Ativar'} veículo ${veiculo.placa}`}>
                  {veiculo.ativo ? 'Inativar' : 'Ativar'}
                </Botao>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
