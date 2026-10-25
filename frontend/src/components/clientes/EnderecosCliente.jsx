import Icone from '../ui/Icone.jsx';
import Selo from '../ui/Selo.jsx';
import EstadoVazio from '../ui/EstadoVazio.jsx';
import Botao from '../ui/Botao.jsx';
import MaisAcoes from '../ui/MaisAcoes.jsx';
import { formatarCep } from '../../utils/clientes.js';

export default function EnderecosCliente({ cliente, enviando, onNovo, onEditar, onPrincipal, onRemover }) {
  const enderecos = [...cliente.enderecos].sort((a, b) => Number(b.principal) - Number(a.principal) || a.id - b.id);
  return (
    <section aria-labelledby="titulo-enderecos-cliente" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="titulo-enderecos-cliente" className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight"><Icone nome="endereco" />Endereços <span className="text-sm font-normal text-muted">({enderecos.length})</span></h2><p className="mt-1 text-sm text-muted">O endereço principal aparece primeiro.</p></div>
        <Botao onClick={onNovo} disabled={enviando}><Icone nome="adicionar" />Adicionar endereço</Botao>
      </div>
      {enderecos.length === 0 ? <EstadoVazio icone="endereco" titulo="Nenhum endereço cadastrado" descricao="Use “Adicionar endereço” para completar a ficha do cliente." /> : (
        <ul className="grid gap-4 lg:grid-cols-2">{enderecos.map((endereco) => (
          <li key={endereco.id} className="vp-panel space-y-4 p-5 sm:p-6">
            {endereco.principal && <Selo tom="sucesso">Principal</Selo>}
            <div className="space-y-1 break-words text-sm"><h3 className="font-semibold">{endereco.logradouro}{endereco.numero ? `, ${endereco.numero}` : ''}</h3>
              {endereco.complemento && <p>{endereco.complemento}</p>}
              <p>{endereco.bairro ? `${endereco.bairro} — ` : ''}{endereco.cidade} / {endereco.estado}</p>
              {endereco.cep && <p>CEP: {formatarCep(endereco.cep)}</p>}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Botao variante="secundario" disabled={enviando} aria-label={`Editar endereço ${endereco.logradouro}`} onClick={() => onEditar(endereco)}><Icone nome="editar" />Editar</Botao>
              {!endereco.principal && <Botao variante="secundario" disabled={enviando} onClick={() => onPrincipal(endereco)}>Tornar principal</Botao>}
              <MaisAcoes ariaLabel={`Mais ações do endereço ${endereco.logradouro}`}>
                <Botao variante="perigo" className="w-full" disabled={enviando} onClick={() => onRemover(endereco)}>Remover endereço</Botao>
              </MaisAcoes>
            </div>
          </li>
        ))}</ul>
      )}
    </section>
  );
}
