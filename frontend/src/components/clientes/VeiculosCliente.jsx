import Icone from '../ui/Icone.jsx';
import Selo from '../ui/Selo.jsx';
import EstadoVazio from '../ui/EstadoVazio.jsx';
import Botao from '../ui/Botao.jsx';
import MaisAcoes from '../ui/MaisAcoes.jsx';

export default function VeiculosCliente({ cliente, podeGerenciar, onNovo, onEditar, onSituacao }) {
  return (
    <section aria-labelledby="titulo-veiculos-cliente" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="titulo-veiculos-cliente" className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight"><Icone nome="veiculo" />Veículos <span className="text-sm font-normal text-muted">({cliente.veiculos.length})</span></h2>
          <p className="mt-1 text-sm text-muted">Veículos vinculados a este cliente.</p>
        </div>
        <Botao onClick={onNovo} disabled={!cliente.ativo}><Icone nome="adicionar" />Adicionar veículo</Botao>
      </div>
      {!cliente.ativo && <p className="text-sm text-muted">Ative o cliente para cadastrar ou ativar veículos.</p>}
      {cliente.veiculos.length === 0 ? <EstadoVazio icone="veiculo" titulo="Nenhum veículo cadastrado" descricao="Os veículos vinculados a este cliente aparecerão aqui." /> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cliente.veiculos.map((veiculo) => (
            <li key={veiculo.id} className="vp-panel space-y-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="vp-plate text-lg">{veiculo.placa}</h3>
<Selo tom={veiculo.ativo ? 'sucesso' : 'neutro'}>{veiculo.ativo ? 'Ativo' : 'Inativo'}</Selo>
              </div>
              <dl className="vp-record-details grid-cols-2">
                <div><dt className="text-muted">Modelo</dt><dd className="mt-1 break-words">{veiculo.modelo ?? '—'}</dd></div>
                <div><dt className="text-muted">Cor</dt><dd className="mt-1 break-words">{veiculo.cor ?? '—'}</dd></div>
              </dl>
              {veiculo.movimentacao_aberta && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">Veículo estacionado. Registre a saída antes de alterar a placa ou inativar.</p>}
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Botao variante="secundario" onClick={() => onEditar(veiculo)} aria-label={`Editar veículo ${veiculo.placa}`}><Icone nome="editar" />Editar</Botao>
                {podeGerenciar && <MaisAcoes ariaLabel={`Mais ações do veículo ${veiculo.placa}`}>
                  <Botao variante="secundario" className="w-full" onClick={() => onSituacao(veiculo)}
                    disabled={veiculo.ativo ? veiculo.movimentacao_aberta : !cliente.ativo} aria-label={`${veiculo.ativo ? 'Inativar' : 'Ativar'} veículo ${veiculo.placa}`}>
                    {veiculo.ativo ? 'Inativar' : 'Ativar'} veículo
                  </Botao>
                </MaisAcoes>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
