import Botao from '../ui/Botao.jsx';
import MaisAcoes from '../ui/MaisAcoes.jsx';
import { formatarCep } from '../../utils/clientes.js';

export default function EnderecosCliente({ cliente, enviando, onNovo, onEditar, onPrincipal, onRemover }) {
  const enderecos = [...cliente.enderecos].sort((a, b) => Number(b.principal) - Number(a.principal) || a.id - b.id);
  return (
    <section aria-labelledby="titulo-enderecos-cliente" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="titulo-enderecos-cliente" className="text-lg font-semibold">Endereços <span className="text-sm font-normal text-slate-500">({enderecos.length})</span></h2><p className="mt-1 text-sm text-slate-600">O endereço principal aparece primeiro.</p></div>
        <Botao onClick={onNovo} disabled={enviando}>Adicionar endereço</Botao>
      </div>
      {enderecos.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">Nenhum endereço cadastrado. Use “Adicionar endereço” para completar a ficha.</p> : (
        <ul className="grid gap-4 lg:grid-cols-2">{enderecos.map((endereco) => (
          <li key={endereco.id} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            {endereco.principal && <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Principal</span>}
            <div className="space-y-1 break-words text-sm"><h3 className="font-semibold">{endereco.logradouro}{endereco.numero ? `, ${endereco.numero}` : ''}</h3>
              {endereco.complemento && <p>{endereco.complemento}</p>}
              <p>{endereco.bairro ? `${endereco.bairro} — ` : ''}{endereco.cidade} / {endereco.estado}</p>
              {endereco.cep && <p>CEP: {formatarCep(endereco.cep)}</p>}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Botao variante="secundario" disabled={enviando} aria-label={`Editar endereço ${endereco.logradouro}`} onClick={() => onEditar(endereco)}>Editar</Botao>
              {!endereco.principal && <Botao variante="secundario" disabled={enviando} onClick={() => onPrincipal(endereco)}>Tornar principal</Botao>}
              <MaisAcoes ariaLabel={`Mais ações do endereço ${endereco.logradouro}`}>
                <Botao variante="secundario" className="w-full" disabled={enviando} onClick={() => onRemover(endereco)}>Remover endereço</Botao>
              </MaisAcoes>
            </div>
          </li>
        ))}</ul>
      )}
    </section>
  );
}
